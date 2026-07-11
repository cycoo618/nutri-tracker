/**
 * Cloudflare Worker — Notion API CORS Proxy + OAuth backend
 *
 * Deploy steps:
 * 1. Go to https://workers.cloudflare.com/ and sign in (free account works)
 * 2. Create a new Worker, paste this entire file
 * 3. Save and deploy — you'll get a URL like https://notion-proxy.YOUR-NAME.workers.dev
 * 4. For one-click OAuth: create a PUBLIC integration at
 *    https://www.notion.so/profile/integrations, set the redirect URI to
 *    https://cycoo618.github.io/nutri-tracker/notion-callback.html
 *    then configure this worker's variables:
 *      wrangler secret put NOTION_CLIENT_SECRET
 *      (and set NOTION_CLIENT_ID as a plain variable, or also as a secret)
 *
 * This worker:
 * - GET  /oauth/config — returns the public OAuth client_id for the app
 * - POST /oauth/token  — exchanges an OAuth code for an access token
 *   (the client_secret lives only here, never in the frontend)
 * - /notion/* — forwards to https://api.notion.com/* passing through the
 *   Authorization header, adding CORS headers for browser / WKWebView
 */

const NOTION_BASE = 'https://api.notion.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Notion-Version',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ─── OAuth endpoints ─────────────────────────────────────────

    if (url.pathname === '/oauth/config' && request.method === 'GET') {
      return json({ clientId: env.NOTION_CLIENT_ID ?? null });
    }

    if (url.pathname === '/oauth/token' && request.method === 'POST') {
      if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET) {
        return json({ error: 'Worker 未配置 NOTION_CLIENT_ID / NOTION_CLIENT_SECRET' }, 500);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }
      if (!body.code || !body.redirect_uri) {
        return json({ error: 'Missing code or redirect_uri' }, 400);
      }
      const basic = btoa(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`);
      const resp = await fetch(`${NOTION_BASE}/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basic}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: body.code,
          redirect_uri: body.redirect_uri,
        }),
      });
      const data = await resp.json();
      return json(data, resp.status);
    }

    // ─── Notion API proxy ────────────────────────────────────────

    // Strip /notion prefix and forward the rest to Notion API
    const notionPath = url.pathname.replace(/^\/notion/, '') + url.search;
    const notionUrl = `${NOTION_BASE}${notionPath}`;

    const headers = new Headers(request.headers);
    // Ensure Notion-Version header is present
    if (!headers.has('Notion-Version')) {
      headers.set('Notion-Version', '2022-06-28');
    }
    // Remove host header to avoid conflicts
    headers.delete('host');

    const notionResp = await fetch(notionUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    });

    const respHeaders = new Headers(notionResp.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(notionResp.body, {
      status: notionResp.status,
      headers: respHeaders,
    });
  },
};
