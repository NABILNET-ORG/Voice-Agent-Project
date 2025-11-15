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

    // Extract text content from HTML (simple version)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

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
                  text: `Extract all services or products from this website content.

Business category: ${businessCategory || "general"}

Website URL: ${url}

Content:
${textContent.substring(0, 50000)}

Extract each service/product with:
- name (required): Clear, concise service/product name
- description (optional): Brief description
- price (optional): Numeric price only (no currency symbols)
- duration (optional): Duration in minutes (for services)
- category (optional): Service/product category

Return ONLY a valid JSON array of services, nothing else. Example format:
[
  {
    "name": "Basic Haircut",
    "description": "Professional haircut with styling",
    "price": 25,
    "duration": 30,
    "category": "Hair Services"
  },
  {
    "name": "Deluxe Pizza",
    "description": "Large pizza with premium toppings",
    "price": 18.99,
    "category": "Main Dishes"
  }
]

If no services/products found, return empty array: []`,
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
