// Netlify Function: Etsy OAuth2 Token Exchange
// Bu dosya: netlify/functions/etsy-auth.js olarak yükle

const ETSY_KEY = 'wk9iauowy21h3dr02jqzouq5';
const ETSY_SECRET = 'mdvfi7w6yg';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  // ── TOKEN EXCHANGE ────────────────────────────────────
  if (params.action === 'token' || body.action === 'token') {
    const { code, verifier, redirect_uri } = body;
    try {
      const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: ETSY_KEY,
          redirect_uri,
          code,
          code_verifier: verifier
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || 'Token exchange failed');
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── TOKEN REFRESH ─────────────────────────────────────
  if (params.action === 'refresh' || body.action === 'refresh') {
    const { refresh_token } = body;
    try {
      const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: ETSY_KEY,
          refresh_token
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || 'Refresh failed');
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── ETSY API PROXY ────────────────────────────────────
  if (params.action === 'api' || body.action === 'api') {
    const { endpoint, access_token } = body;
    try {
      const response = await fetch(`https://openapi.etsy.com/v3/${endpoint}`, {
        headers: {
          'x-api-key': ETSY_KEY,
          'Authorization': `Bearer ${access_token}`
        }
      });
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
};
