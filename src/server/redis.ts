export async function redisCommand(command: (string | number)[], fetcher: typeof fetch = fetch): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Upstash Redis credentials are not configured');

  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  const payload = await response.json() as { result?: unknown; error?: unknown };
  if (!response.ok || payload.error) {
    throw new Error(`Redis request failed (${response.status})`);
  }
  return payload.result;
}

export async function allowWithinLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const result = await redisCommand([
    'EVAL',
    'local n=redis.call("INCR",KEYS[1]); if n==1 then redis.call("EXPIRE",KEYS[1],ARGV[1]); end; return n',
    1,
    key,
    windowSeconds
  ]);
  return typeof result === 'number' && result <= limit;
}

export async function releaseRateLimits(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redisCommand([
    'EVAL',
    'for i=1,#KEYS do local n=redis.call("GET",KEYS[i]); if n and tonumber(n)>0 then if tonumber(n)==1 then redis.call("DEL",KEYS[i]); else redis.call("DECR",KEYS[i]); end end end; return 1',
    keys.length,
    ...keys
  ]);
}
