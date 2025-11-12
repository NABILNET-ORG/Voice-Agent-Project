import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  try {
    const { to, customerName, businessName, service, date, time, message } = await req.json();

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured - skipping email');
      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!to) {
      throw new Error('Missing required field: to');
    }

    // Build email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #84CC16; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #84CC16; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${businessName}</h1>
              <p>Booking Confirmation</p>
            </div>
            <div class="content">
              <p>Hi ${customerName || 'there'},</p>
              <p>${message || 'Your booking has been confirmed!'}</p>
              <div class="details">
                ${service ? `<p><strong>Service:</strong> ${service}</p>` : ''}
                ${date ? `<p><strong>Date:</strong> ${date}</p>` : ''}
                ${time ? `<p><strong>Time:</strong> ${time}</p>` : ''}
              </div>
              <p>We look forward to seeing you!</p>
              <p>If you need to make any changes, please contact us.</p>
            </div>
            <div class="footer">
              <p>This is an automated confirmation from ${businessName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${businessName} <onboarding@resend.dev>`,
        to: [to],
        subject: `Booking Confirmation - ${businessName}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API Error:', error);
      throw new Error(`Resend API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.id);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
