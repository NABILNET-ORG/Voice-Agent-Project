import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * POST /api/services/extract-from-knowledge
 * Extracts services/products from existing knowledge base sources
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessCategory } = await request.json();

    // Fetch Gemini API key from business config
    const { data: config } = await supabase
      .from("business_config")
      .select("gemini_api_key")
      .eq("user_id", user.id)
      .single();

    if (!config?.gemini_api_key) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please configure it in AI Integrations." },
        { status: 400 }
      );
    }

    // Fetch all knowledge sources with summaries
    const { data: knowledgeSources, error: knowledgeError } = await supabase
      .from("knowledge_sources")
      .select("url, title, summary, content")
      .eq("user_id", user.id)
      .not("summary", "is", null)
      .order("created_at", { ascending: false });

    if (knowledgeError) {
      console.error("Error fetching knowledge sources:", knowledgeError);
      return NextResponse.json(
        { error: "Failed to fetch knowledge sources" },
        { status: 500 }
      );
    }

    if (!knowledgeSources || knowledgeSources.length === 0) {
      return NextResponse.json({
        success: true,
        services: [],
        count: 0,
        message: "No knowledge sources available",
      });
    }

    // Combine all summaries for AI analysis
    const combinedContent = knowledgeSources
      .map(
        (source, i) =>
          `[Source ${i + 1}: ${source.title || source.url}]\n${source.summary || source.content?.substring(0, 5000) || ""}`
      )
      .join("\n\n");

    // Use AI to extract services/products from all knowledge
    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.gemini_api_key,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are analyzing knowledge base summaries that describe services/products.

Business category: ${businessCategory || "general"}
Total sources: ${knowledgeSources.length}

Knowledge Base Summaries:
${combinedContent.substring(0, 50000)}

TASK: Extract ALL services/products from these summaries.

The summaries describe services and often include:
- Service names (may be in Arabic like "المكالمة الذهبية" or English)
- Prices (like "$300.00" or "L.L 13,425,564")
- Durations (like "30 minutes" or "60 دقيقة")
- Descriptions of what the service includes

EXTRACTION RULES:
1. Find EVERY service/product mentioned in ANY source
2. Use ARABIC names if provided (like "المكالمة الذهبية" not "Golden Call")
3. Extract the COMPLETE description from the summary
4. Extract prices (use USD if multiple currencies shown)
5. Extract duration if mentioned
6. If summary says "Service: X" or "**Service:** X" - that's a service!

For EACH service/product found, extract:
- name: Use Arabic name if provided, otherwise English (required)
- name_ar: Arabic name if available
- name_en: English translation if summary provides it
- description: Full description from summary (required)
- description_ar: Arabic description if available
- description_en: English description if available
- price: Numeric only, no currency symbols
- duration: Minutes only
- category: Category in original language
- sourceIndex: Which source (1-${knowledgeSources.length})

Return ONLY a valid JSON array. Example based on actual knowledge base:
[
  {
    "name": "المكالمة الذهبية 30 دقيقة",
    "name_ar": "المكالمة الذهبية 30 دقيقة",
    "name_en": "Golden Call 30 Minutes",
    "description": "جلسة قراءة تاروت مباشرة عبر الهاتف لمدة 30 دقيقة مع السيدة سامية",
    "description_ar": "جلسة قراءة تاروت مباشرة عبر الهاتف لمدة 30 دقيقة مع السيدة سامية",
    "description_en": "30-minute live phone tarot reading with Madame Samia",
    "price": 150,
    "duration": 30,
    "category": "تاروت",
    "category_ar": "تاروت",
    "category_en": "Tarot",
    "sourceIndex": 1
  },
  {
    "name": "مكالمة الرموز الرونية الذهبية",
    "name_ar": "مكالمة الرموز الرونية الذهبية",
    "name_en": "Golden Runic Symbols Call",
    "description": "استشارة روحانية متخصصة باستخدام الرموز الرونية",
    "price": 300,
    "duration": 60,
    "category": "رونية",
    "sourceIndex": 2
  }
]

CRITICAL:
- Extract bilingual names/descriptions when available
- Use Arabic as primary name if present
- Include ALL services mentioned
- Extract complete descriptions from summaries
- If no services found, return []: []`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: "Failed to extract services with AI" },
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const extractedText =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Parse the JSON response
    let services = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : extractedText;
      services = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("AI Response:", extractedText);
      return NextResponse.json(
        {
          error: "Failed to parse extracted services",
          rawResponse: extractedText,
        },
        { status: 500 }
      );
    }

    // Validate and clean services
    const validServices = services
      .filter((s: any) => s.name && s.name.trim())
      .map((s: any, index: number) => {
        const sourceInfo = s.sourceIndex
          ? knowledgeSources[s.sourceIndex - 1]
          : null;
        return {
          id: `kb-extracted-${Date.now()}-${index}`,
          name: s.name.trim(),
          description: s.description?.trim() || "",
          price: s.price ? parseFloat(s.price) : 0,
          duration: s.duration ? parseInt(s.duration) : undefined,
          category: s.category?.trim() || "General",
          source: sourceInfo
            ? `Knowledge Base: ${sourceInfo.title || sourceInfo.url}`
            : "Knowledge Base",
          sourceUrl: sourceInfo?.url,
          selected: true, // Default to selected for review
        };
      });

    return NextResponse.json({
      success: true,
      services: validServices,
      count: validServices.length,
      sourcesAnalyzed: knowledgeSources.length,
    });
  } catch (error) {
    console.error("Service extraction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
