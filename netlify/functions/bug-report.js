// netlify/functions/bug-report.js
const { Resend } = require('resend');

// CORS headers for your app
const headers = {
  'Access-Control-Allow-Origin': '*', // In production, replace with your app's domain
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const { 
      deviceInfo, 
      screenshot, 
      errorLogs, 
      userDescription 
    } = JSON.parse(event.body);

    // Initialize Resend with your API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Format device info nicely
    const deviceInfoFormatted = typeof deviceInfo === 'string' 
      ? deviceInfo 
      : JSON.stringify(deviceInfo, null, 2);

    // Prepare attachments array
    const attachments = [];
    
    // Add screenshot if present
    if (screenshot) {
      // Remove data URL prefix if present
      const base64Data = screenshot.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
      attachments.push({
        filename: `screenshot-${Date.now()}.png`,
        content: base64Data
      });
    }

    // Add device info as attachment
    attachments.push({
      filename: `device-info-${Date.now()}.json`,
      content: Buffer.from(deviceInfoFormatted).toString('base64')
    });

    // Add error logs as attachment if substantial
    if (errorLogs && errorLogs.length > 500) {
      attachments.push({
        filename: `error-logs-${Date.now()}.txt`,
        content: Buffer.from(errorLogs).toString('base64')
      });
    }

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .info-box { background: #f9f9f9; border-left: 4px solid #3498db; padding: 15px; margin: 10px 0; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          .timestamp { color: #7f8c8d; font-size: 0.9em; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐛 Bug Report</h1>
            <p class="timestamp">Received: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>User Description</h2>
            <div class="info-box">
              ${userDescription || '<em>No description provided</em>'}
            </div>
          </div>

          <div class="section">
            <h2>Quick Summary</h2>
            <div class="info-box">
              <strong>Platform:</strong> ${deviceInfo?.platform || 'Unknown'}<br>
              <strong>Version:</strong> ${deviceInfo?.version || 'Unknown'}<br>
              <strong>App Version:</strong> ${deviceInfo?.appVersion || 'Unknown'}<br>
              <strong>Timestamp:</strong> ${deviceInfo?.timestamp || new Date().toISOString()}
            </div>
          </div>

          <div class="section">
            <h2>Error Logs Summary</h2>
            <div class="info-box">
              ${errorLogs && errorLogs.length > 500 
                ? `<em>Error logs are extensive (${errorLogs.length} characters). See attached file for full details.</em>` 
                : errorLogs 
                  ? `<pre>${errorLogs.substring(0, 1000)}${errorLogs.length > 1000 ? '\n...(truncated)' : ''}</pre>`
                  : '<em>No error logs available</em>'}
            </div>
          </div>

          <div class="section">
            <h2>Attachments</h2>
            <ul>
              ${screenshot ? '<li>📸 Screenshot attached</li>' : ''}
              <li>📄 Full device information (JSON)</li>
              ${errorLogs && errorLogs.length > 500 ? '<li>📝 Complete error logs (TXT)</li>' : ''}
            </ul>
          </div>

          <div class="alert">
            <strong>Note:</strong> This bug report was automatically generated. 
            Please review the attachments for complete information.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const email = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Bug Reports <bugs@redoublet.com>',
      to: process.env.TO_EMAIL || 'support@redoublet.com',
      subject: `Bug Report - ${deviceInfo?.platform || 'Unknown Platform'} - ${userDescription ? userDescription.substring(0, 50) : 'No Description'}`,
      html: emailHtml,
      attachments: attachments,
      headers: {
        'X-Bug-Report-Platform': deviceInfo?.platform || 'unknown',
        'X-Bug-Report-Version': deviceInfo?.appVersion || 'unknown'
      }
    });

    console.log('Bug report sent successfully:', email.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Bug report sent successfully',
        id: email.id 
      })
    };

  } catch (error) {
    console.error('Bug report error:', error);
    
    // Don't expose internal error details to client
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send bug report. Please try again later.' 
      })
    };
  }
};