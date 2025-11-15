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
                  text: `EXTRACT SERVICES FROM KNOWLEDGE BASE SUMMARIES

You will analyze ${knowledgeSources.length} knowledge base summaries about services/products.

HERE IS THE CONTENT TO ANALYZE:
${combinedContent.substring(0, 50000)}

YOUR TASK:
Look at each [Source X: ...] section above. EACH source describes a SERVICE or PRODUCT.

For example, if you see:
"This service offers a 30-minute direct voice call consultation"
or
"**Service:** 30-minute voice call consultation with Madam Samia"

That IS a service! Extract it!

EXTRACTION RULES - VERY IMPORTANT:
1. EACH knowledge source describes at LEAST ONE service/product - extract them ALL
2. Look for service names in BOTH Arabic and English
3. Find the Arabic name in the source title or content (like "المكالمة الذهبية 30 دقيقة")
4. Extract durations (look for "30 minutes", "60 دقيقة", "30-minute", etc.)
5. Extract prices (look for "$150", "$300", "L.L", etc.)
6. Use the ENTIRE summary text as the description
7. DO NOT skip any sources - extract from ALL ${knowledgeSources.length} sources

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

MANDATORY - RETURN AT LEAST ${knowledgeSources.length} SERVICES (one per source minimum):
- Each [Source X: ...] section above = at least 1 service
- Find Arabic names in titles (the part with Arabic text)
- Extract ALL details from each summary
- If summary mentions "30 minutes" or "60 دقيقة", that's the duration
- If summary mentions "$150" or "$300", that's the price
- Use entire summary as description

CRITICAL - DO NOT RETURN EMPTY ARRAY:
- You MUST extract services from these summaries
- Each source describes a service - extract it
- Look for "Service:", "**Service:**", "offers", "provides"
- If stuck, extract based on title and summary combination`,
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

    // DEBUG: Log what Gemini returned
    console.log("=== GEMINI RAW RESPONSE ===");
    console.log("Response length:", extractedText.length);
    console.log("First 500 chars:", extractedText.substring(0, 500));
    console.log("Last 200 chars:", extractedText.substring(extractedText.length - 200));
    console.log("=== END RAW RESPONSE ===");

    // Parse the JSON response
    let services = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : extractedText;
      services = JSON.parse(jsonText.trim());

      console.log("Parsed services count:", services.length);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("AI Response:", extractedText);
      return NextResponse.json(
        {
          error: "Failed to parse extracted services",
          rawResponse: extractedText.substring(0, 1000),
          parseError: parseError.message
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
