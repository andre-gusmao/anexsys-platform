const API_HEALTH_URL = (process.env.BACKEND_ORIGIN ?? 'http://127.0.0.1:3000').replace(/\/$/, '') + '/api/v1/health';

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(API_HEALTH_URL, { cache: 'no-store' });
    if (!response.ok) {
      return Response.json({ status: 'degraded' }, { status: 503 });
    }
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'starting' }, { status: 503 });
  }
}
