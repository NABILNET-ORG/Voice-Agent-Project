import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: Request) {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      service_name,
      date,
      time,
      notes
    } = await request.json();

    // Validate required fields
    if (!customer_name || !customer_email || !service_name || !date || !time) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["customer_name", "customer_email", "service_name", "date", "time"]
        },
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

    // Check if slot is already booked
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("time", time)
      .single();

    if (existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: "This time slot is already booked",
          suggestion: "Please choose a different time"
        },
        { status: 409 }
      );
    }

    // Create the booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        service_or_item: service_name,  // Use correct column name
        date,
        time,
        notes: notes || "",
        status: "confirmed",
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Booking creation error:", error);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
      message: `Booking confirmed for ${customer_name} on ${date} at ${time}`,
      confirmation: {
        booking_id: booking.id,
        customer_name,
        service_name,
        date,
        time,
        status: "confirmed"
      }
    });
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * Get all bookings for the current user
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
