const ALLOWED_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'job-search-api.jobs.ch',
  'www.jobs.ch',
  'review-api.jobs.ch',
];

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    // Expect paths like /proxy/api.openai.com/v1/chat/completions
    if (!url.pathname.startsWith('/proxy/')) {
      return new Response('Not found', { status: 404 });
    }

    const targetPath = url.pathname.slice('/proxy/'.length);
    const slashIndex = targetPath.indexOf('/');
    const targetHost = slashIndex === -1 ? targetPath : targetPath.slice(0, slashIndex);
    const targetRest = slashIndex === -1 ? '' : targetPath.slice(slashIndex);

    if (!ALLOWED_HOSTS.includes(targetHost)) {
      return new Response(`Host not allowed: ${targetHost}`, { status: 403 });
    }

    const targetUrl = `https://${targetHost}${targetRest}${url.search}`;

    // Build clean headers — only forward relevant ones, strip browser CORS/origin headers
    const headers = new Headers();
    const FORWARD_HEADERS = ['content-type', 'authorization', 'x-api-key', 'anthropic-version'];
    for (const name of FORWARD_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    // Return with CORS headers
    const responseHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders())) {
      responseHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  },
};

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}
