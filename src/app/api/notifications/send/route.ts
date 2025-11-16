import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendEmail,
  renderBookingConfirmation,
  renderBookingUpdate,
  renderBookingCancellation,
  type BookingEmailData
} from '@/lib/email-service';
import {
  sendSMS,
  renderBookingConfirmationSMS,
  renderBookingUpdateSMS,
  renderBookingCancellationSMS,
  type BookingSMSData
} from '@/lib/sms-service';

/**
 * POST /api/notifications/send
 * Send booking notifications (email and/or SMS)
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
    const { booking_id, type, channel } = body;

    if (!booking_id || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, type' },
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

    // Get business config for API keys
    const { data: config } = await supabase
      .from('business_config')
      .select('resend_api_key, twilio_account_sid, twilio_auth_token, twilio_phone_number, customer_notification_email, customer_notification_sms')
      .eq('user_id', user.id)
      .single();

    const results: any[] = [];

    // Send email if enabled
    if ((channel === 'email' || channel === 'both') && config?.customer_notification_email) {
      if (config.resend_api_key && booking.customer_email) {
        try {
          let emailHtml: string;
          let emailSubject: string;

          switch (type) {
            case 'confirmation':
              emailHtml = renderBookingConfirmation(booking as BookingEmailData);
              emailSubject = 'Booking Confirmation';
              break;
            case 'update':
              emailHtml = renderBookingUpdate(booking as BookingEmailData);
              emailSubject = 'Booking Updated';
              break;
            case 'cancellation':
              emailHtml = renderBookingCancellation(booking as BookingEmailData, booking.cancellation_reason);
              emailSubject = 'Booking Cancelled';
              break;
            default:
              throw new Error(`Unknown notification type: ${type}`);
          }

          const emailResult = await sendEmail(config.resend_api_key, {
            to: booking.customer_email,
            subject: emailSubject,
            html: emailHtml
          });

          results.push({ channel: 'email', status: 'sent', id: emailResult.data?.id });

          console.log(`[Notification] Email sent to ${booking.customer_email}`);
        } catch (error: any) {
          console.error('[Notification] Email failed:', error);
          results.push({ channel: 'email', status: 'failed', error: error.message });
        }
      } else {
        results.push({
          channel: 'email',
          status: 'skipped',
          reason: !config.resend_api_key ? 'Resend API key not configured' : 'No customer email'
        });
      }
    }

    // Send SMS if enabled
    if ((channel === 'sms' || channel === 'both') && config?.customer_notification_sms) {
      if (config.twilio_account_sid && config.twilio_auth_token && config.twilio_phone_number && booking.customer_phone) {
        try {
          let smsMessage: string;

          switch (type) {
            case 'confirmation':
              smsMessage = renderBookingConfirmationSMS(booking as BookingSMSData);
              break;
            case 'update':
              smsMessage = renderBookingUpdateSMS(booking as BookingSMSData);
              break;
            case 'cancellation':
              smsMessage = renderBookingCancellationSMS(booking as BookingSMSData, booking.cancellation_reason);
              break;
            default:
              throw new Error(`Unknown notification type: ${type}`);
          }

          const smsResult = await sendSMS(
            config.twilio_account_sid,
            config.twilio_auth_token,
            config.twilio_phone_number,
            {
              to: booking.customer_phone,
              message: smsMessage
            }
          );

          results.push({ channel: 'sms', status: 'sent', sid: smsResult.sid });

          console.log(`[Notification] SMS sent to ${booking.customer_phone}`);
        } catch (error: any) {
          console.error('[Notification] SMS failed:', error);
          results.push({ channel: 'sms', status: 'failed', error: error.message });
        }
      } else {
        results.push({
          channel: 'sms',
          status: 'skipped',
          reason: !config.twilio_account_sid ? 'Twilio not configured' : 'No customer phone'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Notifications processed for booking ${booking_id}`
    });

  } catch (error: any) {
    console.error('[Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
