const { Resend } = require('resend');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: ''
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Email and platform are required' })
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // ONLY send notification to you - no email to the user
    await resend.emails.send({
      from: 'Redoublet Beta <onboarding@resend.dev>',
      to: ['christiaantersteeg@gmail.com'], // Your verified email
      reply_to: email, // So you can easily reply to the beta tester
      subject: `New Beta Tester: ${email} - ${platform.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Beta Tester Signup</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Platform:</strong> ${platform}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p><em>Reply to this email to contact the beta tester directly.</em></p>
        </div>
      `,
      text: `New Beta Tester: ${email}\nPlatform: ${platform}\nDate: ${new Date().toLocaleString()}`
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Successfully signed up for beta testing!' 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to process signup. Please try again or contact us directly.'
      })
    };
  }
};
