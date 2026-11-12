import { getRemaining } from '@/lib/format';

export interface AuctionClock {
  serverTimeMs: number;
  receivedAt: number;
}

// Spring LocalDateTime has no offset. Parse both server values on the same
// timeline so the browser's time zone never affects their difference.
export function auctionTimestamp(value: string) {
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`);
}

export function auctionClock(serverTime: string): AuctionClock | null {
  const serverTimeMs = auctionTimestamp(serverTime);
  return Number.isFinite(serverTimeMs) ? { serverTimeMs, receivedAt: performance.now() } : null;
}

export function auctionRemaining(target: string, clock: AuctionClock | null, now: number) {
  if (!clock) return null;
  const deadline = auctionTimestamp(target);
  if (!Number.isFinite(deadline)) return null;
  const serverNow = clock.serverTimeMs + Math.max(0, now - clock.receivedAt);
  return getRemaining(new Date(deadline), new Date(serverNow));
}
