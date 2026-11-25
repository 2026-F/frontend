'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchSettlement } from '@/lib/api';
import type { Settlement } from '@/types';
import {
  buyerOrderFailure,
  isCurrentOrderSession,
  OrderNotice,
  OrderPage,
  OrderSummary,
  type OrderFailure,
  type OrderSession,
} from '../OrderView';
import OrderShipment from './OrderShipment';

const forbidden = { message: '낙찰자 본인만 주문 상세를 볼 수 있습니다.' };

export default function OrderDetailPage({ params }: { params: { settlementId: string } }) {
  const settlementId = Number(params.settlementId);
  const validId = /^[1-9]\d*$/.test(params.settlementId) && Number.isSafeInteger(settlementId);

  return (
    <OrderPage title="주문 상세" back={{ href: '/mypage/orders', label: '주문 및 배송 현황' }}>
      {(session) =>
        validId ? (
          <OrderDetail key={settlementId} {...session} settlementId={settlementId} />
        ) : (
          <OrderNotice failure={{ message: '요청한 주문을 찾을 수 없습니다.' }} />
        )
      }
    </OrderPage>
  );
}

function OrderDetail({
  memberId,
  accessToken,
  settlementId,
}: OrderSession & { settlementId: number }) {
  const [order, setOrder] = useState<Settlement | null>(null);
  const [failure, setFailure] = useState<OrderFailure | null>(null);
  const [attempt, setAttempt] = useState(0);

  const onAccessLost = useCallback((error: OrderFailure) => {
    setOrder(null);
    setFailure(error);
  }, []);

  function reload() {
    setOrder(null);
    setFailure(null);
    setAttempt((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    const isCurrent = () =>
      !controller.signal.aborted && isCurrentOrderSession({ memberId, accessToken });

    fetchSettlement(settlementId, { accessToken, signal: controller.signal })
      .then((data) => {
        if (!isCurrent()) return;
        if (data.winnerId !== memberId) {
          setFailure(forbidden);
          return;
        }
        setOrder(data);
      })
      .catch((error) => {
        if (isCurrent()) setFailure(buyerOrderFailure(error, '주문 상세를 불러오지 못했습니다.'));
      });

    return () => controller.abort();
  }, [memberId, accessToken, settlementId, attempt]);

  if (failure) return <OrderNotice failure={failure} onRetry={reload} />;
  if (!order) return <p role="status">주문 상세를 불러오는 중…</p>;

  return (
    <>
      <section aria-label="주문 정보" className="rounded-2xl border border-[#e6e7e2] p-4">
        <OrderSummary settlement={order} />
      </section>
      <OrderShipment
        session={{ memberId, accessToken }}
        order={order}
        onAccessLost={onAccessLost}
      />
    </>
  );
}
