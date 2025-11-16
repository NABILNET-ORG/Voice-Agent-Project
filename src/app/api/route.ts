import { NextResponse } from "next/server";

/**
 * GET /api
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Voice Agent Booking System API is running",
    version: "1.0.0",
    endpoints: {
      authentication: "/api/auth/*",
      bookings: "/api/bookings",
      analytics: "/api/analytics/*",
      callLogs: "/api/call-logs",
      knowledge: "/api/knowledge",
      profile: "/api/profile",
      voiceAgent: "/api/voice-agent/token",
      calendar: "/api/calendar/events",
      notifications: "/api/notifications/send"
    }
  });
}

/**
 * POST /api
 * Deprecated - use /api/voice-agent/token instead
 */
export async function POST(request: Request) {
  return NextResponse.json({
    error: "Deprecated endpoint",
    message: "Please use POST /api/voice-agent/token for creating voice agent sessions",
    redirectTo: "/api/voice-agent/token"
  }, { status: 410 }); // 410 Gone
}