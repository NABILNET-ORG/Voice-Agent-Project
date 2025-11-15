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

    // Fetch ALL knowledge sources (with or without summaries)
    const { data: allSources, error: knowledgeError } = await supabase
      .from("knowledge_sources")
      .select("url, title, summary, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (knowledgeError) {
      console.error("Error fetching knowledge sources:", knowledgeError);
      return NextResponse.json(
        { error: "Failed to fetch knowledge sources" },
        { status: 500 }
      );
    }

    if (!allSources || allSources.length === 0) {
      return NextResponse.json({
        success: true,
        services: [],
        count: 0,
        message: "No knowledge sources available",
        mode,
      });
    }

    // Filter to only product/service pages
    const knowledgeSources = allSources.filter(source => isProductServiceSource(source));

    console.log(`[KB Extraction] Filtered ${allSources.length} sources to ${knowledgeSources.length} product/service pages`);

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
    .map((source, idx) => {
      const text = source.summary || source.content?.substring(0, 1000) || '';
      return `${idx + 1}. "${source.title?.split('–')[0]?.trim() || 'Untitled'}" - ${text.substring(0, 800)}`;
    })
    .join('\n\n');

  const prompt = `Extract services from these ${topSources.length} knowledge base entries.

IMPORTANT: Each entry represents ONE service/product. The TITLE contains the service name.

ENTRIES:
${combinedContent}

For EACH entry above (${topSources.length} total):
1. The TITLE is the service name (e.g., "مكالمة التاروت الذهبية 60 دقيقة" = service name)
2. Extract price from summary (look for $ amounts, numbers with currency)
3. Extract duration from TITLE or summary (look for "30 دقيقة", "60 دقيقة", "minutes")
4. Use summary as description
5. Provide BOTH Arabic (name_ar) AND English translation (name_en)

CRITICAL: Extract ${topSources.length} services (ONE per entry). Do NOT skip any entry.

Return ONLY a JSON array with ${topSources.length} objects:
[{"name":"مكالمة التاروت","name_ar":"مكالمة التاروت","name_en":"Tarot Call","price":150,"duration":30,"description":"Summary text","description_ar":"نص الملخص","description_en":"Summary text","category":"تاروت","category_ar":"تاروت","category_en":"Tarot"}]

Must return ${topSources.length} services.`;

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
      .map((source, idx) => {
        const text = source.summary || source.content?.substring(0, 1000) || '';
        return `${i + idx + 1}. "${source.title?.split('–')[0]?.trim() || 'Untitled'}" - ${text.substring(0, 500)}`;
      })
      .join('\n\n');

    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(knowledgeSources.length / BATCH_SIZE)}: ${batch.length} sources`);

    const prompt = `Extract services from these ${batch.length} knowledge base entries.

IMPORTANT: Each entry represents ONE service/product. The TITLE contains the service name.

ENTRIES:
${batchContent}

For EACH entry above (${batch.length} total):
1. The TITLE is the service name (extract the Arabic part before "–")
2. Extract price from summary (look for $ amounts, numbers)
3. Extract duration from TITLE or summary (look for "30 دقيقة", "60 دقيقة", "minutes")
4. Use summary as full description
5. Provide BOTH Arabic (name_ar) AND English translation (name_en)

CRITICAL: Extract ${batch.length} services (ONE per entry). Do NOT skip any entry.

Return ONLY JSON array with ${batch.length} objects:
[{"name":"مكالمة التاروت","name_ar":"مكالمة التاروت","name_en":"Tarot Call","price":150,"duration":30,"description":"Full summary","description_ar":"الملخص الكامل","description_en":"Full summary","category":"تاروت","category_ar":"تاروت","category_en":"Tarot"}]

Must return ${batch.length} services.`;

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
  const text = source.summary || source.content?.substring(0, 1000) || '';
  const content = `"${source.title?.split('–')[0]?.trim() || 'Untitled'}" - ${text.substring(0, 1000)}`;

  const prompt = `Extract service from this knowledge base entry.

IMPORTANT: This entry represents ONE service/product. The TITLE is the service name.

ENTRY:
${content}

Extract this service:
1. The TITLE is the service name (extract the Arabic part before "–")
2. Extract price from text (look for $ amounts, numbers)
3. Extract duration from TITLE or text (look for "30 دقيقة", "60 دقيقة", "minutes")
4. Use full text as description
5. Provide BOTH Arabic (name_ar) AND English translation (name_en)

CRITICAL: Always extract this as a service. Do NOT return [].

Return JSON array with ONE service:
[{"name":"مكالمة التاروت","name_ar":"مكالمة التاروت","name_en":"Tarot Call","price":150,"duration":30,"description":"Full text","description_ar":"النص الكامل","description_en":"Full text","category":"تاروت","category_ar":"تاروت","category_en":"Tarot"}]`;

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

/**
 * Filter function: Check if KB source is a product/service page
 */
function isProductServiceSource(source: any): boolean {
  const title = source.title?.toLowerCase() || '';
  const url = source.url?.toLowerCase() || '';

  // Exclude non-service pages by title/URL keywords
  const excludeKeywords = [
    'registration', 'register', 'sign up', 'login',
    'refund', 'policy', 'privacy', 'terms', 'conditions',
    'about', 'contact', 'faq', 'help', 'support',
    'blog', 'article', 'news', 'post',
    'cart', 'checkout', 'account', 'my account'
  ];

  for (const keyword of excludeKeywords) {
    if (title.includes(keyword) || url.includes(keyword)) {
      return false;
    }
  }

  // Include pages with product/service indicators
  const includeKeywords = [
    'product', 'service', 'menu', 'package', 'plan',
    'pricing', 'price', 'offer', 'deal',
    'consultation', 'reading', 'session',
    // Arabic keywords
    'خدمة', 'منتج', 'مكالمة', 'قراءة', 'جلسة'
  ];

  for (const keyword of includeKeywords) {
    if (title.includes(keyword) || url.includes(keyword)) {
      return true;
    }
  }

  // If URL contains /product/ or /service/ path, include it
  if (url.includes('/product/') || url.includes('/service/') || url.includes('/menu/')) {
    return true;
  }

  // Default: exclude if no indicators found
  return false;
}
