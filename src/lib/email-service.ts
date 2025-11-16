import { Resend } from 'resend';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface BookingEmailData {
  id: string;
  customer_name: string;
  customer_email: string;
  service_or_item: string;
  date: string;
  time: string;
  duration_minutes: number;
  total_amount: number;
  status: string;
  notes?: string;
  special_instructions?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(apiKey: string, params: EmailParams) {
  if (!apiKey) {
    throw new Error('Resend API key not configured');
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: params.from || 'bookings@yourdomain.com',
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo
  });

  return result;
}

/**
 * Render booking confirmation email template
 */
export function renderBookingConfirmation(booking: BookingEmailData): string {
  const statusBadgeColor = {
    confirmed: '#10b981',
    pending: '#f59e0b',
    completed: '#3b82f6',
    cancelled: '#ef4444'
  }[booking.status] || '#6b7280';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      color: white;
      padding: 32px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      margin-top: 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      background-color: rgba(255, 255, 255, 0.2);
      text-transform: capitalize;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 24px;
      color: #374151;
    }
    .booking-details {
      background: #f9fafb;
      padding: 20px;
      margin: 24px 0;
      border-radius: 12px;
      border-left: 4px solid #4F46E5;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
    }
    .value {
      color: #111827;
      font-weight: 500;
      text-align: right;
    }
    .total-row {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #d1d5db;
    }
    .total-row .label {
      font-size: 16px;
      color: #111827;
    }
    .total-row .value {
      font-size: 18px;
      color: #4F46E5;
      font-weight: 700;
    }
    .notes {
      background: #fef3c7;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .notes-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    .notes-content {
      color: #78350f;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 28px;
      margin: 24px 0;
      background: #4F46E5;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
    .footer-divider {
      border-top: 1px solid #e5e7eb;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Booking Confirmed!</h1>
      <div class="status-badge" style="background-color: ${statusBadgeColor};">
        ${booking.status}
      </div>
    </div>

    <div class="content">
      <div class="greeting">
        <p>Dear <strong>${booking.customer_name}</strong>,</p>
        <p>Thank you for your booking! Your appointment has been confirmed. Here are your booking details:</p>
      </div>

      <div class="booking-details">
        <div class="detail-row">
          <span class="label">Service</span>
          <span class="value">${booking.service_or_item}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date</span>
          <span class="value">${new Date(booking.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time</span>
          <span class="value">${booking.time}</span>
        </div>
        <div class="detail-row">
          <span class="label">Duration</span>
          <span class="value">${booking.duration_minutes} minutes</span>
        </div>
        <div class="detail-row total-row">
          <span class="label">Total Amount</span>
          <span class="value">$${booking.total_amount.toFixed(2)}</span>
        </div>
      </div>

      ${booking.notes || booking.special_instructions ? `
      <div class="notes">
        <div class="notes-title">📝 Important Notes:</div>
        <div class="notes-content">
          ${booking.notes || ''}
          ${booking.special_instructions ? `<br><strong>Special Instructions:</strong> ${booking.special_instructions}` : ''}
        </div>
      </div>
      ` : ''}

      <p style="margin-top: 28px; color: #374151;">
        If you need to reschedule or cancel your appointment, please contact us as soon as possible.
      </p>

      <p style="color: #374151;">
        We look forward to seeing you!
      </p>
    </div>

    <div class="footer">
      <div class="footer-divider"></div>
      <p>This is an automated confirmation email.</p>
      <p>Booking ID: <strong>${booking.id}</strong></p>
      <p style="margin-top: 16px; color: #9ca3af; font-size: 11px;">
        Please do not reply to this email. For assistance, contact your service provider.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Render booking update notification email
 */
export function renderBookingUpdate(booking: BookingEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Updated</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 32px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .booking-details {
      background: #fef3c7;
      padding: 20px;
      margin: 24px 0;
      border-radius: 12px;
      border-left: 4px solid #f59e0b;
    }
    .detail-row {
      padding: 10px 0;
      border-bottom: 1px solid #fde68a;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #92400e;
      font-size: 14px;
    }
    .value {
      color: #78350f;
      font-weight: 500;
      margin-top: 4px;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Booking Updated</h1>
    </div>

    <div class="content">
      <p>Dear <strong>${booking.customer_name}</strong>,</p>
      <p>Your booking has been updated. Here are your new appointment details:</p>

      <div class="booking-details">
        <div class="detail-row">
          <div class="label">Service</div>
          <div class="value">${booking.service_or_item}</div>
        </div>
        <div class="detail-row">
          <div class="label">Date</div>
          <div class="value">${new Date(booking.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
        </div>
        <div class="detail-row">
          <div class="label">Time</div>
          <div class="value">${booking.time}</div>
        </div>
        <div class="detail-row">
          <div class="label">Total Amount</div>
          <div class="value">$${booking.total_amount.toFixed(2)}</div>
        </div>
      </div>

      <p>If you have any questions about these changes, please contact us.</p>
    </div>

    <div class="footer">
      <p>Booking ID: <strong>${booking.id}</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Render booking cancellation email
 */
export function renderBookingCancellation(booking: BookingEmailData, reason?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 32px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .cancelled-details {
      background: #fee2e2;
      padding: 20px;
      margin: 24px 0;
      border-radius: 12px;
      border-left: 4px solid #ef4444;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Booking Cancelled</h1>
    </div>

    <div class="content">
      <p>Dear <strong>${booking.customer_name}</strong>,</p>
      <p>Your booking has been cancelled.</p>

      <div class="cancelled-details">
        <p><strong>Service:</strong> ${booking.service_or_item}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.time}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>

      <p>If you would like to reschedule, please contact us or make a new booking.</p>
    </div>

    <div class="footer">
      <p>Booking ID: <strong>${booking.id}</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}
