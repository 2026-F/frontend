import { useAuth } from '@/lib/auth';
import type { ArtworkStatus } from '@/types';

export const artworkStatusLabel: Record<ArtworkStatus, string> = {
  PENDING_REVIEW: '심사 대기',
  PREVIEW: '프리뷰',
  IN_AUCTION: '경매 중',
  SOLD: '낙찰',
  REJECTED: '반려',
};

export function reviewPage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 0;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 2147483646 ? page : 0;
}

export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function isAdminSession(memberId: number | undefined, accessToken: string | null): boolean {
  const current = useAuth.getState();
  return (
    Boolean(accessToken) &&
    current.accessToken === accessToken &&
    current.member?.id === memberId &&
    current.member?.role === 'ADMIN'
  );
}
