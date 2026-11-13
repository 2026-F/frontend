"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { errorMessage, fetchAuction, submitBid } from "@/lib/api";
import { auctionRemaining } from "@/lib/auctionClock";
import { useAuth } from "@/lib/auth";
import { formatWon } from "@/lib/format";
import { CountdownDisplay, useCountdown } from "@/components/CountdownTimer";
import { useAuctionLive } from "@/components/useAuctionLive";
import type { Auction } from "@/types";

type Props = {
  auctionId: number;
  /** 진행자 화면처럼 현재가와 남은 시간만 보여주고 입찰 버튼은 숨긴다. */
  readOnly?: boolean;
};

/**
 * 라이브 화면에서 현재가와 남은 시간을 보여주고 바로 입찰하는 막대. LiveChat의 above 자리에 넣는다.
 * 경매 정보를 못 불러오면 아무것도 그리지 않는다 — 방송과 채팅은 그대로 볼 수 있어야 한다.
 */
export default function LiveBidBar({ auctionId, readOnly = false }: Props) {
  const [initial, setInitial] = useState<Auction | null>(null);

  useEffect(() => {
    const request = new AbortController();
    setInitial(null);
    fetchAuction(auctionId, request.signal)
      .then((auction) => setInitial(auction))
      .catch(() => {});
    return () => request.abort();
  }, [auctionId]);

  if (!initial) return null;
  return <LiveBidBarInner key={initial.id} initial={initial} readOnly={readOnly} />;
}

function LiveBidBarInner({ initial, readOnly }: { initial: Auction; readOnly: boolean }) {
  const member = useAuth((state) => state.member);
  const accessToken = useAuth((state) => state.accessToken);
  // 경매 상세의 입찰 패널과 같은 실시간 상태(SSE + 끊기면 폴링)를 쓴다.
  const { auction, clock, bids, refresh } = useAuctionLive(initial);
  const remaining = useCountdown(auction.auctionEndAt, clock);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(initial.currentPrice + initial.minBidUnit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로그인 상태는 localStorage에서 복원되므로 마운트 뒤에 반영한다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isOngoing = auction.status === "ONGOING" || auction.status === "EXTENDED";
  const isBiddable = isOngoing && remaining !== null && !remaining.isOver;
  const isLoggedIn = mounted && Boolean(member && accessToken);
  const minNext = auction.currentPrice + auction.minBidUnit;
  const leading = isLoggedIn && bids.length > 0 && bids[0].bidderId === member?.id;

  // 다른 사람이 입찰해 현재가가 오르면 입력값을 다음 최소 입찰가로 끌어올린다.
  useEffect(() => {
    setAmount((previous) => (previous < minNext ? minNext : previous));
  }, [minNext]);

  // 마감되면 열어 둔 입찰 창을 닫는다.
  useEffect(() => {
    if (!isBiddable) setOpen(false);
  }, [isBiddable]);

  const quickAdds = useMemo(
    () => [1, 5, 10].map((multiplier) => auction.minBidUnit * multiplier),
    [auction.minBidUnit],
  );

  const handleBid = async () => {
    // 버튼을 누른 순간의 서버 기준 남은 시간을 다시 확인한다. 최종 판정은 서버가 한다.
    const atSubmit = auctionRemaining(auction.auctionEndAt, clock, performance.now());
    if (!isLoggedIn || !isBiddable || !atSubmit || atSubmit.isOver || submitting || amount < minNext) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitBid(auction.id, amount);
      await refresh();
      setOpen(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      } else {
        setError(errorMessage(err, "입찰에 실패했습니다. 잠시 후 다시 시도해 주세요."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-black/55 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] text-white/70">
            현재가
            {leading && (
              <span className="rounded bg-[#b8f53d] px-1 py-0.5 text-[10px] font-bold text-[#171717]">최고 입찰 중</span>
            )}
          </p>
          <p className="truncate text-lg font-bold tabular-nums">{formatWon(auction.currentPrice)}</p>
        </div>

        <div className="text-right">
          <p className="text-[11px] text-white/70">마감까지</p>
          {auction.status === "CLOSED" ? (
            <span className="text-sm font-semibold text-white/70">마감</span>
          ) : isOngoing ? (
            <CountdownDisplay
              remaining={remaining}
              extended={auction.status === "EXTENDED"}
              className="text-sm"
              tone="dark"
              awaitingClose
            />
          ) : (
            <span className="text-sm font-semibold text-white/70">시작 전</span>
          )}
        </div>

        {!readOnly && isBiddable && !open &&
          (isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAmount(minNext);
                setOpen(true);
              }}
              className="shrink-0 rounded-full bg-[#b8f53d] px-4 py-2 text-sm font-bold text-[#171717]"
            >
              입찰
            </button>
          ) : (
            <Link href="/login" className="shrink-0 rounded-full bg-white/20 px-3 py-2 text-xs font-semibold">
              로그인 후 입찰
            </Link>
          ))}
      </div>

      {!readOnly && open && isBiddable && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-white/15 pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {quickAdds.map((add, index) => {
              const value = auction.currentPrice + add;
              return (
                <button
                  type="button"
                  key={add}
                  onClick={() => setAmount(value)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    amount === value ? "border-[#b8f53d] text-[#b8f53d]" : "border-white/30 text-white"
                  }`}
                >
                  +{formatWon(add)}
                  {index === 0 && " (최소)"}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/30 px-4 py-2.5 text-sm"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleBid}
              disabled={submitting || amount < minNext}
              className="flex-1 rounded-full bg-[#b8f53d] px-4 py-2.5 text-sm font-bold text-[#171717] disabled:opacity-40"
            >
              {submitting ? "입찰 중..." : `${formatWon(amount)}에 입찰하기`}
            </button>
          </div>
          <p className="text-[10px] text-white/60">마감 30초 이내 입찰은 마감을 30초 연장합니다.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-[#ffb4b0]">
          {error}
        </p>
      )}
    </div>
  );
}
