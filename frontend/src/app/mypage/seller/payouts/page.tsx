'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMySellerPayouts } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatWon } from '@/lib/format';
import { requestFailure } from '@/lib/requestFailure';
import type { SellerPayout, SellerPayoutList } from '@/types';

type PayoutResult =
  | { state: 'loading' }
  | { state: 'success'; data: SellerPayoutList }
  | { state: 'error'; error: unknown };

const noticeClass = 'mt-5 rounded-xl bg-[#f7f8f4] p-4 text-sm leading-6';
const refreshClass =
  'inline-flex min-h-11 items-center rounded-lg border border-[#dedfd9] px-3 text-sm font-bold';

export default function SellerPayoutsPage() {
  const { member, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="min-h-screen bg-white px-5 pb-10 pt-6 text-[#171717]">
      <Link
        href="/mypage"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#666862]"
      >
        <span aria-hidden="true">‹</span> 마이페이지
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">지급 내역</h1>
      {!ready ? (
        <p role="status" className={noticeClass}>
          로그인 상태를 확인하는 중…
        </p>
      ) : !member || !accessToken ? (
        <LoginNotice message="지급 내역을 확인하려면 로그인해 주세요." />
      ) : member.role !== 'CONSIGNOR' ? (
        <p role="alert" className={noticeClass}>
          판매자만 이용할 수 있는 화면입니다.
        </p>
      ) : (
        <PayoutList
          key={`${member.id}:${accessToken}`}
          memberId={member.id}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}

function LoginNotice({ message }: { message: string }) {
  return (
    <div className={noticeClass}>
      <p role="status">{message}</p>
      <Link
        href="/login"
        className="mt-1 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
      >
        로그인
      </Link>
    </div>
  );
}

function PayoutList({ memberId, accessToken }: { memberId: number; accessToken: string }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<PayoutResult>({ state: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const isCurrentSession = () => {
      const current = useAuth.getState();
      return (
        !controller.signal.aborted &&
        current.member?.id === memberId &&
        current.member.role === 'CONSIGNOR' &&
        current.accessToken === accessToken
      );
    };

    fetchMySellerPayouts(accessToken, controller.signal)
      .then((data) => {
        if (isCurrentSession()) setResult({ state: 'success', data });
      })
      .catch((error: unknown) => {
        if (isCurrentSession()) setResult({ state: 'error', error });
      });

    return () => controller.abort();
  }, [accessToken, attempt, memberId]);

  const refresh = () => {
    setResult({ state: 'loading' });
    setAttempt((previous) => previous + 1);
  };

  if (result.state === 'loading') {
    return (
      <p role="status" className={noticeClass}>
        지급 내역을 불러오는 중…
      </p>
    );
  }

  if (result.state === 'error') {
    const status = axios.isAxiosError(result.error) ? result.error.response?.status : undefined;
    const message = requestFailure(
      result.error,
      '지급 내역을 불러오지 못했습니다. 다시 시도해 주세요.',
    );
    if (status === 401) return <LoginNotice message={message} />;

    return (
      <div className={noticeClass}>
        <p role="alert">{message}</p>
        {status !== 403 && (
          <button type="button" className={`mt-3 ${refreshClass}`} onClick={refresh}>
            다시 시도
          </button>
        )}
      </div>
    );
  }

  const { readyAmount, paidAmount, payouts } = result.data;
  return (
    <>
      <dl
        aria-label="지급 합계"
        className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f7f8f4] p-4"
      >
        <div className="min-w-0">
          <dt className="text-sm text-[#666862]">지급 대기 합계</dt>
          <dd className="mt-2 break-words text-lg font-extrabold tabular-nums">
            {formatWon(readyAmount)}
          </dd>
        </div>
        <div className="min-w-0 border-l border-[#dedfd9] pl-3">
          <dt className="text-sm text-[#666862]">지급 완료 합계</dt>
          <dd className="mt-2 break-words text-lg font-extrabold tabular-nums">
            {formatWon(paidAmount)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm leading-6 text-[#666862]">
        결제 완료 건은 지급 배치가 처리한 뒤 표시됩니다. 기본 실행 주기는 10분이며, 배치가
        실패하거나 중지되면 반영이 늦어질 수 있습니다.
      </p>
      <section aria-labelledby="payout-list-heading" className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="payout-list-heading" className="text-base font-extrabold">
            건별 지급 내역
          </h2>
          <button type="button" onClick={refresh} className={refreshClass}>
            새로고침
          </button>
        </div>
        {payouts.length === 0 ? (
          <p className={noticeClass}>표시할 지급 내역이 없습니다.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {payouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function PayoutRow({ payout }: { payout: SellerPayout }) {
  const paid = payout.status === 'PAID';
  return (
    <li className="rounded-2xl border border-[#e6e7e2] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold">정산 #{payout.settlementId}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${paid ? 'bg-[#f0f6e3] text-[#3d5220]' : 'bg-[#f2f2ef] text-[#53564d]'}`}
        >
          {paid ? '지급 완료' : '지급 대기'}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-[#666862]">낙찰가</dt>
        <dd className="text-right tabular-nums">{formatWon(payout.finalPrice)}</dd>
        <dt className="text-[#666862]">판매 수수료</dt>
        <dd className="text-right tabular-nums">{formatWon(payout.commissionAmount)}</dd>
        <dt className="mt-1 font-bold">{paid ? '지급액' : '지급 예정액'}</dt>
        <dd className="mt-1 text-right font-extrabold tabular-nums">
          {formatWon(payout.payoutAmount)}
        </dd>
      </dl>
    </li>
  );
}
