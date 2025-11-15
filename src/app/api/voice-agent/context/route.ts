import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * GET /api/voice-agent/context
 * Fetches business configuration and knowledge sources for voice agent
 */
export async function GET(request: Request) {
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

    // Fetch business configuration
    const { data: businessConfig, error: configError } = await supabase
      .from("business_config")
      .select(
        `
        business_name,
        business_type,
        business_category,
        business_description,
        services,
        business_hours,
        ai_system_instructions,
        ai_voice,
        ai_voice_personality,
        greeting_template,
        confirmation_template,
        enable_small_talk,
        ai_model_name,
        ai_voice_agent_provider
      `
      )
      .eq("user_id", user.id)
      .single();

    if (configError) {
      console.error("Error fetching business config:", configError);
      return NextResponse.json(
        { error: "Failed to fetch business configuration" },
        { status: 500 }
      );
    }

    // Fetch knowledge sources with summaries
    const { data: knowledgeSources, error: knowledgeError } = await supabase
      .from("knowledge_sources")
      .select("url, title, summary")
      .eq("user_id", user.id)
      .not("summary", "is", null)
      .order("created_at", { ascending: false });

    if (knowledgeError) {
      console.error("Error fetching knowledge sources:", knowledgeError);
      // Don't fail the request if knowledge sources fail
    }

    // Build comprehensive context for voice agent
    const context = {
      business: {
        name: businessConfig.business_name,
        type: businessConfig.business_type,
        category: businessConfig.business_category,
        description: businessConfig.business_description,
        services: businessConfig.services,
        hours: businessConfig.business_hours,
      },
      aiConfig: {
        systemInstructions: businessConfig.ai_system_instructions,
        voice: businessConfig.ai_voice,
        personality: businessConfig.ai_voice_personality,
        greetingTemplate: businessConfig.greeting_template,
        confirmationTemplate: businessConfig.confirmation_template,
        enableSmallTalk: businessConfig.enable_small_talk,
        modelName: businessConfig.ai_model_name,
        provider: businessConfig.ai_voice_agent_provider,
      },
      knowledge: knowledgeSources || [],
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error("Voice agent context API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
