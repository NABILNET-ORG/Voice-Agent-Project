import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentIntent, formatAmountForStripe } from '@/lib/stripe-service';

/**
 * POST /api/payments/create-intent
 * Create a Stripe PaymentIntent for a booking
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id, amount, currency } = body;

    if (!booking_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, amount' },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get Stripe key from business_config
    const { data: config } = await supabase
      .from('business_config')
      .select('stripe_secret_key')
      .eq('user_id', user.id)
      .single();

    if (!config?.stripe_secret_key) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please add your Stripe secret key in Settings.' },
        { status: 400 }
      );
    }

    // Check if payment already exists for this booking
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, stripe_payment_intent_id, status')
      .eq('booking_id', booking_id)
      .eq('status', 'succeeded')
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already exists for this booking' },
        { status: 400 }
      );
    }

    // Create Stripe PaymentIntent
    const amountInCents = formatAmountForStripe(amount, currency || 'usd');

    const paymentIntent = await createPaymentIntent(config.stripe_secret_key, {
      amount: amountInCents,
      currency: currency || 'usd',
      bookingId: booking_id,
      customerEmail: booking.customer_email,
      customerName: booking.customer_name,
      description: `Payment for ${booking.service_or_item} - ${booking.customer_name}`,
    });

    // Create payment record in database
    const { data: payment, error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        booking_id,
        user_id: user.id,
        amount: amountInCents,
        currency: currency || 'usd',
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.paymentIntentId,
        description: `Payment for ${booking.service_or_item}`,
      })
      .select()
      .single();

    if (paymentInsertError) {
      console.error('[Payment Intent] Failed to create payment record:', paymentInsertError);
      return NextResponse.json(
        { error: 'Failed to create payment record', details: paymentInsertError.message },
        { status: 500 }
      );
    }

    console.log('[Payment Intent] Created:', paymentIntent.paymentIntentId);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      payment: {
        id: payment.id,
        amount: amountInCents,
        currency: currency || 'usd',
        status: 'pending',
      },
    });

  } catch (error: any) {
    console.error('[Payment Intent API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
