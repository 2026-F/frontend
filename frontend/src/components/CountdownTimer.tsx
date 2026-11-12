'use client';

import { useEffect, useState } from 'react';
import { auctionRemaining, type AuctionClock } from '@/lib/auctionClock';
import { getRemaining, type Remaining } from '@/lib/format';

export function useCountdown(target: string, clock?: AuctionClock | null) {
  const [now, setNow] = useState(0);
  const [local, setLocal] = useState(() => getRemaining(target));

  useEffect(() => {
    if (clock === null) return;
    const update = () => {
      if (clock) setNow(performance.now());
      else setLocal(getRemaining(target));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [target, clock]);

  return clock === undefined ? local : auctionRemaining(target, clock, now);
}

type CountdownAppearance = {
  extended?: boolean;
  className?: string;
  tone?: 'light' | 'dark';
  awaitingClose?: boolean;
};

export function CountdownDisplay({
  remaining,
  extended,
  className = '',
  tone = 'light',
  awaitingClose = false,
}: CountdownAppearance & { remaining: Remaining | null }) {
  if (!remaining || remaining.isOver) {
    const text = !remaining ? '마감 시각 확인 중' : awaitingClose ? '마감 확인 중' : '마감되었습니다';
    return <span className={`font-semibold ${tone === 'dark' ? 'text-[#bfc1bb]' : 'text-[#73756f]'} ${className}`}>{text}</span>;
  }
  const urgent = remaining.totalMs <= 30_000;
  return (
    <span
      className={`inline-flex items-center gap-2 font-display tabular-nums ${
        urgent
          ? tone === 'dark' ? 'animate-pulse text-[#ff6761]' : 'animate-pulse text-[#e0443e]'
          : tone === 'dark' ? 'text-white' : 'text-[#171717]'
      } ${className}`}
    >
      {remaining.days > 0 && `${remaining.days}일 `}
      {String(remaining.hours).padStart(2, '0')}:{String(remaining.minutes).padStart(2, '0')}:
      {String(remaining.seconds).padStart(2, '0')}
      {extended && <span className="badge bg-red-500 text-white">연장됨</span>}
    </span>
  );
}

export default function CountdownTimer({
  target,
  clock,
  ...appearance
}: CountdownAppearance & { target: string; clock?: AuctionClock | null }) {
  const remaining = useCountdown(target, clock);
  return <CountdownDisplay remaining={remaining} {...appearance} />;
}
