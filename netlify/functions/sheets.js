// Netlify Function: sheets.js
// Proxies requests from the frontend to the Google Apps Script Web App
// Ensure you set the API_URL environment variable in Netlify to your Apps Script /exec URL

exports.handler = async function(event, context) {
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Server misconfigured: API_URL not set in environment.' })
    };
  }

  const method = event.httpMethod;
  try {
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: ''
      };
    }

    // Build target URL
    let targetUrl = API_URL;
    if (method === 'GET') {
      const qs = event.queryStringParameters ? new URLSearchParams(event.queryStringParameters).toString() : '';
      if (qs) targetUrl += (API_URL.includes('?') ? '&' : '?') + qs;
      const resp = await fetch(targetUrl, { method: 'GET' });
      const text = await resp.text();
      return {
        statusCode: resp.status,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': resp.headers.get('content-type') || 'application/json' },
        body: text
      };
    }

    if (method === 'POST') {
      const resp = await fetch(targetUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: event.body });
      const text = await resp.text();
      return {
        statusCode: resp.status,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': resp.headers.get('content-type') || 'application/json' },
        body: text
      };
    }

    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
