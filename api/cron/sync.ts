import { syncAllAutoAccounts } from '../../src/server/auto-sync.js';
import type { ApiRequest } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end('Method not allowed');
    return;
  }

  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization;
  if (!secret || authorization !== `Bearer ${secret}`) {
    response.statusCode = 401;
    response.end('Unauthorized');
    return;
  }

  try {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(await syncAllAutoAccounts()));
  } catch (error) {
    console.error('Auto-sync cron failed', error);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: '自动同步失败' }));
  }
}
