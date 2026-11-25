'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMySettlements } from '@/lib/api';
import type { Settlement } from '@/types';
import {
  buyerOrderFailure,
  isCurrentOrderSession,
  OrderNotice,
  OrderPage,
  OrderSummary,
  type OrderFailure,
  type OrderSession,
} from './OrderView';

export default function OrdersPage() {
  return (
    <OrderPage title="주문 및 배송 현황" back={{ href: '/mypage', label: '마이페이지' }}>
      {(session) => <OrderList {...session} />}
    </OrderPage>
  );
}

function OrderList({ memberId, accessToken }: OrderSession) {
  const [orders, setOrders] = useState<Settlement[] | null>(null);
  const [failure, setFailure] = useState<OrderFailure | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const isCurrent = () =>
      !controller.signal.aborted && isCurrentOrderSession({ memberId, accessToken });

    fetchMySettlements(undefined, { accessToken, signal: controller.signal })
      .then((data) => {
        if (isCurrent()) setOrders(data.filter((order) => order.winnerId === memberId));
      })
      .catch((error) => {
        if (isCurrent()) setFailure(buyerOrderFailure(error, '주문 목록을 불러오지 못했습니다.'));
      });

    return () => controller.abort();
  }, [memberId, accessToken, attempt]);

  if (failure)
    return (
      <OrderNotice
        failure={failure}
        onRetry={() => {
          setFailure(null);
          setAttempt((current) => current + 1);
        }}
      />
    );
  if (!orders) return <p role="status">주문 목록을 불러오는 중…</p>;
  if (!orders.length)
    return <p className="rounded-xl bg-[#f7f8f4] p-4 text-sm">아직 낙찰된 주문이 없습니다.</p>;

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-2xl border border-[#e6e7e2] p-4">
          <OrderSummary key={order.auctionId} settlement={order} />
          <Link
            href={`/mypage/orders/${order.id}`}
            aria-label={`주문 상세 (주문 ${order.id})`}
            className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-[#d9dcd2] text-sm font-bold hover:bg-[#f7f8f4]"
          >
            주문 상세
          </Link>
        </li>
      ))}
    </ul>
  );
}
