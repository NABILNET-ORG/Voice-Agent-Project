import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, bookingConfirmationEmail, bookingReminderEmail, bookingCancellationEmail } from '@/lib/notifications/email';
import { sendSMS, bookingConfirmationSMS, bookingReminderSMS, bookingCancellationSMS } from '@/lib/notifications/sms';

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
    const { booking_id, type, channels } = body;

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

    // Get business info and API keys from database
    const { data: businessInfo } = await supabase
      .from('business_config')
      .select('business_name, phone_number, address, customer_notification_email, customer_notification_sms, resend_api_key, twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('user_id', user.id)
      .single();

    const results: any = {
      email: null,
      sms: null,
    };

    const errors: any = {};

    // Determine which channels to use
    const sendEmail_flag = channels?.includes('email') || businessInfo?.customer_notification_email;
    const sendSMS_flag = channels?.includes('sms') || businessInfo?.customer_notification_sms;

    // Send Email Notification
    if (sendEmail_flag && booking.customer_email) {
      try {
        let emailContent;

        switch (type) {
          case 'confirmation':
            emailContent = bookingConfirmationEmail(booking, businessInfo);
            break;
          case 'reminder':
            emailContent = bookingReminderEmail(booking, businessInfo);
            break;
          case 'cancellation':
            emailContent = bookingCancellationEmail(booking, businessInfo);
            break;
          default:
            throw new Error(`Unknown notification type: ${type}`);
        }

        const emailResult = await sendEmail({
          to: booking.customer_email,
          ...emailContent,
          resendApiKey: businessInfo?.resend_api_key,
        });

        results.email = {
          status: 'sent',
          to: booking.customer_email,
          result: emailResult,
        };

        // Update booking confirmation_sent flag
        if (type === 'confirmation') {
          await supabase
            .from('bookings')
            .update({ confirmation_sent: true })
            .eq('id', booking_id);
        }

        // Update reminder_sent flag
        if (type === 'reminder') {
          await supabase
            .from('bookings')
            .update({ reminder_sent: true })
            .eq('id', booking_id);
        }

      } catch (emailError: any) {
        console.error('Email sending error:', emailError);
        errors.email = emailError.message;
        results.email = {
          status: 'failed',
          error: emailError.message,
        };
      }
    }

    // Send SMS Notification
    if (sendSMS_flag && booking.customer_phone) {
      try {
        let smsContent;

        switch (type) {
          case 'confirmation':
            smsContent = bookingConfirmationSMS(booking, businessInfo?.business_name || 'Business');
            break;
          case 'reminder':
            smsContent = bookingReminderSMS(booking, businessInfo?.business_name || 'Business');
            break;
          case 'cancellation':
            smsContent = bookingCancellationSMS(booking, businessInfo?.business_name || 'Business');
            break;
          default:
            throw new Error(`Unknown notification type: ${type}`);
        }

        const smsResult = await sendSMS({
          to: booking.customer_phone,
          ...smsContent,
          twilioConfig: businessInfo?.twilio_account_sid ? {
            account_sid: businessInfo.twilio_account_sid,
            auth_token: businessInfo.twilio_auth_token,
            phone_number: businessInfo.twilio_phone_number
          } : undefined,
        });

        results.sms = {
          status: 'sent',
          to: booking.customer_phone,
          result: smsResult,
        };

      } catch (smsError: any) {
        console.error('SMS sending error:', smsError);
        errors.sms = smsError.message;
        results.sms = {
          status: 'failed',
          error: smsError.message,
        };
      }
    }

    // Check if any notifications were sent
    const sentCount = Object.values(results).filter((r: any) => r?.status === 'sent').length;

    if (sentCount === 0) {
      return NextResponse.json(
        {
          error: 'No notifications sent',
          details: 'Either no channels were configured or all attempts failed',
          errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Sent ${sentCount} notification(s)`,
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Notification send error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error.message },
      { status: 500 }
    );
  }
}
