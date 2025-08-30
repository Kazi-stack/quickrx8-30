import { createResponse, sendPharmacyEmail } from './_email.js';

export async function handler(event, context) {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(204, {});
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return createResponse(405, { 
      ok: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const result = await sendPharmacyEmail({
      subject: 'QuickRX Email Health Check',
      html: '<p>✅ QuickRX email system is working correctly.</p>',
      text: 'QuickRX email system is working correctly.',
      formType: 'health-check',
      pageUrl: '/api/health/email'
    });

    return createResponse(200, {
      ok: true,
      message: 'Email health check successful',
      correlationId: result.correlationId,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email health check failed:', error);
    return createResponse(500, {
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 