export const RATE_LIMIT_MAX_REQUESTS = 20;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

interface Entry {
  count: number;
  firstRequest: number;
}

const ipMap = new Map<string, Entry>();

export function rateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(identifier);
  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
    ipMap.set(identifier, { count: 1, firstRequest: now });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  return false;
}

export function getIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  // fallback for development
  return "local";
}
