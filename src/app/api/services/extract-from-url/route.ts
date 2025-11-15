import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * POST /api/services/extract-from-url
 * Extracts services/products from a website URL using AI
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

    const { url, businessCategory } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ServiceExtractor/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Send full HTML to Gemini (it can parse HTML structure)
    // This preserves layout, headings, lists, and descriptions better
    const cleanedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .substring(0, 100000); // Send more content (100KB limit)

    // Use AI to extract services/products
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
                  text: `Analyze this HTML page and extract ALL services/products with COMPLETE details.

Business category: ${businessCategory || "general"}
Website URL: ${url}

HTML Content (analyze structure, headings, paragraphs, lists):
${cleanedHtml}

CRAWLING INSTRUCTIONS:
1. Analyze the FULL HTML structure (headings, paragraphs, lists, divs)
2. Find ALL services/products on the entire page
3. Extract BOTH short AND long descriptions:
   - Short description: Brief summary (1-2 sentences)
   - Long description: Complete details, benefits, features, what's included
4. Look in multiple places:
   - Product titles/headings
   - Short descriptions (excerpts, summaries)
   - Long descriptions (full content sections, expandable text)
   - Feature lists, bullet points
   - "What you get" or "Includes" sections
5. Preserve ORIGINAL LANGUAGE - DO NOT translate
6. Extract ALL pricing information
7. Look for duration/timing information

Extract each service/product with:
- name: Primary name in ORIGINAL language (required)
- name_ar: Arabic name if available
- name_en: English translation (you can provide this)
- description_short: Brief 1-2 sentence summary in ORIGINAL language
- description: Complete full description in ORIGINAL language (required)
- description_ar: Arabic full description if available
- description_en: English full description translation
- category: Category in original language
- category_ar: Arabic category if available
- category_en: English category translation
- price: Numeric only, no currency symbols
- duration: Minutes only

Return ONLY a valid JSON array. Example showing SHORT + LONG descriptions:
[
  {
    "name": "قراءة التاروت الشاملة",
    "name_ar": "قراءة التاروت الشاملة",
    "name_en": "Comprehensive Tarot Reading",
    "description_short": "جلسة قراءة تاروت شخصية لمدة 30 دقيقة",
    "description": "جلسة قراءة تاروت كاملة لمدة 30 دقيقة تشمل تفسير شامل للبطاقات، توجيهات شخصية للمستقبل، تحليل عميق للوضع الحالي، والإجابة على جميع أسئلتك الروحانية مع نصائح وإرشادات مخصصة",
    "description_ar": "جلسة قراءة تاروت كاملة لمدة 30 دقيقة تشمل تفسير شامل للبطاقات، توجيهات شخصية للمستقبل، تحليل عميق للوضع الحالي، والإجابة على جميع أسئلتك الروحانية مع نصائح وإرشادات مخصصة",
    "description_en": "Complete 30-minute tarot reading session including comprehensive card interpretation, personal future guidance, deep analysis of current situation, and answers to all your spiritual questions with personalized advice and guidance",
    "price": 150,
    "duration": 30,
    "category": "تاروت",
    "category_ar": "تاروت",
    "category_en": "Tarot"
  }
]

CRITICAL:
- Analyze FULL HTML structure to find all details
- Extract short description (excerpt/summary) AND long description (full details)
- Keep Arabic as primary language
- Auto-generate English translations
- Extract EVERYTHING from the page
- If no services found, return []`,
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
      .map((s: any, index: number) => ({
        id: `extracted-${Date.now()}-${index}`,
        name: s.name.trim(),
        description: s.description?.trim() || "",
        price: s.price ? parseFloat(s.price) : 0,
        duration: s.duration ? parseInt(s.duration) : undefined,
        category: s.category?.trim() || "General",
        source: url,
        selected: true, // Default to selected for review
      }));

    return NextResponse.json({
      success: true,
      services: validServices,
      count: validServices.length,
      sourceUrl: url,
    });
  } catch (error) {
    console.error("Service extraction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
