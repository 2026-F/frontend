'use client';

// 토스 결제창에서 결제를 취소하거나 실패하면 토스가 이 주소로 보내 준다.
//   /payments/fail?code=PAY_PROCESS_CANCELED&message=...&orderId=payment_12
// 서버에는 아직 REQUESTED(결과 미확정) 결제가 남아 있으므로 취소 API로 정리해야 바로 다시 결제할 수 있다.
// (정리하지 않아도 15분 뒤 복구 스케줄러가 정리하지만, 그동안 재결제가 막힌다)

import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { cancelPayment, paymentIdFromOrderId } from '@/lib/api';

// 서버 정리 결과에 따라 아래 안내 문구가 바뀐다.
type CleanUp = 'working' | 'retryable' | 'paid' | 'in-progress' | 'login' | 'unknown';

const CLEAN_UP_TEXT: Record<CleanUp, string> = {
  working: '결제 상태를 정리하고 있어요...',
  retryable: '바로 다시 결제할 수 있어요.',
  paid: '확인해 보니 결제가 이미 완료돼 있어요. 결제 내역을 확인해 주세요.',
  'in-progress': '결제를 확인하고 있어요. 잠시 후 다시 시도해 주세요.',
  login: '로그인이 만료됐어요. 다시 로그인한 뒤 결제해 주세요.',
  unknown: '결제 상태를 정리하지 못했어요. 몇 분 뒤 다시 시도해 주세요.',
};

export default function PaymentFailPage() {
  return (
    <Suspense fallback={null}>
      <FailContent />
    </Suspense>
  );
}

function FailContent() {
  const params = useSearchParams();
  const code = params.get('code');
  const message = params.get('message');
  const orderId = params.get('orderId');
  const [cleanUp, setCleanUp] = useState<CleanUp>('working');
  const requested = useRef(false); // 개발 모드 effect 2번 실행 방지

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const paymentId = orderId ? paymentIdFromOrderId(orderId) : null;
    if (paymentId === null) {
      // 결제창을 띄우기 전 단계에서 실패해 주문번호가 없는 경우: 서버에 정리할 결제가 없다.
      setCleanUp('retryable');
      return;
    }

    cancelPayment(paymentId)
      .then((payment) => {
        // 사용자가 취소했어도 그 사이 결제가 승인됐을 수 있어서, 서버가 토스에 확인한 결과를 따른다.
        if (payment.status === 'PAID') setCleanUp('paid');
        else if (payment.status === 'FAILED') setCleanUp('retryable');
        else setCleanUp('in-progress');
      })
      .catch((cause) => {
        if (axios.isAxiosError(cause)) {
          if (cause.response?.status === 401) return setCleanUp('login');
          if (cause.response?.status === 409) return setCleanUp('in-progress'); // PAYMENT_IN_PROGRESS
        }
        setCleanUp('unknown');
      });
  }, [orderId]);

  const canceledByUser = code === 'PAY_PROCESS_CANCELED' || code === 'USER_CANCEL';
  const title = canceledByUser ? '결제를 취소했어요' : '결제하지 못했어요';
  // 사용자가 직접 닫은 경우가 아니면 토스가 알려 준 실패 이유를 보여 준다.
  const reason = canceledByUser ? null : message || '결제 중 문제가 생겼어요.';

  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <h1 className="text-[25px] font-extrabold tracking-[-0.05em]">결제</h1>

      <div className="py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecea] text-[24px] font-black text-[#d33a2c]">
          !
        </div>
        <p className="mt-5 text-[20px] font-extrabold tracking-[-0.04em]">{title}</p>
        {reason && (
          <p role="alert" className="mx-auto mt-2 max-w-[320px] text-[13px] leading-[1.6] text-[#d33a2c]">
            {reason}
            {code && <span className="block text-[11px] text-[#9b9d95]">({code})</span>}
          </p>
        )}
        <p role="status" className="mx-auto mt-3 max-w-[320px] text-[13px] leading-[1.6] text-[#73756f]">
          {CLEAN_UP_TEXT[cleanUp]}
        </p>

        <div className="mt-8 flex flex-col gap-2">
          {cleanUp === 'login' ? (
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-[10px] bg-[#a8ff00] text-[14px] font-extrabold"
            >
              로그인
            </Link>
          ) : (
            <Link
              href="/mypage/payments"
              aria-disabled={cleanUp === 'working'}
              className="flex h-12 items-center justify-center rounded-[10px] bg-[#a8ff00] text-[14px] font-extrabold aria-disabled:pointer-events-none aria-disabled:bg-[#e6e7e2] aria-disabled:text-[#9b9d95]"
            >
              {cleanUp === 'paid' ? '결제 내역 보기' : '다시 결제하러 가기'}
            </Link>
          )}
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-[10px] border border-[#dedfd9] text-[14px] font-bold"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
