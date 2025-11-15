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
                  text: `Extract ALL services or products mentioned across these knowledge base sources.

Business category: ${businessCategory || "general"}

Total sources: ${knowledgeSources.length}

Knowledge Base Content:
${combinedContent.substring(0, 50000)}

IMPORTANT INSTRUCTIONS:
1. Look for ANY items that could be services or products (books, readings, crystals, tools, courses, sessions, etc.)
2. Extract EVERYTHING mentioned, even if only briefly
3. Preserve the ORIGINAL LANGUAGE - do NOT translate (keep Arabic as Arabic, French as French, etc.)
4. Extract ALL available information including full descriptions
5. Look for prices in any currency format

Extract each service/product with:
- name (required): ORIGINAL name in ORIGINAL language - DO NOT TRANSLATE
- description (required): FULL description in ORIGINAL language - extract ALL details found
- price (optional): Numeric price only (no currency symbols)
- duration (optional): Duration in minutes (for services)
- category (optional): Service/product category in ORIGINAL language
- sourceIndex (optional): Which source number mentioned this (1-${knowledgeSources.length})

Return ONLY a valid JSON array of ALL unique services/products found, nothing else. Example format:
[
  {
    "name": "قراءة التاروت",
    "description": "جلسة قراءة التاروت الشخصية لمدة 30 دقيقة مع تفسير شامل للبطاقات",
    "price": 45,
    "duration": 30,
    "category": "القراءات",
    "sourceIndex": 1
  },
  {
    "name": "Crystal Healing Book",
    "description": "Comprehensive guide to crystal healing practices and techniques for beginners",
    "price": 25,
    "category": "Books",
    "sourceIndex": 2
  }
]

CRITICAL:
- DO NOT translate anything - keep original language
- Extract COMPLETE descriptions, not just summaries
- Include EVERY product/service mentioned
- If no services/products found, return empty array: []`,
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
