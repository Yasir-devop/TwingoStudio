// Netlify Function: Etsy OAuth2 Token Exchange
// Bu dosya: netlify/functions/etsy-auth.js olarak yükle

const ETSY_KEY = 'z8vhgq1wdi92trm3t24f2g92';
const ETSY_SECRET = 'vixpjw50mh';

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
    const { endpoint, access_token, method = 'GET', body: reqBody } = body;
    try {
      const fetchOpts = {
        method,
        headers: {
          'x-api-key': `${ETSY_KEY}:${ETSY_SECRET}`,
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      };
      if (reqBody && method !== 'GET') {
        fetchOpts.body = JSON.stringify(reqBody);
      }
      const response = await fetch(`https://openapi.etsy.com/v3/${endpoint}`, fetchOpts);
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── TAXONOMY ─────────────────────────────────────────
  const isTaxonomy = params.action === 'taxonomy' || (event.body && event.body.includes('"taxonomy"'));
  if (isTaxonomy) {
    try {
      const response = await fetch('https://openapi.etsy.com/v3/application/seller-taxonomy/nodes', {
        method: 'GET',
        headers: { 
          'x-api-key': ETSY_KEY,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── IMAGE UPLOAD ─────────────────────────────────────
  if (params.action === 'upload-image' || body.action === 'upload-image') {
    const { shopId, listingId, access_token, base64, mimeType, rank } = body;
    try {
      // base64'ü binary'e çevir
      const binaryStr = Buffer.from(base64, 'base64');
      const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
      const filename = `image_${rank}.${ext}`;

      // Multipart form data oluştur
      const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
      const parts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="rank"\r\n\r\n${rank}`,
        `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: ${mimeType || 'image/jpeg'}\r\n\r\n`
      ];

      const partsBuf = Buffer.from(parts[0] + '\r\n' + parts[1], 'utf8');
      const endBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
      const body2 = Buffer.concat([partsBuf, binaryStr, endBuf]);

      const response = await fetch(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}/images`,
        {
          method: 'POST',
          headers: {
            'x-api-key': `${ETSY_KEY}:${ETSY_SECRET}`,
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`
          },
          body: body2
        }
      );
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── ETSY SCRAPE ──────────────────────────────────────
  if (params.action === 'scrape' || body.action === 'scrape') {
    const { url } = body;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      const html = await res.text();

      // Title çek
      let title = '';
      const titleMatch = html.match(/"title"\s*:\s*"([^"]{10,200})"/);
      if (titleMatch) title = titleMatch[1].replace(/\u[\dA-F]{4}/gi, c => String.fromCharCode(parseInt(c.replace(/\u/,''),16)));
      if (!title) {
        const ogMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        if (ogMatch) title = ogMatch[1];
      }

      // Tags çek
      let tags = [];
      const tagsMatch = html.match(/"tags"\s*:\s*\[([^\]]+)\]/);
      if (tagsMatch) {
        tags = tagsMatch[1].match(/"([^"]+)"/g)?.map(t => t.replace(/"/g,'')) || [];
      }

      if (!title) throw new Error('Title bulunamadı. Listing URL doğru mu?');
      return { statusCode: 200, headers, body: JSON.stringify({ title, tags }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── CHATGPT ──────────────────────────────────────────
  if (params.action === 'chatgpt' || body.action === 'chatgpt') {
    const { prompt } = body;
    const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + OPENAI_KEY
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const content = data.choices?.[0]?.message?.content || '';
      return { statusCode: 200, headers, body: JSON.stringify({ content }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
};
