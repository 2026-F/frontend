'use client';

// 결제 대기 화면: 내가 낙찰받은 작품의 정산(청구서)을 보여 주고, 토스 결제창으로 결제한다.
// 흐름: [결제하기] → 서버에 결제 요청(TOSS) → 토스 결제창 → 성공 /payments/success, 취소·실패 /payments/fail

import axios from 'axios';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ArtworkImage from '@/components/ArtworkImage';
import {
  cancelPayment,
  errorMessage,
  fetchAuctionSummary,
  fetchMySettlements,
  paymentOrderId,
  requestPayment,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime, formatWon } from '@/lib/format';
import { isTossConfigured, openTossCheckout, tossErrorCode } from '@/lib/toss';
import type { AuctionSummary, Payment, Settlement } from '@/types';

type Row = { settlement: Settlement; auction: AuctionSummary | null };
type Group = 'PAYABLE' | 'PAID' | 'CLOSED';

// 화면에서 나눌 묶음. 기한이 지났는데 아직 만료 배치가 돌기 전인 정산도 "결제 불가"로 본다.
function groupOf(settlement: Settlement, now: Date): Group {
  if (settlement.paymentStatus === 'PAID') return 'PAID';
  if (settlement.paymentStatus === 'PENDING' && new Date(settlement.paymentDeadlineAt) > now) {
    return 'PAYABLE';
  }
  return 'CLOSED';
}

const GROUP_TITLE: Record<Group, string> = {
  PAYABLE: '결제 대기',
  PAID: '결제 완료',
  CLOSED: '기한 만료',
};

export default function PaymentsPage() {
  const { member, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  useEffect(() => setReady(true), []);

  const isLoggedIn = Boolean(member && accessToken);

  const load = useCallback(async () => {
    setError(null);
    try {
      const settlements = await fetchMySettlements();
      // 정산에는 작품 정보가 없어서 경매 상세를 따로 불러 붙인다. 하나가 실패해도 나머지는 보여 준다.
      const auctionIds = Array.from(new Set(settlements.map((s) => s.auctionId)));
      const results = await Promise.allSettled(auctionIds.map((id) => fetchAuctionSummary(id)));
      const auctions = new Map<number, AuctionSummary>();
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') auctions.set(auctionIds[index], result.value);
      });
      setRows(
        settlements.map((settlement) => ({
          settlement,
          auction: auctions.get(settlement.auctionId) ?? null,
        })),
      );
    } catch (cause) {
      setError(errorMessage(cause, '결제 내역을 불러오지 못했습니다.'));
    }
  }, []);

  useEffect(() => {
    if (ready && isLoggedIn) load();
  }, [ready, isLoggedIn, load]);

  const handlePay = async ({ settlement, auction }: Row) => {
    if (!member) return;
    if (!isTossConfigured()) {
      setNotice('결제 설정(토스 클라이언트 키)이 없어 결제할 수 없습니다. 관리자에게 문의해 주세요.');
      return;
    }
    setNotice(null);
    setPayingId(settlement.id);
    let created: Payment | null = null;
    try {
      // 1) 서버에 결제 요청을 만든다. 금액은 서버가 정산 금액으로 정한다.
      created = await requestPayment(settlement.id, 'TOSS');
      // 2) 그 결제의 주문번호로 토스 결제창을 띄운다. 성공·실패하면 토스가 해당 주소로 이동시킨다.
      await openTossCheckout({
        orderId: paymentOrderId(created.id),
        orderName: auction?.title ?? `ArtBid 낙찰 작품 #${settlement.auctionId}`,
        amount: created.amount,
        customerEmail: member.email,
        customerName: member.name,
      });
    } catch (cause) {
      if (created) {
        // 결제창을 닫았거나 띄우지 못함 → 방금 만든 결제 요청을 정리해야 바로 다시 결제할 수 있다.
        await cancelPayment(created.id).catch(() => undefined);
        setNotice(
          tossErrorCode(cause) === 'USER_CANCEL'
            ? '결제를 취소했어요. 다시 결제할 수 있어요.'
            : errorMessage(cause, cause instanceof Error ? cause.message : '결제창을 열지 못했습니다.'),
        );
      } else if (
        axios.isAxiosError(cause) &&
        cause.response?.status === 409 &&
        cause.response.data?.code === 'PAYMENT_ALREADY_EXISTS'
      ) {
        // 이전에 띄운 결제창의 결과가 아직 정리되지 않음 (서버가 토스에 확인한 뒤 정리한다)
        setNotice('이전 결제를 확인하고 있어요. 잠시 후 다시 시도해 주세요.');
      } else {
        setNotice(errorMessage(cause, '결제를 시작하지 못했습니다.'));
      }
      load();
    } finally {
      setPayingId(null);
    }
  };

  if (!ready) return null;

  const now = new Date();
  const grouped: Record<Group, Row[]> = { PAYABLE: [], PAID: [], CLOSED: [] };
  rows?.forEach((row) => grouped[groupOf(row.settlement, now)].push(row));
  // 결제 대기는 기한이 가까운 순, 나머지는 최근 순
  grouped.PAYABLE.sort(
    (a, b) =>
      new Date(a.settlement.paymentDeadlineAt).getTime() -
      new Date(b.settlement.paymentDeadlineAt).getTime(),
  );
  grouped.PAID.sort((a, b) => b.settlement.id - a.settlement.id);
  grouped.CLOSED.sort((a, b) => b.settlement.id - a.settlement.id);

  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <div className="flex items-center gap-2">
        <Link href="/mypage" aria-label="마이페이지로" className="text-[25px] leading-none">
          ‹
        </Link>
        <h1 className="text-[25px] font-extrabold tracking-[-0.05em]">결제</h1>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-[10px] bg-[#f3f8e6] px-4 py-3 text-[13px] font-semibold text-[#3f5a12]">
          {notice}
        </p>
      )}

      {!isLoggedIn ? (
        <div className="py-20 text-center">
          <p className="text-[14px] text-[#73756f]">로그인하면 낙찰받은 작품을 결제할 수 있어요</p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center rounded-[8px] bg-[#a8ff00] px-6 text-[14px] font-extrabold"
          >
            로그인
          </Link>
        </div>
      ) : error ? (
        <p role="alert" className="py-20 text-center text-[14px] text-[#d33a2c]">
          {error}
        </p>
      ) : !rows ? (
        <p className="py-20 text-center text-[14px] text-[#73756f]">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="py-20 text-center text-[14px] text-[#73756f]">낙찰받은 작품이 없어요</p>
      ) : (
        (['PAYABLE', 'PAID', 'CLOSED'] as Group[])
          .filter((group) => grouped[group].length > 0)
          .map((group) => (
            <section key={group} className="mt-7">
              <h2 className="text-[17px] font-extrabold tracking-[-0.04em]">
                {GROUP_TITLE[group]}
                <span className="ml-1.5 text-[13px] font-bold text-[#637e27]">
                  {grouped[group].length}
                </span>
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {grouped[group].map((row) => (
                  <SettlementCard
                    key={row.settlement.id}
                    row={row}
                    group={group}
                    paying={payingId === row.settlement.id}
                    disabled={payingId !== null}
                    onPay={() => handlePay(row)}
                  />
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}

function SettlementCard({
  row: { settlement, auction },
  group,
  paying,
  disabled,
  onPay,
}: {
  row: Row;
  group: Group;
  paying: boolean;
  disabled: boolean;
  onPay: () => void;
}) {
  const title = auction?.title ?? `낙찰 작품 #${settlement.auctionId}`;
  return (
    <li className="rounded-[16px] border border-[#e6e7e2] p-4">
      <div className="flex gap-3">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[10px]">
          <ArtworkImage src={auction?.imageUrl} alt={title} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold">{title}</p>
          {group === 'PAYABLE' && (
            <p className="mt-1 text-[12px] font-semibold text-[#d33a2c]">
              {formatDateTime(settlement.paymentDeadlineAt)}까지 결제
            </p>
          )}
          {group === 'PAID' && <p className="mt-1 text-[12px] font-semibold text-[#637e27]">결제 완료</p>}
          {group === 'CLOSED' && <p className="mt-1 text-[12px] text-[#73756f]">결제 기한이 지났어요</p>}
          <p className="mt-2 text-[18px] font-black tracking-[-0.03em]">{formatWon(settlement.totalAmount)}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-y-1 border-t border-[#eeefea] pt-3 text-[12px] text-[#73756f]">
        <dt>낙찰가</dt>
        <dd className="text-right">{formatWon(settlement.finalPrice)}</dd>
        <dt>구매 수수료</dt>
        <dd className="text-right">{formatWon(settlement.premiumFee)}</dd>
        <dt>배송비</dt>
        <dd className="text-right">{formatWon(settlement.shippingFee)}</dd>
      </dl>

      {group === 'PAYABLE' && (
        <button
          type="button"
          onClick={onPay}
          disabled={disabled}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-[10px] bg-[#a8ff00] text-[14px] font-extrabold disabled:cursor-default disabled:bg-[#e6e7e2] disabled:text-[#9b9d95]"
        >
          {paying ? '결제창 여는 중...' : `${formatWon(settlement.totalAmount)} 결제하기`}
        </button>
      )}
    </li>
  );
}
