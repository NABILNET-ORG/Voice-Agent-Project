import Stripe from 'stripe';

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  bookingId: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Create a Stripe PaymentIntent for a booking
 */
export async function createPaymentIntent(
  stripeSecretKey: string,
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(params.amount), // Ensure integer
    currency: params.currency || 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      booking_id: params.bookingId,
      customer_name: params.customerName || '',
    },
    description: params.description || `Payment for booking ${params.bookingId}`,
    receipt_email: params.customerEmail,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Retrieve a PaymentIntent by ID
 */
export async function getPaymentIntent(
  stripeSecretKey: string,
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Cancel a PaymentIntent
 */
export async function cancelPaymentIntent(
  stripeSecretKey: string,
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  return await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Create a refund for a charge
 */
export async function createRefund(
  stripeSecretKey: string,
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amount) {
    refundParams.amount = Math.round(amount);
  }

  return await stripe.refunds.create(refundParams);
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  stripeSecretKey: string,
  webhookSecret: string,
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Format amount for Stripe (convert dollars to cents)
 */
export function formatAmountForStripe(amount: number, currency: string = 'usd'): number {
  // Currencies with no decimal places (zero-decimal currencies)
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'clp', 'xaf'];

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }

  // Most currencies use 2 decimal places (multiply by 100)
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert cents to dollars)
 */
export function formatAmountFromStripe(amount: number, currency: string = 'usd'): number {
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'clp', 'xaf'];

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }

  return amount / 100;
}
