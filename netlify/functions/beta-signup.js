const { Resend } = require('resend');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Parse the request body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const { email, platform } = data;

  // Validate input
  if (!email || !platform) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Email and platform are required' })
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Invalid email address' })
    };
  }

  // Validate platform
  if (!['ios', 'android'].includes(platform.toLowerCase())) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Invalid platform selection' })
    };
  }

  // Initialize Resend with your API key
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log('Attempting to send beta signup emails...');
    console.log('User email:', email);
    console.log('Platform:', platform);

    // Send notification email to you (using environment variables like bug-report.js)
    const notificationEmail = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Redoublet Beta <onboarding@resend.dev>',
      to: [process.env.TO_EMAIL || 'christiaantersteeg@gmail.com'],
      reply_to: email, // This allows you to reply directly to the user
      subject: `New Beta Tester Signup - ${platform.toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0808D9 0%, #1a1aff 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎯 New Beta Tester!</h1>
            </div>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-top: none; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: #f8f9fa; border-left: 4px solid #F89554; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #0808D9;">Beta Tester Details:</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${email}" style="color: #0808D9;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Platform:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                    <span style="background: ${platform === 'ios' ? '#007AFF' : '#3DDC84'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                      ${platform.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Date:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${new Date().toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
              </table>
              
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>💡 Quick Action:</strong> Click reply to respond directly to ${email}
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        New Beta Tester Signup
        
        Email: ${email}
        Platform: ${platform.toUpperCase()}
        Date: ${new Date().toLocaleString()}
        
        You can reply directly to this email to contact the beta tester.
      `
    });

    console.log('Notification email sent successfully:', notificationEmail.id);

    // Send welcome email to the beta tester
    const welcomeEmail = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Redoublet Beta <onboarding@resend.dev>',
      to: email,
      reply_to: process.env.REPLY_TO_EMAIL || 'christiaantersteeg@gmail.com',
      subject: 'Welcome to Redoublet Beta Program! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0808D9 0%, #1a1aff 100%); color: white; padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Welcome to Redoublet!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Bridge Reimagined</p>
            </div>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-top: none; padding: 30px; border-radius: 0 0 10px 10px;">
              <!-- English Section -->
              <div style="margin-bottom: 40px;">
                <h2 style="color: #0808D9; margin-top: 0; font-size: 24px;">Welcome to Redoublet Beta Program!</h2>
                
                <p>Hi there,</p>
                
                <p>We're thrilled to have you as one of our early beta testers for Redoublet.</p>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #0808D9; margin-top: 0; font-size: 18px;">📱 Your Platform: ${platform === 'ios' ? 'iOS' : 'Android'}</h3>
                  <p style="margin: 10px 0;">We've noted that you're interested in testing on <strong>${platform.toUpperCase()}</strong>. We'll send you specific instructions for your device soon.</p>
                </div>
                
                <p><strong>What happens next?</strong> We'll review your application (usually within 24-48 hours). You'll receive an invitation email with download instructions.</p>
                
                <p>If you have any questions in the meantime, feel free to reply to this email.</p>
                
                <p>Looking forward to your feedback,</p>
                
                <p><strong>Christiaan & Quirinus Tersteeg</strong><br>
                <span style="color: #666;">Founders, Redoublet</span></p>
              </div>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 2px solid #e0e0e0; margin: 40px 0;">
              
              <!-- Dutch Section -->
              <div style="margin-bottom: 30px;">
                <h2 style="color: #0808D9; margin-top: 0; font-size: 24px;">🇳🇱 Nederlandse versie</h2>
                
                <p>Hallo,</p>
                
                <p>Leuk dat je één van onze eerste beta-testers wilt worden voor Redoublet.</p>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #0808D9; margin-top: 0; font-size: 18px;">📱 Jouw platform: ${platform === 'ios' ? 'iOS' : 'Android'}</h3>
                  <p style="margin: 10px 0;">We hebben genoteerd dat je geïnteresseerd bent in testen op <strong>${platform.toUpperCase()}</strong>.</p>
                </div>
                
                <p><strong>Wat gebeurt er nu?</strong> We beoordelen je aanmelding (meestal binnen 24-48 uur). Daarna ontvang je een uitnodigingsmail met downloadinstructies.</p>
                
                <p>Heb je in de tussentijd vragen? Reageer gerust op deze e-mail.</p>
                
                <p>We kijken uit naar je feedback,</p>
                
                <p><strong>Christiaan & Quirinus Tersteeg</strong><br>
                <span style="color: #666;">Oprichters, Redoublet</span></p>
              </div>
              
              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <div style="text-align: center; color: #999; font-size: 12px;">
                <p>© 2024 Redoublet.com - Bridge Reimagined</p>
                <p>
                  <a href="mailto:christiaan.tersteeg@redoublet.com" style="color: #0808D9; text-decoration: none;">christiaan.tersteeg@redoublet.com</a> | 
                  <a href="mailto:quirinus.tersteeg@redoublet.com" style="color: #0808D9; text-decoration: none;">quirinus.tersteeg@redoublet.com</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to Redoublet Beta Program!
        
        Hi there,
        
        We're thrilled to have you as one of our early beta testers for Redoublet.
        
        Your Platform: ${platform.toUpperCase()}
        We've noted that you're interested in testing on ${platform.toUpperCase()}. We'll send you specific instructions for your device soon.
        
        What happens next? We'll review your application (usually within 24-48 hours). You'll receive an invitation email with download instructions.
        
        If you have any questions in the meantime, feel free to reply to this email.
        
        Looking forward to your feedback,
        
        Christiaan & Quirinus Tersteeg
        Founders, Redoublet
        
        ---
        
        🇳🇱 Nederlandse versie
        
        Hallo,
        
        Leuk dat je één van onze eerste beta-testers wilt worden voor Redoublet.
        
        Jouw platform: ${platform.toUpperCase()}
        We hebben genoteerd dat je geïnteresseerd bent in testen op ${platform.toUpperCase()}.
        
        Wat gebeurt er nu?
        We beoordelen je aanmelding (meestal binnen 24-48 uur). Daarna ontvang je een uitnodigingsmail met downloadinstructies.
        
        Heb je in de tussentijd vragen? Reageer gerust op deze e-mail.
        
        We kijken uit naar je feedback,
        
        Christiaan & Quirinus Tersteeg
        Oprichters, Redoublet
      `
    });

    console.log('Welcome email sent successfully:', welcomeEmail.id);
    console.log('Both emails sent successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Successfully signed up for beta testing!' 
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log more details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to process signup. Please try again or contact us directly at christiaantersteeg@gmail.com',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
