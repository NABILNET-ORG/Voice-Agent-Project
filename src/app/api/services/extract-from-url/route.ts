import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * POST /api/services/extract-from-url
 * Extracts services/products from a website URL using AI
 *
 * Modes:
 * - single-page: Extract from current page only (fast, default)
 * - deep-extraction: Extract ALL services from current page thoroughly
 * - full-crawl: Discover and crawl multiple pages from same domain
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

    const {
      url,
      businessCategory,
      mode = 'single-page',  // Default to single-page for backward compatibility
      maxPages = 20  // For full-crawl mode
    } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log(`[URL Extraction] Mode: ${mode}, URL: ${url}, Max pages: ${maxPages}`);

    // Route to appropriate mode handler
    if (mode === 'full-crawl') {
      return await handleFullCrawl(url, businessCategory, config.gemini_api_key, maxPages);
    } else if (mode === 'deep-extraction') {
      return await handleDeepExtraction(url, businessCategory, config.gemini_api_key);
    } else {
      // single-page mode (default)
      return await handleSinglePage(url, businessCategory, config.gemini_api_key);
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
 * Single Page Mode: Extract from current page only (quick, basic extraction)
 */
async function handleSinglePage(
  url: string,
  businessCategory: string | undefined,
  geminiApiKey: string
) {
  const html = await fetchPageHTML(url);
  const cleanedHtml = cleanHTML(html).substring(0, 50000); // Smaller limit for quick extraction

  const prompt = `Extract services/products from this page (quick scan).

Business category: ${businessCategory || "general"}
URL: ${url}

HTML:
${cleanedHtml}

Find main services/products. Extract:
- name, name_ar, name_en
- price (number only)
- duration (minutes)
- description, description_ar, description_en
- category, category_ar, category_en

Return JSON array. Example:
[{"name":"Service","name_ar":"خدمة","name_en":"Service","price":100,"duration":30,"description":"Details","description_ar":"تفاصيل","description_en":"Details","category":"General"}]

If no services, return []`;

  const services = await callGeminiForExtraction(prompt, geminiApiKey, url);

  return NextResponse.json({
    success: true,
    services,
    count: services.length,
    sourceUrl: url,
    mode: 'single-page',
  });
}

/**
 * Deep Extraction Mode: Extract ALL services from current page thoroughly
 */
async function handleDeepExtraction(
  url: string,
  businessCategory: string | undefined,
  geminiApiKey: string
) {
  const html = await fetchPageHTML(url);
  const cleanedHtml = cleanHTML(html).substring(0, 100000); // Full content

  const prompt = `Analyze this HTML page and extract ALL services/products with COMPLETE details.

Business category: ${businessCategory || "general"}
Website URL: ${url}

HTML Content:
${cleanedHtml}

DEEP EXTRACTION INSTRUCTIONS:
1. Analyze FULL HTML structure (headings, paragraphs, lists, divs)
2. Find ALL services/products on the entire page
3. Extract BOTH short AND long descriptions
4. Look in multiple places: titles, excerpts, full content, features, bullets
5. Preserve ORIGINAL LANGUAGE - DO NOT translate
6. Extract ALL pricing and duration information

Extract each service/product with:
- name: Primary name in ORIGINAL language (required)
- name_ar: Arabic name if available
- name_en: English translation
- description_short: Brief 1-2 sentence summary
- description: Complete full description (required)
- description_ar: Arabic full description if available
- description_en: English full description translation
- category, category_ar, category_en
- price: Numeric only
- duration: Minutes only

Return ONLY a valid JSON array:
[{"name":"قراءة التاروت","name_ar":"قراءة التاروت","name_en":"Tarot Reading","description_short":"جلسة قراءة","description":"جلسة كاملة...","description_ar":"جلسة كاملة...","description_en":"Complete session...","price":150,"duration":30,"category":"تاروت","category_ar":"تاروت","category_en":"Tarot"}]

CRITICAL: Extract EVERYTHING from the page. If no services found, return []`;

  const services = await callGeminiForExtraction(prompt, geminiApiKey, url);

  return NextResponse.json({
    success: true,
    services,
    count: services.length,
    sourceUrl: url,
    mode: 'deep-extraction',
  });
}

/**
 * Full Crawl Mode: Discover and crawl multiple pages from same domain
 */
async function handleFullCrawl(
  url: string,
  businessCategory: string | undefined,
  geminiApiKey: string,
  maxPages: number
) {
  const baseUrl = new URL(url);
  const domain = baseUrl.origin;

  // Step 1: Fetch initial page and discover links
  const initialHTML = await fetchPageHTML(url);
  const discoveredLinks = extractLinks(initialHTML, domain);

  // Limit to maxPages
  const pagesToCrawl = [url, ...discoveredLinks.slice(0, maxPages - 1)];

  console.log(`[Full Crawl] Discovered ${discoveredLinks.length} links, crawling ${pagesToCrawl.length} pages`);

  let allServices: any[] = [];
  let crawledPages = 0;

  // Step 2: Crawl each page
  for (const pageUrl of pagesToCrawl) {
    try {
      const html = await fetchPageHTML(pageUrl);
      const cleanedHtml = cleanHTML(html).substring(0, 80000);

      const prompt = `Extract services from this page.

URL: ${pageUrl}
Business: ${businessCategory || "general"}

HTML:
${cleanedHtml}

Extract services with full bilingual details (name_ar/en, description_ar/en, category_ar/en, price, duration).
Return JSON array or [] if none found.`;

      const services = await callGeminiForExtraction(prompt, geminiApiKey, pageUrl);
      allServices = allServices.concat(services);
      crawledPages++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error crawling ${pageUrl}:`, error);
    }
  }

  // Step 3: Deduplicate services
  const uniqueServices = deduplicateServices(allServices);

  return NextResponse.json({
    success: true,
    services: uniqueServices,
    count: uniqueServices.length,
    sourceUrl: url,
    mode: 'full-crawl',
    crawlStats: {
      pagesDiscovered: discoveredLinks.length + 1,
      pagesCrawled: crawledPages,
      servicesFound: allServices.length,
      uniqueServices: uniqueServices.length,
      duplicatesRemoved: allServices.length - uniqueServices.length,
    },
  });
}

/**
 * Helper: Fetch and return HTML content from URL
 */
async function fetchPageHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ServiceExtractor/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Helper: Clean HTML (remove scripts, styles)
 */
function cleanHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
}

/**
 * Helper: Extract links from HTML that belong to same domain
 */
function extractLinks(html: string, domain: string): string[] {
  const linkRegex = /href=["']([^"']+)["']/gi;
  const links = new Set<string>();
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];

      // Skip anchors, mailto, tel, etc.
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      // Build absolute URL
      const absoluteUrl = href.startsWith('http') ? href : new URL(href, domain).href;

      // Only include same domain
      if (absoluteUrl.startsWith(domain)) {
        links.add(absoluteUrl);
      }
    } catch (e) {
      // Skip invalid URLs
    }
  }

  return Array.from(links);
}

/**
 * Helper: Deduplicate services by name and price
 */
function deduplicateServices(services: any[]): any[] {
  const seen = new Map<string, any>();

  for (const service of services) {
    const key = `${service.name?.toLowerCase()}-${service.price}`;

    if (!seen.has(key)) {
      seen.set(key, service);
    } else {
      // Keep the one with longer description
      const existing = seen.get(key);
      if ((service.description?.length || 0) > (existing.description?.length || 0)) {
        seen.set(key, service);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Helper: Call Gemini API and parse response
 */
async function callGeminiForExtraction(
  prompt: string,
  geminiApiKey: string,
  sourceUrl: string
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

  // Parse JSON response
  let services = [];
  try {
    const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : extractedText;
    services = JSON.parse(jsonText.trim());
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    console.log("AI Response:", extractedText.substring(0, 1000));
    return [];  // Return empty array instead of throwing
  }

  // Validate and clean services
  const validServices = services
    .filter((s: any) => s.name && s.name.trim())
    .map((s: any, index: number) => ({
      id: `url-extracted-${Date.now()}-${index}`,
      name: s.name.trim(),
      name_ar: s.name_ar?.trim() || s.name.trim(),
      name_en: s.name_en?.trim() || s.name.trim(),
      description: s.description?.trim() || "",
      description_ar: s.description_ar?.trim() || s.description?.trim() || "",
      description_en: s.description_en?.trim() || s.description?.trim() || "",
      description_short: s.description_short?.trim() || "",
      price: s.price ? parseFloat(s.price) : 0,
      duration: s.duration ? parseInt(s.duration) : undefined,
      category: s.category?.trim() || "General",
      category_ar: s.category_ar?.trim() || s.category?.trim() || "عام",
      category_en: s.category_en?.trim() || "General",
      source: sourceUrl,
      selected: true,
    }));

  return validServices;
}
