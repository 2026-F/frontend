'use client';

// 토스 결제창에서 결제를 마치면 토스가 이 주소로 보내 준다.
//   /payments/success?paymentKey=...&orderId=payment_12&amount=123000
// 여기서는 "결제 승인(confirm)"을 서버에 요청해야 실제로 돈이 빠져나간다.
// (토스는 승인 요청이 10분 안에 오지 않으면 결제를 자동 취소한다)

import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { confirmTossPayment, errorMessage, fetchPayment, paymentIdFromOrderId } from '@/lib/api';
import { formatWon } from '@/lib/format';
import type { Payment } from '@/types';

type View =
  | { kind: 'loading' }
  | { kind: 'paid'; payment: Payment }
  | { kind: 'failed'; message: string }
  | { kind: 'pending' } // 서버가 아직 결과를 확정하지 못함 → 복구 스케줄러가 정리한다
  | { kind: 'error'; message: string };

// useSearchParams는 Suspense 안에서만 써야 Next.js 빌드가 통과한다.
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Shell><Loading /></Shell>}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const [view, setView] = useState<View>({ kind: 'loading' });
  // 개발 모드에서 React가 effect를 두 번 실행해도 승인 요청은 한 번만 보낸다.
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const paymentId = orderId ? paymentIdFromOrderId(orderId) : null;
    if (!paymentKey || !orderId || paymentId === null) {
      setView({ kind: 'error', message: '결제 정보가 올바르지 않습니다.' });
      return;
    }

    (async () => {
      try {
        // 금액은 보내지 않는다. 서버가 DB의 결제 금액으로 토스에 승인 요청한다(주소창 금액 조작 방지).
        const payment = await confirmTossPayment(paymentId, paymentKey, orderId);
        setView(viewOf(payment));
      } catch (cause) {
        if (axios.isAxiosError(cause) && cause.response?.status === 401) {
          setView({ kind: 'error', message: '로그인이 만료됐어요. 다시 로그인한 뒤 결제 내역을 확인해 주세요.' });
          return;
        }
        // 응답이 끊겼거나(타임아웃) 이미 처리된 결제일 수 있다 → 현재 상태를 다시 조회해서 보여 준다.
        try {
          const payment = await fetchPayment(paymentId);
          setView(viewOf(payment));
        } catch {
          setView({ kind: 'error', message: errorMessage(cause, '결제 승인 중 문제가 생겼습니다.') });
        }
      }
    })();
  }, [params]);

  return (
    <Shell>
      {view.kind === 'loading' && <Loading />}
      {view.kind === 'paid' && (
        <Result
          title="결제가 완료됐어요"
          description={`${formatWon(view.payment.amount)}을 결제했어요. 배송 준비가 시작되면 알려 드릴게요.`}
          tone="success"
        />
      )}
      {view.kind === 'pending' && (
        <Result
          title="결제를 확인하고 있어요"
          description="결제 결과를 아직 확정하지 못했어요. 몇 분 안에 자동으로 정리되니 잠시 후 결제 내역을 확인해 주세요. 중복으로 결제되지 않아요."
          tone="info"
        />
      )}
      {view.kind === 'failed' && <Result title="결제하지 못했어요" description={view.message} tone="error" />}
      {view.kind === 'error' && <Result title="결제를 확인하지 못했어요" description={view.message} tone="error" />}
    </Shell>
  );
}

// 서버 결제 상태 → 화면 상태
function viewOf(payment: Payment): View {
  if (payment.status === 'PAID') return { kind: 'paid', payment };
  if (payment.status === 'FAILED') {
    return { kind: 'failed', message: payment.failureReason ?? '결제가 승인되지 않았어요. 다시 시도해 주세요.' };
  }
  return { kind: 'pending' };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <h1 className="text-[25px] font-extrabold tracking-[-0.05em]">결제</h1>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <p role="status" className="py-24 text-center text-[14px] text-[#73756f]">
      결제를 승인하고 있어요. 이 화면을 닫지 마세요...
    </p>
  );
}

function Result({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: 'success' | 'info' | 'error';
}) {
  const mark = tone === 'success' ? '✓' : tone === 'info' ? '…' : '!';
  const markClass =
    tone === 'success'
      ? 'bg-[#a8ff00] text-[#171717]'
      : tone === 'info'
        ? 'bg-[#f0f1ed] text-[#73756f]'
        : 'bg-[#fdecea] text-[#d33a2c]';
  return (
    <div className="py-16 text-center" role={tone === 'error' ? 'alert' : 'status'}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[24px] font-black ${markClass}`}>
        {mark}
      </div>
      <p className="mt-5 text-[20px] font-extrabold tracking-[-0.04em]">{title}</p>
      <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-[1.6] text-[#73756f]">{description}</p>
      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/mypage/payments"
          className="flex h-12 items-center justify-center rounded-[10px] bg-[#a8ff00] text-[14px] font-extrabold"
        >
          결제 내역 보기
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-[10px] border border-[#dedfd9] text-[14px] font-bold"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
