import type { APIRoute } from 'astro';
import { getResearch } from '../../lib/server/notion';
export const GET: APIRoute = async () => {
  const research = await getResearch();
  return Response.json(
    {
      status: research.status === 'ready' ? 'ok' : 'degraded',
      research: research.status,
    },
    {
      status: research.status === 'ready' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
};
