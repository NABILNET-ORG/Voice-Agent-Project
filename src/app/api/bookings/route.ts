import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * Calculate pricing for a booking
 */
function calculatePricing(params: {
  basePrice: number;
  bookingType?: string;
  quantity?: number;
  deliveryRequired?: boolean;
  deliveryDistance?: number;
  taxRate?: number;
  serviceFeeRate?: number;
  discountAmount?: number;
  discountPercent?: number;
}) {
  const {
    basePrice,
    quantity = 1,
    deliveryRequired = false,
    deliveryDistance = 0,
    taxRate = 0.15, // Default 15% tax
    serviceFeeRate = 0.05, // Default 5% service fee
    discountAmount = 0,
    discountPercent = 0
  } = params;

  // Calculate base amount
  const subtotal = basePrice * quantity;

  // Calculate delivery fee (if applicable)
  let deliveryFee = 0;
  if (deliveryRequired) {
    // Base delivery fee + distance fee ($1 per km)
    deliveryFee = 5 + (deliveryDistance * 1);
  }

  // Calculate service fee
  const serviceFee = subtotal * serviceFeeRate;

  // Calculate subtotal before tax
  const subtotalBeforeTax = subtotal + deliveryFee + serviceFee;

  // Calculate discount
  let discount = discountAmount;
  if (discountPercent > 0) {
    discount = subtotalBeforeTax * (discountPercent / 100);
  }

  // Calculate amount after discount
  const amountAfterDiscount = subtotalBeforeTax - discount;

  // Calculate tax
  const taxAmount = amountAfterDiscount * taxRate;

  // Calculate total
  const total = amountAfterDiscount + taxAmount;

  return {
    base_price: Math.round(basePrice * 100) / 100,
    quantity,
    subtotal: Math.round(subtotal * 100) / 100,
    delivery_fee: Math.round(deliveryFee * 100) / 100,
    service_fee: Math.round(serviceFee * 100) / 100,
    discount_amount: Math.round(discount * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total_amount: Math.round(total * 100) / 100
  };
}

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
      customer_address,
      service_name,
      category,
      booking_type,
      date,
      time,
      duration_minutes,
      notes,
      special_instructions,
      quantity,
      base_price,
      delivery_required,
      delivery_distance,
      items,
      discount_amount,
      discount_percent
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

    // Get business config for pricing settings
    const { data: config } = await supabase
      .from("business_config")
      .select("services, tax_rate, service_fee_enabled")
      .eq("user_id", user.id)
      .single();

    // Find service price from config if not provided
    let servicePrice = base_price || 0;
    if (!servicePrice && config?.services) {
      const services = Array.isArray(config.services) ? config.services : [];
      const service = services.find((s: any) => s.name === service_name || s.name_en === service_name);
      if (service) {
        servicePrice = parseFloat(service.price || '0');
      }
    }

    // Calculate pricing
    const pricing = calculatePricing({
      basePrice: servicePrice,
      quantity: quantity || 1,
      deliveryRequired: delivery_required || false,
      deliveryDistance: delivery_distance || 0,
      taxRate: config?.tax_rate || 0.15,
      serviceFeeRate: config?.service_fee_enabled ? 0.05 : 0,
      discountAmount: discount_amount,
      discountPercent: discount_percent
    });

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

    // Create the booking with full schema fields
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        customer_address: customer_address || null,
        booking_type: booking_type || 'appointment',
        service_or_item: service_name,
        category: category || null,
        quantity: quantity || 1,
        items: items || null,
        date,
        time,
        duration_minutes: duration_minutes || 60,
        base_price: pricing.base_price,
        delivery_fee: pricing.delivery_fee,
        service_fee: pricing.service_fee,
        tax_amount: pricing.tax_amount,
        discount_amount: pricing.discount_amount,
        total_amount: pricing.total_amount,
        notes: notes || "",
        special_instructions: special_instructions || null,
        status: "confirmed",
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Booking creation error:", error);
      return NextResponse.json(
        { error: "Failed to create booking", details: error.message },
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
        status: "confirmed",
        pricing: {
          subtotal: pricing.subtotal,
          delivery_fee: pricing.delivery_fee,
          service_fee: pricing.service_fee,
          tax_amount: pricing.tax_amount,
          discount: pricing.discount_amount,
          total: pricing.total_amount
        }
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
