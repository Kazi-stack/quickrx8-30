import { createResponse } from './_email.js';

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

  return createResponse(200, {
    ok: true,
    status: 'ok',
    route: '/api/health',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
} 