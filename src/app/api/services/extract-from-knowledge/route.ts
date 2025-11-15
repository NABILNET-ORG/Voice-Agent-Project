import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * POST /api/services/extract-from-knowledge
 * Extracts services/products from existing knowledge base sources
 *
 * Modes:
 * - simple-query: Query 1-2 most relevant KB sources (fast, minimal context)
 * - full-context: Process all KB sources in batches (comprehensive, slower)
 * - batch: Process sources one-by-one with progress tracking (streaming)
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

    const {
      businessCategory,
      mode = 'simple-query',  // Default to simple-query for backward compatibility
      batchIndex = 0  // For batch mode
    } = await request.json();

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
        mode,
      });
    }

    console.log(`[KB Extraction] Mode: ${mode}, Total sources: ${knowledgeSources.length}, Batch index: ${batchIndex}`);

    // Route to appropriate mode handler
    if (mode === 'simple-query') {
      return await handleSimpleQuery(knowledgeSources, businessCategory, config.gemini_api_key, user.id);
    } else if (mode === 'batch') {
      return await handleBatchMode(knowledgeSources, batchIndex, businessCategory, config.gemini_api_key, user.id);
    } else {
      // full-context mode (default for comprehensive extraction)
      return await handleFullContext(knowledgeSources, businessCategory, config.gemini_api_key, user.id);
    }
  } catch (error) {
    console.error("Service extraction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Simple Query Mode: Extract from top 2-3 most relevant sources
 * Fast, minimal token usage, good for initial query
 */
async function handleSimpleQuery(
  knowledgeSources: any[],
  businessCategory: string | undefined,
  geminiApiKey: string,
  userId: string
) {
  // Take only the first 2-3 sources (most recent)
  const topSources = knowledgeSources.slice(0, 3);

  const combinedContent = topSources
    .map((source, idx) =>
      `${idx + 1}. "${source.title?.split('–')[0]?.trim() || 'Untitled'}" - ${source.summary?.substring(0, 800) || ''}`
    )
    .join('\n\n');

  const prompt = `Extract services from these ${topSources.length} knowledge base entries.

Each entry has a TITLE and SUMMARY. Extract ONE service per entry if it's a service/product.

ENTRIES:
${combinedContent}

For each entry:
1. Extract service name from TITLE (Arabic or English)
2. Extract price from summary (look for $ amounts or numbers)
3. Extract duration from summary (look for "minutes", "دقيقة", time info)
4. Use summary as description
5. Extract both Arabic AND English names/descriptions if available

Return ONLY a JSON array like:
[{"name":"Service Name","name_ar":"اسم الخدمة","name_en":"Service Name","price":150,"duration":30,"description":"Details","description_ar":"التفاصيل","description_en":"Details","category":"General"}]

Extract up to ${topSources.length} services. Return [] if no services found.`;

  const services = await callGeminiExtraction(prompt, geminiApiKey, topSources);

  return NextResponse.json({
    success: true,
    services,
    count: services.length,
    sourcesAnalyzed: topSources.length,
    mode: 'simple-query',
  });
}

/**
 * Full Context Mode: Process ALL sources in batches
 * Comprehensive extraction using batch processing to avoid token limits
 */
async function handleFullContext(
  knowledgeSources: any[],
  businessCategory: string | undefined,
  geminiApiKey: string,
  userId: string
) {
  const BATCH_SIZE = 8;  // Process 8 sources per AI call
  let allServices: any[] = [];

  for (let i = 0; i < knowledgeSources.length; i += BATCH_SIZE) {
    const batch = knowledgeSources.slice(i, i + BATCH_SIZE);
    const batchContent = batch
      .map((source, idx) =>
        `${i + idx + 1}. "${source.title?.split('–')[0]?.trim() || 'Untitled'}" - ${source.summary?.substring(0, 500) || ''}`
      )
      .join('\n\n');

    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(knowledgeSources.length / BATCH_SIZE)}: ${batch.length} sources`);

    const prompt = `Extract services from these ${batch.length} knowledge base entries.

Each entry has a TITLE and SUMMARY. Extract ONE service per entry if applicable.

ENTRIES:
${batchContent}

For each entry:
1. Extract service name from TITLE (Arabic/English)
2. Extract price from summary ($ or numbers)
3. Extract duration (minutes, دقيقة)
4. Use summary as description
5. Extract BOTH Arabic AND English versions (name_ar, name_en, description_ar, description_en)

Return ONLY JSON array:
[{"name":"Name","name_ar":"اسم","name_en":"Name","price":150,"duration":30,"description":"Text","description_ar":"نص","description_en":"Text","category":"General"}]

Extract ${batch.length} services (one per entry).`;

    const batchServices = await callGeminiExtraction(prompt, geminiApiKey, batch);
    allServices = allServices.concat(batchServices);
  }

  return NextResponse.json({
    success: true,
    services: allServices,
    count: allServices.length,
    sourcesAnalyzed: knowledgeSources.length,
    mode: 'full-context',
  });
}

/**
 * Batch Mode: Process one source at a time with progress tracking
 * Allows frontend to show real-time progress
 */
async function handleBatchMode(
  knowledgeSources: any[],
  batchIndex: number,
  businessCategory: string | undefined,
  geminiApiKey: string,
  userId: string
) {
  if (batchIndex >= knowledgeSources.length) {
    return NextResponse.json({
      success: true,
      services: [],
      count: 0,
      sourcesAnalyzed: 0,
      mode: 'batch',
      batchProgress: {
        current: knowledgeSources.length,
        total: knowledgeSources.length,
        percentage: 100,
        hasMore: false,
      },
    });
  }

  const source = knowledgeSources[batchIndex];
  const content = `"${source.title?.split('–')[0]?.trim() || 'Untitled'}" - ${source.summary?.substring(0, 1000) || ''}`;

  const prompt = `Extract service from this knowledge base entry.

ENTRY:
${content}

If this is a service/product:
1. Extract service name from title (Arabic/English)
2. Extract price from text ($ or numbers)
3. Extract duration (minutes, دقيقة)
4. Use full text as description
5. Provide BOTH Arabic AND English versions

Return JSON array with one service (or [] if not a service):
[{"name":"Name","name_ar":"اسم","name_en":"Name","price":150,"duration":30,"description":"Full description","description_ar":"وصف كامل","description_en":"Full description","category":"General"}]`;

  const services = await callGeminiExtraction(prompt, geminiApiKey, [source]);

  return NextResponse.json({
    success: true,
    services,
    count: services.length,
    sourcesAnalyzed: 1,
    mode: 'batch',
    batchProgress: {
      current: batchIndex + 1,
      total: knowledgeSources.length,
      percentage: Math.round(((batchIndex + 1) / knowledgeSources.length) * 100),
      hasMore: batchIndex + 1 < knowledgeSources.length,
    },
  });
}

/**
 * Shared function to call Gemini and parse the response
 */
async function callGeminiExtraction(
  prompt: string,
  geminiApiKey: string,
  knowledgeSources: any[]
): Promise<any[]> {
  const aiResponse = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
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
    throw new Error("Failed to extract services with AI");
  }

  const aiData = await aiResponse.json();
  const extractedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  console.log("Gemini response length:", extractedText.length);

  // Parse JSON response
  let services = [];
  try {
    let jsonText = extractedText;

    // Extract from code block
    const codeBlockMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      const openBlockMatch = extractedText.match(/```(?:json)?\s*([\s\S]*)/);
      if (openBlockMatch) {
        jsonText = openBlockMatch[1];
      }
    }

    // Fix incomplete JSON
    jsonText = jsonText.trim();
    if (!jsonText.endsWith(']')) {
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
    console.log("AI Response:", extractedText.substring(0, 1000));
    return [];  // Return empty array instead of throwing
  }

  // Validate and clean services
  const validServices = services
    .filter((s: any) => s.name && s.name.trim())
    .map((s: any, index: number) => {
      const sourceInfo = s.sourceIndex && knowledgeSources[s.sourceIndex - 1]
        ? knowledgeSources[s.sourceIndex - 1]
        : knowledgeSources[0];  // Default to first source

      return {
        id: `kb-extracted-${Date.now()}-${index}`,
        name: s.name.trim(),
        name_ar: s.name_ar?.trim() || s.name.trim(),
        name_en: s.name_en?.trim() || s.name.trim(),
        description: s.description?.trim() || "",
        description_ar: s.description_ar?.trim() || s.description?.trim() || "",
        description_en: s.description_en?.trim() || s.description?.trim() || "",
        price: s.price ? parseFloat(s.price) : 0,
        duration: s.duration ? parseInt(s.duration) : undefined,
        category: s.category?.trim() || "General",
        category_ar: s.category_ar?.trim() || s.category?.trim() || "عام",
        category_en: s.category_en?.trim() || "General",
        source: sourceInfo
          ? `Knowledge Base: ${sourceInfo.title || sourceInfo.url}`
          : "Knowledge Base",
        sourceUrl: sourceInfo?.url,
        selected: true,
      };
    });

  return validServices;
}
