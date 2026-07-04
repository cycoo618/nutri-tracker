/**
 * Cloudflare Worker — Notion API CORS Proxy
 *
 * Deploy steps:
 * 1. Go to https://workers.cloudflare.com/ and sign in (free account works)
 * 2. Create a new Worker, paste this entire file
 * 3. Save and deploy — you'll get a URL like https://notion-proxy.YOUR-NAME.workers.dev
 * 4. Paste that URL into the app's Notion settings
 *
 * This worker:
 * - Accepts requests at /notion/*
 * - Forwards them to https://api.notion.com/*
 * - Passes through the Authorization header (your Notion token stays client-side)
 * - Adds CORS headers so the browser / WKWebView can call it
 */

const NOTION_BASE = 'https://api.notion.com';

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, Notion-Version',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
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
