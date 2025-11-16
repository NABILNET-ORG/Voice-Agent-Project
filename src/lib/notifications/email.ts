/**
 * Email notification service
 * Reads API key from business_config table (database-first architecture)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  resendApiKey?: string;
}

/**
 * Send email using Resend (recommended)
 * NOTE: resendApiKey should be passed from API route after fetching from database
 */
export async function sendEmailWithResend(options: EmailOptions) {
  const apiKey = options.resendApiKey || process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Resend API key not configured. Please add it in Settings → Integrations');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from || 'noreply@yourdomain.com',
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Send email (auto-selects provider)
 */
export async function sendEmail(options: EmailOptions) {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    return await sendEmailWithResend(options);
  }

  throw new Error('No email service configured. Please add RESEND_API_KEY to environment variables');
}

/**
 * Email templates
 */

export function bookingConfirmationEmail(booking: any, businessInfo: any) {
  return {
    subject: `Booking Confirmation - ${businessInfo.business_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #84CC16; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
            .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #84CC16; }
            .footer { text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${businessInfo.business_name}</h1>
              <p>Booking Confirmation</p>
            </div>
            <div class="content">
              <p>Dear ${booking.customer_name},</p>
              <p>Your booking has been confirmed!</p>

              <div class="details">
                <h3>Booking Details:</h3>
                <p><strong>Service:</strong> ${booking.service_or_item}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                ${booking.duration_minutes ? `<p><strong>Duration:</strong> ${booking.duration_minutes} minutes</p>` : ''}
                ${booking.total_amount ? `<p><strong>Total:</strong> $${booking.total_amount}</p>` : ''}
              </div>

              ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}

              <p>If you need to reschedule or cancel, please contact us or visit your dashboard.</p>
            </div>
            <div class="footer">
              <p>${businessInfo.business_name}</p>
              ${businessInfo.phone_number ? `<p>Phone: ${businessInfo.phone_number}</p>` : ''}
              ${businessInfo.address ? `<p>${businessInfo.address}</p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `
  };
}

export function bookingReminderEmail(booking: any, businessInfo: any) {
  return {
    subject: `Reminder: Upcoming Appointment - ${businessInfo.business_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Reminder: Upcoming Appointment</h2>
            <p>Hi ${booking.customer_name},</p>
            <p>This is a reminder about your upcoming appointment:</p>
            <div style="background: #f0f0f0; padding: 15px; margin: 15px 0;">
              <p><strong>Service:</strong> ${booking.service_or_item}</p>
              <p><strong>Date:</strong> ${booking.date}</p>
              <p><strong>Time:</strong> ${booking.time}</p>
            </div>
            <p>We look forward to seeing you!</p>
            <p>- ${businessInfo.business_name}</p>
          </div>
        </body>
      </html>
    `
  };
}

export function bookingCancellationEmail(booking: any, businessInfo: any) {
  return {
    subject: `Booking Cancelled - ${businessInfo.business_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Booking Cancelled</h2>
            <p>Hi ${booking.customer_name},</p>
            <p>Your booking has been cancelled:</p>
            <div style="background: #f0f0f0; padding: 15px; margin: 15px 0;">
              <p><strong>Service:</strong> ${booking.service_or_item}</p>
              <p><strong>Date:</strong> ${booking.date}</p>
              <p><strong>Time:</strong> ${booking.time}</p>
              ${booking.cancellation_reason ? `<p><strong>Reason:</strong> ${booking.cancellation_reason}</p>` : ''}
            </div>
            <p>If you'd like to reschedule, please contact us.</p>
            <p>- ${businessInfo.business_name}</p>
          </div>
        </body>
      </html>
    `
  };
}
