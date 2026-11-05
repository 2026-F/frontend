'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import type { AuctionLiveView, Bid, Lot } from '@/types';
import {
  errorMessage,
  fetchAuction,
  fetchBids,
  submitBid,
  subscribeAuctionEvents,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime, formatWon } from '@/lib/format';
import { AuctionStatusBadge } from '@/components/StatusBadge';
import { priceOf } from '@/lib/catalogDisplay';
import CountdownTimer from '@/components/CountdownTimer';

// SSE가 끊겼을 때만 현재가를 다시 조회하는 주기
const FALLBACK_POLL_MS = 5000;

function latestFirst(bids: Bid[]): Bid[] {
  return bids.filter((bid) => !bid.canceled).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function BidPanel({ lot }: { lot: Lot }) {
  const member = useAuth((s) => s.member);
  const accessToken = useAuth((s) => s.accessToken);
  const [auction, setAuction] = useState(lot.auction);
  const [amount, setAmount] = useState(lot.auction.currentPrice + lot.auction.minBidUnit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [sseConnected, setSseConnected] = useState(false);
  // 늦게 도착한 이전 상태 이벤트를 무시하기 위한 마지막 version
  const lastVersion = useRef(-1);

  const isBiddable = auction.status === 'ONGOING' || auction.status === 'EXTENDED';
  const minNext = auction.currentPrice + auction.minBidUnit;
  const isLoggedIn = Boolean(member && accessToken);

  // 현재가가 바뀌면 다음 최소 입찰가로 입력값을 맞춰줌 (입력값이 이미 그보다 크면 유지)
  useEffect(() => {
    setAmount((prev) => (prev < minNext ? minNext : prev));
  }, [minNext]);

  const reloadBids = useCallback(() => {
    fetchBids(auction.id)
      .then((list) => setBids(latestFirst(list)))
      .catch(() => {});
  }, [auction.id]);

  const applyLiveView = useCallback(
    (view: AuctionLiveView) => {
      if (view.version < lastVersion.current) return;
      lastVersion.current = view.version;
      setAuction((prev) => ({
        ...prev,
        currentPrice: view.currentPrice,
        minBidUnit: view.minBidUnit,
        auctionEndAt: view.auctionEndAt,
        status: view.status,
      }));
      if (view.reason === 'BID' || view.reason === 'BID_CANCELED') reloadBids();
    },
    [reloadBids],
  );

  useEffect(() => {
    let cancelled = false;

    // 상세에서 조회한 경매를 다시 확인한다.
    fetchAuction(auction.id)
      .then((real) => {
        if (!cancelled) setAuction(real);
      })
      .catch(() => {
        setError('경매 정보를 갱신하지 못했습니다. 다시 확인해 주세요.');
      });
    reloadBids();

    const unsubscribe = subscribeAuctionEvents(auction.id, applyLiveView, {
      onOpen: () => setSseConnected(true),
      onError: () => setSseConnected(false),
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [auction.id, applyLiveView, reloadBids]);

  // SSE가 끊긴 동안에만 현재가를 주기적으로 다시 조회한다. EventSource는 스스로 재연결을 시도한다.
  useEffect(() => {
    if (sseConnected) return;
    const poll = setInterval(() => {
      fetchAuction(auction.id)
        .then((real) => {
          setAuction((prev) =>
            real.currentPrice !== prev.currentPrice || real.status !== prev.status ? real : prev,
          );
        })
        .catch(() => {});
    }, FALLBACK_POLL_MS);
    return () => clearInterval(poll);
  }, [auction.id, sseConnected]);

  const quickAdds = useMemo(
    () => [1, 5, 10].map((multiplier) => auction.minBidUnit * multiplier),
    [auction.minBidUnit],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitBid(auction.id, amount);
      setAuction((prev) => ({
        ...prev,
        currentPrice: result.currentPrice,
        auctionEndAt: result.auctionEndAt,
        status: result.extended ? 'EXTENDED' : prev.status,
      }));
      setAmount(result.currentPrice + auction.minBidUnit);
      reloadBids();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        setError(errorMessage(err, '입찰에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AuctionStatusBadge status={auction.status} />
        <h1 className="mt-3 font-display text-3xl font-semibold text-[#171717]">
          {lot.artwork.title}
        </h1>
        <p className="mt-1 text-[#73756f]">
          {lot.artistName} · {lot.category}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[#171717] bg-[#171717] p-6 text-white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#bfc1bb]">{priceOf(lot.artwork, auction).label}</p>
            <p className="font-display text-4xl font-semibold text-white">
              {formatWon(priceOf(lot.artwork, auction).value)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#bfc1bb]">마감까지</p>
            <CountdownTimer
              target={auction.auctionEndAt}
              extended={auction.status === 'EXTENDED'}
              className="text-lg"
              tone="dark"
            />
          </div>
        </div>
        <p className="text-xs text-[#bfc1bb]">
          최소 입찰 단위 {formatWon(auction.minBidUnit)} · 마감 예정{' '}
          {formatDateTime(auction.auctionEndAt)}
        </p>

        {isBiddable && !isLoggedIn ? (
          <div className="flex flex-col gap-3 border-t border-white/20 pt-4">
            <p className="text-sm text-[#bfc1bb]">입찰하려면 로그인해 주세요.</p>
            <Link href="/login" className="btn-primary text-center">
              로그인하고 입찰하기
            </Link>
          </div>
        ) : isBiddable ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 border-t border-white/20 pt-4"
          >
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs text-[#bfc1bb]">
                입찰 금액 (원)
                <input
                  type="number"
                  min={minNext}
                  step={auction.minBidUnit}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/30 bg-[#292b27] px-4 py-2.5 text-sm text-white focus:border-[#b8f53d] focus:outline-none focus:ring-1 focus:ring-[#b8f53d]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAdds.map((add, idx) => (
                <button
                  type="button"
                  key={add}
                  onClick={() => setAmount(auction.currentPrice + add)}
                  className="rounded-full border border-white/30 px-3 py-1 text-xs text-white hover:border-[#b8f53d] hover:text-[#b8f53d]"
                >
                  +{formatWon(add)}
                  {idx === 0 && ' (최소)'}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-[#ff6761]">{error}</p>}

            <button
              type="submit"
              disabled={submitting || amount < minNext}
              className="btn-primary mt-1"
            >
              {submitting ? '입찰 중...' : `${formatWon(amount)}에 입찰하기`}
            </button>
            <p className="text-[11px] text-[#bfc1bb]">
              마감 30초 이내에 입찰이 들어오면 마감이 자동으로 30초 연장됩니다 (안티 스나이핑).
            </p>
          </form>
        ) : (
          <p className="border-t border-white/20 pt-4 text-sm text-[#bfc1bb]">
            {auction.status === 'CLOSED'
              ? '이미 마감된 경매입니다.'
              : '아직 입찰이 시작되지 않았습니다.'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#171717] bg-[#171717] p-6 text-white">
        <p className="text-sm font-semibold text-white">실시간 입찰 내역</p>
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {bids.length === 0 ? (
            <p className="text-sm text-[#bfc1bb]">아직 입찰 내역이 없습니다.</p>
          ) : (
            bids.map((entry) => (
              <div
                key={entry.bidId}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  entry.bidderId === member?.id
                    ? 'bg-[#33421d] text-white'
                    : 'bg-white/10 text-white'
                }`}
              >
                <span>
                  {entry.bidderId === member?.id ? '내 입찰' : `입찰자 #${entry.bidderId}`}
                </span>
                <span className="font-semibold">{formatWon(entry.price)}</span>
                <span className="text-xs text-[#bfc1bb]">
                  {new Date(entry.createdAt).toLocaleTimeString('ko-KR')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
