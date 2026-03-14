const rateMap = new Map<string, { count: number; reset: number }>();

export function rateLimit(userId: string, limit = 30, windowMs = 60000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(userId);
  if (!entry || now > entry.reset) {
    rateMap.set(userId, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count++;
  if (entry.count > limit) return { ok: false, remaining: 0 };
  return { ok: true, remaining: limit - entry.count };
}
