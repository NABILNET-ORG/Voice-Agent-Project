import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { listCalendarEvents } from "@/lib/google-calendar/client";

/**
 * POST /api/bookings/check-availability
 * Check available time slots for a specific date
 * Now includes Google Calendar integration for real availability checking
 */
export async function POST(request: Request) {
  try {
    const { date, service_name, time } = await request.json();

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get business config for scheduling settings
    const { data: config } = await supabase
      .from("business_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: "Business configuration not found" },
        { status: 404 }
      );
    }

    // Get user profile for Google Calendar tokens
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_calendar_access_token, google_calendar_refresh_token")
      .eq("id", user.id)
      .single();

    // Get existing bookings for the date
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date);

    // If specific time requested, check that single slot
    if (time) {
      let isAvailable = true;
      let reason = '';

      // Check database bookings
      const isBookedInDB = bookings?.some(b => b.time === time && b.status !== 'cancelled') || false;
      if (isBookedInDB) {
        isAvailable = false;
        reason = 'Time slot already booked in database';
      }

      // Check Google Calendar if connected
      if (isAvailable && config.google_calendar_sync_enabled && profile?.google_calendar_access_token) {
        try {
          const startDateTime = `${date}T${time}:00`;
          const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString(); // +1 hour

          const calendarEvents = await listCalendarEvents(
            profile.google_calendar_access_token,
            profile.google_calendar_refresh_token,
            config.google_calendar_id || 'primary',
            {
              timeMin: startDateTime,
              timeMax: endDateTime,
              maxResults: 10
            }
          );

          if (calendarEvents && calendarEvents.length > 0) {
            isAvailable = false;
            reason = 'Conflicts with existing calendar event';
          }
        } catch (calendarError) {
          console.error('[Check Availability] Calendar check failed:', calendarError);
          // Don't fail the request if calendar check fails, continue with DB-only check
        }
      }

      return NextResponse.json({
        success: true,
        available: isAvailable,
        date,
        time,
        reason: reason || undefined,
        checked: {
          database: true,
          calendar: config.google_calendar_sync_enabled && !!profile?.google_calendar_access_token
        }
      });
    }

    // Fetch Google Calendar events for the entire day if calendar is connected
    let calendarEvents: any[] = [];
    if (config.google_calendar_sync_enabled && profile?.google_calendar_access_token) {
      try {
        calendarEvents = await listCalendarEvents(
          profile.google_calendar_access_token,
          profile.google_calendar_refresh_token,
          config.google_calendar_id || 'primary',
          {
            timeMin: `${date}T00:00:00Z`,
            timeMax: `${date}T23:59:59Z`,
            maxResults: 50
          }
        ) || [];
      } catch (calendarError) {
        console.error('[Check Availability] Calendar fetch failed:', calendarError);
        // Continue with DB-only check
      }
    }

    // Get current time to filter out past slots
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if requested date is today
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    // Helper function to check if time conflicts with calendar events
    const hasCalendarConflict = (timeSlot: string): boolean => {
      const slotStart = new Date(`${date}T${timeSlot}:00`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // +1 hour default

      return calendarEvents.some(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        return (slotStart < eventEnd && slotEnd > eventStart);
      });
    };

    // Generate time slots (9 AM to 9 PM, every 30 minutes)
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 21 && minute === 30) break; // Stop at 9:00 PM

        // Skip past time slots if checking today
        if (isToday) {
          if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
            continue; // Skip past times
          }
        }

        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Check if slot is booked in database OR calendar
        const isBookedInDB = bookings?.some(b => b.time === time && b.status !== 'cancelled') || false;
        const isBookedInCalendar = hasCalendarConflict(time);
        const isBooked = isBookedInDB || isBookedInCalendar;

        slots.push({
          time,
          available: !isBooked,
          formattedTime: formatTime(time),
          bookedIn: isBooked ? (isBookedInDB ? 'database' : 'calendar') : undefined
        });
      }
    }

    // Filter to only available slots
    const availableSlots = slots.filter(s => s.available);

    return NextResponse.json({
      success: true,
      date,
      service_name,
      totalSlots: slots.length,
      availableSlots: availableSlots.length,
      bookedSlots: slots.length - availableSlots.length,
      slots: availableSlots,
      message: `Found ${availableSlots.length} available time slots for ${date}`
    });
  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
