import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * POST /api/bookings/check-availability
 * Check available time slots for a specific date
 */
export async function POST(request: Request) {
  try {
    const { date, service_name } = await request.json();

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

    // Get existing bookings for the date
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date);

    // Get current time to filter out past slots
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if requested date is today
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

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

        // Check if slot is booked
        const isBooked = bookings?.some(b => b.time === time) || false;

        slots.push({
          time,
          available: !isBooked,
          formattedTime: formatTime(time)
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
