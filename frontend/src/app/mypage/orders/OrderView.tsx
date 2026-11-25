'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import ArtworkImage from '@/components/ArtworkImage';
import { fetchAuctionSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatWon } from '@/lib/format';
import { requestFailure } from '@/lib/requestFailure';
import type { AuctionSummary, Settlement } from '@/types';

export type OrderSession = { memberId: number; accessToken: string };

export function isCurrentOrderSession({ memberId, accessToken }: OrderSession) {
  const current = useAuth.getState();
  return current.member?.id === memberId && current.accessToken === accessToken;
}

export function OrderPage({
  title,
  back,
  children,
}: {
  title: string;
  back: { href: string; label: string };
  children: (session: OrderSession) => ReactNode;
}) {
  const memberId = useAuth((state) => state.member?.id);
  const accessToken = useAuth((state) => state.accessToken);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="px-5 pb-10 pt-6 text-[#171717]">
      <Link
        href={back.href}
        className="text-sm font-semibold text-[#666862] underline underline-offset-4"
      >
        {back.label}
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-extrabold tracking-tight">{title}</h1>
      {!ready ? (
        <p role="status">로그인 상태를 확인하는 중…</p>
      ) : memberId && accessToken ? (
        <div key={JSON.stringify([memberId, accessToken])}>
          {children({ memberId, accessToken })}
        </div>
      ) : (
        <OrderNotice
          failure={{ message: '주문을 확인하려면 로그인해 주세요.', needsLogin: true }}
        />
      )}
    </div>
  );
}

export type OrderFailure = { message: string; needsLogin?: boolean; retryable?: boolean };

export function buyerOrderFailure(error: unknown, fallback?: string): OrderFailure {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return {
    message: requestFailure(error, fallback),
    needsLogin: status === 401,
    retryable: status !== 401 && status !== 403 && status !== 404,
  };
}

export function OrderNotice({ failure, onRetry }: { failure: OrderFailure; onRetry?: () => void }) {
  return (
    <div className="rounded-xl bg-[#f7f8f4] p-4 text-sm">
      <p role="alert">{failure.message}</p>
      {failure.needsLogin && (
        <Link href="/login" className="mt-3 inline-block font-bold underline underline-offset-4">
          로그인
        </Link>
      )}
      {failure.retryable && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 font-bold underline underline-offset-4"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function OrderSummary({ settlement }: { settlement: Settlement }) {
  const [auction, setAuction] = useState<AuctionSummary | null>(null);
  const { auctionId, paymentStatus, expiredAt, paymentDeadlineAt } = settlement;

  useEffect(() => {
    const controller = new AbortController();
    fetchAuctionSummary(auctionId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setAuction(data);
      })
      .catch(() => {
        // 작품 정보 조회가 실패해도 정산 정보는 그대로 표시한다.
      });
    return () => controller.abort();
  }, [auctionId]);

  const title = auction?.title || `낙찰 작품 #${auctionId}`;
  const status =
    paymentStatus === 'PAID'
      ? '결제 완료'
      : paymentStatus === 'PENDING'
        ? '결제 대기'
        : expiredAt
          ? '결제 기한 만료'
          : '주문 종료';
  // 서버의 오프셋 없는 기한을 표시용으로만 사용한다. 결제 가능 시각 판정은 이 화면에서 하지 않는다.
  const deadline = paymentDeadlineAt?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  const amounts = [
    ['낙찰가', settlement.finalPrice],
    ['구매 수수료', settlement.premiumFee],
    ['배송비', settlement.shippingFee],
    ['총액', settlement.totalAmount],
  ] as const;

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl">
          <ArtworkImage src={auction?.imageUrl} alt={title} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#576e2e]">{status}</p>
          <h2 className="mt-1 break-words text-base font-extrabold">{title}</h2>
          {deadline && (
            <p className="mt-1 text-xs text-[#666862]">
              결제 기한 {deadline[1]} {deadline[2]}
            </p>
          )}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 border-t border-[#eeefea] pt-4 text-sm">
        {amounts.map(([label, amount]) => (
          <div key={label} className={label === '총액' ? 'contents font-extrabold' : 'contents'}>
            <dt>{label}</dt>
            <dd className="pl-3 text-right tabular-nums">{formatWon(amount)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
