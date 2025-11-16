import twilio from 'twilio';

export interface SMSParams {
  to: string;
  message: string;
}

export interface BookingSMSData {
  id: string;
  customer_name: string;
  service_or_item: string;
  date: string;
  time: string;
  duration_minutes: number;
  total_amount: number;
  status: string;
}

/**
 * Send SMS using Twilio API
 */
export async function sendSMS(
  accountSid: string,
  authToken: string,
  fromPhone: string,
  params: SMSParams
) {
  if (!accountSid || !authToken || !fromPhone) {
    throw new Error('Twilio credentials not configured');
  }

  const client = twilio(accountSid, authToken);

  const result = await client.messages.create({
    from: fromPhone,
    to: params.to,
    body: params.message
  });

  return result;
}

/**
 * Render booking confirmation SMS
 */
export function renderBookingConfirmationSMS(booking: BookingSMSData): string {
  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `✓ Booking Confirmed!

Service: ${booking.service_or_item}
Date: ${formattedDate}
Time: ${booking.time}
Duration: ${booking.duration_minutes} min
Total: $${booking.total_amount.toFixed(2)}

Booking ID: ${booking.id}

Thank you, ${booking.customer_name}!`;
}

/**
 * Render booking update SMS
 */
export function renderBookingUpdateSMS(booking: BookingSMSData): string {
  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `📝 Booking Updated

Service: ${booking.service_or_item}
New Date: ${formattedDate}
New Time: ${booking.time}
Total: $${booking.total_amount.toFixed(2)}

ID: ${booking.id}`;
}

/**
 * Render booking cancellation SMS
 */
export function renderBookingCancellationSMS(booking: BookingSMSData, reason?: string): string {
  return `❌ Booking Cancelled

Service: ${booking.service_or_item}
Date: ${booking.date}
${reason ? `Reason: ${reason}` : ''}

To reschedule, please contact us.

ID: ${booking.id}`;
}

/**
 * Render booking reminder SMS (for future use)
 */
export function renderBookingReminderSMS(booking: BookingSMSData, hoursUntil: number): string {
  return `⏰ Reminder: Appointment in ${hoursUntil}h

Service: ${booking.service_or_item}
Time: ${booking.time}
Location: [Your Location]

See you soon, ${booking.customer_name}!`;
}
