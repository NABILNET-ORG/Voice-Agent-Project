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

    // Fetch ALL business configuration (all settings for AI knowledge)
    const { data: businessConfig, error: configError } = await supabase
      .from("business_config")
      .select("*")
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

    // Build comprehensive context for voice agent (ALL settings data)
    const context = {
      business: {
        name: businessConfig.business_name,
        type: businessConfig.business_type,
        category: businessConfig.business_category,
        description: businessConfig.business_description,
        phone: businessConfig.phone_number,
        address: businessConfig.address,
        website: businessConfig.website,
        language: businessConfig.primary_language,
        currency: businessConfig.currency,
        timezone: businessConfig.timezone,
      },
      services: businessConfig.services || [],
      schedule: {
        hours: businessConfig.business_hours,
        is24_7: businessConfig.is_24_7,
        breakTimes: businessConfig.break_times,
      },
      booking: {
        bufferMinutes: businessConfig.booking_buffer_minutes,
        maxAdvanceDays: businessConfig.max_advance_booking_days,
        minAdvanceHours: businessConfig.min_advance_booking_hours,
        allowSameDay: businessConfig.allow_same_day,
        maxPerDay: businessConfig.max_appointments_per_day,
      },
      delivery: businessConfig.business_category === 'delivery' ? {
        zones: businessConfig.delivery_zones,
        defaultTimeMinutes: businessConfig.default_delivery_time_minutes,
        minimumOrderAmount: businessConfig.minimum_order_amount,
        maxRadiusKm: businessConfig.max_delivery_radius_km,
        acceptOutsideHours: businessConfig.accept_orders_outside_hours,
      } : null,
      emergency: businessConfig.business_category === 'emergency' ? {
        serviceAreas: businessConfig.service_areas,
        available: businessConfig.emergency_available,
        surcharge: businessConfig.emergency_surcharge,
        weekendSurcharge: businessConfig.weekend_surcharge,
        afterHoursSurcharge: businessConfig.after_hours_surcharge,
        responseTimes: businessConfig.response_times,
      } : null,
      calendar: {
        googleCalendarId: businessConfig.google_calendar_id,
        syncEnabled: businessConfig.google_calendar_sync_enabled,
        syncFrequency: businessConfig.calendar_sync_frequency,
        eventTitleTemplate: businessConfig.calendar_event_title_template,
        addCustomerPhone: businessConfig.add_customer_phone_to_event,
        setReminder: businessConfig.set_event_reminder,
        reminderMinutes: businessConfig.event_reminder_minutes,
      },
      aiConfig: {
        systemInstructions: businessConfig.ai_system_instructions,
        voice: businessConfig.ai_voice,
        personality: businessConfig.ai_voice_personality,
        greetingTemplate: businessConfig.greeting_template,
        confirmationTemplate: businessConfig.confirmation_template,
        enableSmallTalk: businessConfig.enable_small_talk,
        askForEmail: businessConfig.ask_for_email,
        confirmBeforeBooking: businessConfig.confirm_before_booking,
        maxCallDuration: businessConfig.max_call_duration_minutes,
        voiceDetectionSensitivity: businessConfig.voice_detection_sensitivity,
        speechSpeed: businessConfig.speech_speed,
        enableCallRecording: businessConfig.enable_call_recording,
        backgroundNoiseHandling: businessConfig.background_noise_handling,
        modelName: businessConfig.ai_model_name,
        provider: businessConfig.ai_voice_agent_provider,
      },
      notifications: {
        customer: {
          email: businessConfig.customer_notification_email,
          sms: businessConfig.customer_notification_sms,
          sendReminders: businessConfig.send_reminder_notifications,
          reminderHoursBefore: businessConfig.reminder_hours_before,
          language: businessConfig.notification_language,
        },
        owner: {
          email: businessConfig.owner_notification_email,
          sendEmail: businessConfig.send_owner_email,
          phone: businessConfig.owner_notification_phone,
          sendSMS: businessConfig.send_owner_sms,
        },
        triggers: businessConfig.notification_triggers,
        instantConfirmation: businessConfig.send_instant_confirmation,
      },
      payment: {
        acceptedMethods: businessConfig.accepted_payment_methods,
        requireUpfront: businessConfig.require_payment_upfront,
        depositAmount: businessConfig.deposit_amount,
        depositType: businessConfig.deposit_type,
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
