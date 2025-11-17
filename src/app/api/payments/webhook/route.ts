import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/stripe-service';
import Stripe from 'stripe';

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 *
 * Important: This endpoint must be accessible without authentication
 * Configure in Stripe Dashboard: https://dashboard.stripe.com/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Get Stripe keys from environment or first user's config
    // Note: For production, use environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!webhookSecret || !stripeSecretKey) {
      console.error('[Webhook] Stripe keys not configured in environment');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(
        stripeSecretKey,
        webhookSecret,
        body,
        signature
      );
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('[Webhook] Event received:', event.type);

    // Create Supabase client (service role for webhook)
    const supabase = await createClient();

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(supabase, paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(supabase, charge);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  console.log('[Webhook] Payment succeeded:', paymentIntentId);

  // Get payment method details
  const paymentMethod = paymentIntent.payment_method;
  let last4 = null;
  let brand = null;

  if (typeof paymentMethod === 'object' && paymentMethod !== null) {
    last4 = (paymentMethod as any).card?.last4;
    brand = (paymentMethod as any).card?.brand;
  }

  // Update payment record
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      stripe_charge_id: paymentIntent.latest_charge,
      payment_method: 'card',
      last4,
      brand,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (updateError) {
    console.error('[Webhook] Failed to update payment:', updateError);
    return;
  }

  // Get booking ID from payment
  const { data: payment } = await supabase
    .from('payments')
    .select('booking_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (payment) {
    // Update booking status to confirmed/paid
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        notes: 'Payment received via Stripe',
      })
      .eq('id', payment.booking_id);

    console.log('[Webhook] Updated booking:', payment.booking_id);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  console.log('[Webhook] Payment failed:', paymentIntentId);

  const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

  await supabase
    .from('payments')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  console.log('[Webhook] Payment canceled:', paymentIntentId);

  await supabase
    .from('payments')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(supabase: any, charge: Stripe.Charge) {
  const chargeId = charge.id;

  console.log('[Webhook] Charge refunded:', chargeId);

  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_charge_id', chargeId);
}
