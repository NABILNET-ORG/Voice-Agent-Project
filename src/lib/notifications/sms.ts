/**
 * SMS notification service using Twilio
 */

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

/**
 * Send SMS using Twilio
 */
export async function sendSMS(options: SMSOptions) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = options.from || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
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
