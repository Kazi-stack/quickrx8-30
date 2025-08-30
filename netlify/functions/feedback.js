import { createResponse, sendPharmacyEmail, isValidEmail } from './_email.js';

export async function handler(event, context) {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(204, {});
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { 
      ok: false, 
      error: 'Method not allowed' 
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return createResponse(400, {
      ok: false,
      error: 'Invalid JSON in request body'
    });
  }

  const { rating, feedback, name, email } = body;

  // Basic validation
  if (!rating || !feedback) {
    return createResponse(400, {
      ok: false,
      error: 'Missing required fields: rating and feedback are required'
    });
  }

  // Rating validation
  if (rating < 1 || rating > 5) {
    return createResponse(400, {
      ok: false,
      error: 'Rating must be between 1 and 5'
    });
  }

  // Email validation if provided
  if (email && !isValidEmail(email)) {
    return createResponse(400, {
      ok: false,
      error: 'Invalid email format'
    });
  }

  try {
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    
    const html = `
      <h2 style="color: #1e3a8a; margin-bottom: 20px;">Customer Feedback</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Rating</h3>
        <p><strong>Rating:</strong> <span style="color: #f59e0b; font-size: 20px;">${stars}</span> (${rating}/5)</p>
        ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
        ${email ? `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>` : ''}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Feedback</h3>
        <div style="background: white; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px;">
          ${feedback.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;

    const text = `
Rating: ${stars} (${rating}/5)
${name ? `Name: ${name}` : ''}
${email ? `Email: ${email}` : ''}

Feedback:
${feedback}
    `.trim();

    const result = await sendPharmacyEmail({
      subject: `Customer Feedback - ${rating}/5 stars`,
      html,
      text,
      formType: 'feedback',
      formData: { rating, feedback, name, email },
      pageUrl: event.headers.referer || 'Not provided',
      replyTo: email ? `${name || 'Anonymous'} <${email}>` : null
    });

    return createResponse(200, {
      ok: true,
      success: true,
      message: 'Feedback submitted successfully',
      correlationId: result.correlationId,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Feedback email sending failed:', error);
    return createResponse(500, {
      ok: false,
      error: 'Failed to submit feedback. Please try again later.'
    });
  }
} 