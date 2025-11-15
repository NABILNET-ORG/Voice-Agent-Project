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
                  text: `Extract services from these ${knowledgeSources.length} knowledge base entries.

Each entry has a TITLE and SUMMARY. The title often contains an Arabic service name. Extract ONE service per entry.

ENTRIES:
${combinedContent.substring(0, 50000)}

For each [Source X: TITLE] entry above:
1. Extract service name from TITLE (the Arabic part before "–")
2. Extract price from summary (look for $ amounts)
3. Extract duration from summary (look for "minutes" or "دقيقة")
4. Use the summary text as description


[{"name":"المكالمة الذهبية 30 دقيقة","price":150,"duration":30,"description":"30-minute consultation"},{"name":"مكالمة الرموز الرونية الذهبية","price":300,"duration":60,"description":"Runic call"}]

Return ONLY the JSON array, nothing else. Extract ${knowledgeSources.length} services (one per source).`,
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
      // Extract JSON from markdown code blocks (handle incomplete blocks)
      let jsonText = extractedText;

      // Try to extract from code block first
      const codeBlockMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      } else {
        // No closing ```, try to extract from opening ``` to end
        const openBlockMatch = extractedText.match(/```(?:json)?\s*([\s\S]*)/);
        if (openBlockMatch) {
          jsonText = openBlockMatch[1];
        }
      }

      // Try to fix incomplete JSON by finding the last complete object
      jsonText = jsonText.trim();
      if (!jsonText.endsWith(']')) {
        // Find the last complete '},' or '}'
        const lastCompleteObject = jsonText.lastIndexOf('}');
        if (lastCompleteObject !== -1) {
          jsonText = jsonText.substring(0, lastCompleteObject + 1) + ']';
          console.log("Fixed incomplete JSON array");
        }
      }

      services = JSON.parse(jsonText);
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
