/**
 * SMS notification service using Twilio
 * Reads credentials from business_config table (database-first architecture)
 */

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
  twilioConfig?: {
    account_sid: string;
    auth_token: string;
    phone_number: string;
  };
}

/**
 * Send SMS using Twilio
 * NOTE: twilioConfig must be passed from API route after fetching from database
 */
export async function sendSMS(options: SMSOptions) {
  const accountSid = options.twilioConfig?.account_sid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = options.twilioConfig?.auth_token || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = options.from || options.twilioConfig?.phone_number || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured. Please add them in Settings → Integrations');
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: options.to,
        From: fromNumber,
        Body: options.message,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twilio API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * SMS templates
 */

export function bookingConfirmationSMS(booking: any, businessName: string) {
  return {
    message: `${businessName}: Your booking is confirmed! ${booking.service_or_item} on ${booking.date} at ${booking.time}. See you then!`
  };
}

export function bookingReminderSMS(booking: any, businessName: string) {
  return {
    message: `${businessName}: Reminder - You have an appointment tomorrow for ${booking.service_or_item} at ${booking.time}. See you soon!`
  };
}

export function bookingCancellationSMS(booking: any, businessName: string) {
  return {
    message: `${businessName}: Your booking for ${booking.service_or_item} on ${booking.date} at ${booking.time} has been cancelled. Contact us to reschedule.`
  };
}
