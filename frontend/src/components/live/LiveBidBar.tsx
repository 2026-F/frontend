"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import axios from "axios";
import { errorMessage, fetchArtworkDetail, fetchAuction, submitBid } from "@/lib/api";
import { auctionRemaining } from "@/lib/auctionClock";
import { useAuth } from "@/lib/auth";
import { estimatePayment } from "@/lib/fees";
import { formatWon } from "@/lib/format";
import { CountdownDisplay, useCountdown } from "@/components/CountdownTimer";
import { useAuctionLive } from "@/components/useAuctionLive";
import { useLiveOverlayRoot } from "./LivePortraitShell";
import type { ArtworkDetail, Auction } from "@/types";

type Props = {
  auctionId: number;
  /** 진행자 화면처럼 작품과 현재가만 보여주고 입찰 시트는 열지 않는다. */
  readOnly?: boolean;
};

type Step = "select" | "confirm";

/**
 * 라이브 화면 아래쪽 작품 카드와 입찰 바텀시트. LiveChat의 above 자리에 넣는다.
 * 카드를 누르면 금액 선택(select) → 비용 확인(confirm) 두 단계 시트가 열린다.
 * 경매 정보를 못 불러오면 아무것도 그리지 않는다 — 방송과 채팅은 그대로 볼 수 있어야 한다.
 */
export default function LiveBidBar({ auctionId, readOnly = false }: Props) {
  const [initial, setInitial] = useState<Auction | null>(null);
  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);

  useEffect(() => {
    const request = new AbortController();
    setInitial(null);
    setArtwork(null);
    fetchAuction(auctionId, request.signal)
      .then((auction) => {
        setInitial(auction);
        // 작품 정보는 카드 꾸밈용이라 실패해도 입찰은 그대로 할 수 있게 둔다.
        return fetchArtworkDetail(auction.artworkId).then((detail) => {
          if (!request.signal.aborted) setArtwork(detail);
        });
      })
      .catch(() => {});
    return () => request.abort();
  }, [auctionId]);

  if (!initial) return null;
  return <LiveBidBarInner key={initial.id} initial={initial} artwork={artwork} readOnly={readOnly} />;
}

function LiveBidBarInner({
  initial,
  artwork,
  readOnly,
}: {
  initial: Auction;
  artwork: ArtworkDetail | null;
  readOnly: boolean;
}) {
  const member = useAuth((state) => state.member);
  const accessToken = useAuth((state) => state.accessToken);
  // 경매 상세의 입찰 패널과 같은 실시간 상태(SSE + 끊기면 폴링)를 쓴다.
  const { auction, clock, bids, refresh } = useAuctionLive(initial);
  const remaining = useCountdown(auction.auctionEndAt, clock);
  const overlayRoot = useLiveOverlayRoot();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [amount, setAmount] = useState(initial.currentPrice + initial.minBidUnit);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 로그인 상태는 localStorage에서 복원되므로 마운트 뒤에 반영한다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isOngoing = auction.status === "ONGOING" || auction.status === "EXTENDED";
  const isBiddable = isOngoing && remaining !== null && !remaining.isOver;
  const isLoggedIn = mounted && Boolean(member && accessToken);
  const minNext = auction.currentPrice + auction.minBidUnit;
  const leading = isLoggedIn && bids.length > 0 && bids[0].bidderId === member?.id;
  const title = artwork?.title ?? `경매 #${auction.id}`;
  const subtitle = [artwork?.artist?.name, artwork?.productionYear].filter(Boolean).join(", ");

  // 다른 사람이 입찰해 현재가가 오르면:
  // 금액 선택 중이면 다음 최소 입찰가로 끌어올리고, 확인 단계였다면 확인한 금액을 몰래 바꾸지 않고 선택 단계로 돌려보낸다.
  useEffect(() => {
    if (amount >= minNext) return;
    if (step === "confirm") {
      setStep("select");
      setNotice("현재가가 올라 금액을 다시 선택해 주세요.");
    }
    setAmount(minNext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minNext]);

  // 마감되면 열어 둔 입찰 시트를 닫는다.
  useEffect(() => {
    if (!isBiddable) setOpen(false);
  }, [isBiddable]);

  // Esc로 시트를 닫는다. 제출 중에는 닫지 않는다.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting]);

  // 입찰 완료 안내는 잠시 보여주고 지운다.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const quickAdds = useMemo(
    () => [1, 5, 10].map((multiplier) => auction.minBidUnit * multiplier),
    [auction.minBidUnit],
  );

  const openSheet = () => {
    if (readOnly) return;
    setError(null);
    setNotice(null);
    setStep("select");
    setAmount(minNext);
    setCustomOpen(false);
    setCustomText("");
    setOpen(true);
  };

  const closeSheet = () => {
    if (!submitting) setOpen(false);
  };

  const handleCustomChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 12);
    setCustomText(digits);
    setError(null);
    if (digits) setAmount(Number(digits));
  };

  const goConfirm = () => {
    if (amount < minNext) {
      setError(`최소 ${formatWon(minNext)} 이상 입찰할 수 있습니다.`);
      return;
    }
    setError(null);
    setNotice(null);
    setStep("confirm");
  };

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
      setSuccess(`${formatWon(amount)} 입찰 완료`);
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

  const estimate = estimatePayment(amount);
  const canOpen = !readOnly;

  const card = (
    <div className="rounded-2xl bg-white p-3 text-copy-primary shadow-lg">
      <button
        type="button"
        onClick={openSheet}
        disabled={!canOpen}
        aria-haspopup={canOpen ? "dialog" : undefined}
        aria-label={canOpen ? `${title} 입찰 열기` : undefined}
        className="flex w-full items-center gap-3 text-left disabled:cursor-default"
      >
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#9fd8d2] to-[#8ea6f5]">
          {artwork?.imageUrl && <img src={artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold">{title}</span>
          {subtitle && <span className="mt-0.5 block truncate text-[11px] text-[#8a8b86]">{subtitle}</span>}
          <span className="mt-1 flex items-center gap-1.5">
            <span className="truncate text-[13px] font-bold tabular-nums text-[#e0443e]">
              현재가 {formatWon(auction.currentPrice)}
            </span>
            {leading && (
              <span className="shrink-0 rounded bg-lime-highlight px-1 py-0.5 text-[10px] font-bold">최고 입찰 중</span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {auction.status === "CLOSED" ? (
            <span className="text-xs font-semibold text-[#8a8b86]">마감</span>
          ) : isOngoing ? (
            <CountdownDisplay
              remaining={remaining}
              extended={auction.status === "EXTENDED"}
              className="text-xs"
              awaitingClose
            />
          ) : (
            <span className="text-xs font-semibold text-[#8a8b86]">시작 전</span>
          )}
          {canOpen && (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-copy-primary">
              <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>
      {success && (
        <p role="status" className="mt-2 rounded-lg bg-[#f2fbe0] px-3 py-1.5 text-xs font-semibold text-[#3f6b00]">
          {success}
        </p>
      )}
    </div>
  );

  const sheet = open && !readOnly && (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button type="button" aria-label="입찰 닫기" onClick={closeSheet} className="absolute inset-0 bg-black/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={step === "select" ? "라이브 입찰" : "입찰 확인"}
        className="relative flex max-h-[85%] flex-col overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 text-copy-primary"
      >
        <div className="mx-auto mb-4 h-1 w-11 shrink-0 rounded-full bg-[#dededb]" />

        {step === "select" ? (
          <>
            <h2 className="truncate text-lg font-bold">{title}</h2>
            <p className="mt-0.5 text-[13px] font-semibold tabular-nums">현재가 {formatWon(auction.currentPrice)}</p>

            <div className="mt-5 flex items-end justify-between">
              <h3 className="text-base font-bold">라이브 입찰</h3>
              <CountdownDisplay
                remaining={remaining}
                extended={auction.status === "EXTENDED"}
                className="text-xs"
                awaitingClose
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-[#5c5d58]">입찰 금액</span>
              <span className="text-lg font-bold tabular-nums">{formatWon(amount)}</span>
            </div>
            <p className="text-right text-[11px] text-[#8a8b86]">최소 다음 입찰가 {formatWon(minNext)}</p>

            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {quickAdds.map((add) => {
                const value = auction.currentPrice + add;
                const selected = !customOpen && amount === value;
                return (
                  <button
                    type="button"
                    key={add}
                    onClick={() => {
                      setCustomOpen(false);
                      setError(null);
                      setAmount(value);
                    }}
                    aria-pressed={selected}
                    className={`rounded-full px-1 py-2.5 text-[11px] font-semibold tabular-nums ${
                      selected ? "bg-copy-primary text-white" : "bg-[#f2f2ef] text-[#5c5d58]"
                    }`}
                  >
                    +{add.toLocaleString("ko-KR")}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setCustomOpen(true);
                  setCustomText(String(amount));
                }}
                aria-pressed={customOpen}
                className={`rounded-full px-1 py-2.5 text-[11px] font-semibold ${
                  customOpen ? "bg-copy-primary text-white" : "bg-[#f2f2ef] text-[#5c5d58]"
                }`}
              >
                직접 입력
              </button>
            </div>

            {customOpen && (
              <label className="mt-2 flex items-center gap-2 rounded-xl border border-[#dededb] px-4 py-2.5 focus-within:border-copy-primary">
                <input
                  value={customText ? Number(customText).toLocaleString("ko-KR") : ""}
                  onChange={(event) => handleCustomChange(event.target.value)}
                  inputMode="numeric"
                  autoFocus
                  aria-label="입찰 금액 직접 입력"
                  placeholder={minNext.toLocaleString("ko-KR")}
                  className="min-w-0 flex-1 bg-transparent text-right text-base font-semibold tabular-nums outline-none"
                />
                <span className="text-sm text-[#5c5d58]">원</span>
              </label>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f6f7f2] px-4 py-3.5">
              <span className="text-xs text-[#5c5d58]">예상 결제 금액</span>
              <span className="text-base font-bold tabular-nums">{formatWon(estimate.total)}</span>
            </div>

            {notice && <p className="mt-3 text-xs font-semibold text-[#e0443e]">{notice}</p>}
            {error && (
              <p role="alert" className="mt-3 text-xs text-[#e0443e]">
                {error}
              </p>
            )}

            {isLoggedIn ? (
              <button
                type="button"
                onClick={goConfirm}
                disabled={amount < minNext}
                className="mt-5 h-12 w-full rounded-xl bg-lime-highlight text-[15px] font-bold tabular-nums disabled:opacity-40"
              >
                {formatWon(amount)} 입찰
              </button>
            ) : (
              <Link
                href="/login"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-copy-primary text-[15px] font-bold text-white"
              >
                로그인 후 입찰하기
              </Link>
            )}
            <p className="mt-2 text-center text-[10px] text-[#8a8b86]">마감 30초 이내 입찰은 마감을 30초 연장합니다.</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("select");
                }}
                disabled={submitting}
                aria-label="금액 다시 선택"
                className="-ml-2 grid h-8 w-8 place-items-center rounded-full disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h2 className="text-base font-bold">입찰 진행</h2>
            </div>

            <p className="mt-4 truncate text-lg font-bold">{title}</p>
            <p className="mt-0.5 text-xs text-[#5c5d58] tabular-nums">현재가 {formatWon(auction.currentPrice)}</p>

            <p className="mt-5 text-xs text-[#5c5d58]">입찰 금액</p>
            <p className="text-[28px] font-black leading-tight tabular-nums">{formatWon(amount)}</p>

            <dl className="mt-4 space-y-2.5 rounded-xl bg-[#f6f7f2] px-4 py-3.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#5c5d58]">입찰 금액</dt>
                <dd className="font-semibold tabular-nums">{formatWon(estimate.bidPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5c5d58]">예상 구매 수수료 (10%)</dt>
                <dd className="font-semibold tabular-nums">{formatWon(estimate.premiumFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5c5d58]">배송비</dt>
                <dd className="font-semibold tabular-nums">{formatWon(estimate.shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-[#e3e4de] pt-2.5">
                <dt className="font-semibold">낙찰 시 예상 결제 금액</dt>
                <dd className="font-bold tabular-nums">{formatWon(estimate.total)}</dd>
              </div>
            </dl>

            {/* 서버는 내 입찰이 아직 최고가일 때만 취소를 허용한다(BidService.cancelBid). */}
            <div className="mt-3 rounded-xl bg-[#fff3f2] px-4 py-3">
              <p className="text-xs font-bold text-[#e0443e]">다른 입찰이 들어오면 취소할 수 없습니다.</p>
              <p className="mt-1 text-[11px] text-[#5c5d58]">금액과 작품 정보를 다시 확인해 주세요.</p>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-xs text-[#e0443e]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleBid}
              disabled={submitting || amount < minNext}
              className="mt-5 h-12 w-full rounded-xl bg-copy-primary text-[15px] font-bold text-white tabular-nums disabled:opacity-40"
            >
              {submitting ? "입찰 중..." : `${formatWon(amount)} 입찰 제출`}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {card}
      {sheet && overlayRoot && createPortal(sheet, overlayRoot)}
    </>
  );
}
