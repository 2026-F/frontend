"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuctionStatus, Lot } from "@/types";
import { fetchAuction, submitBid, subscribeAuctionEvents } from "@/lib/api";
import { formatDateTime, formatWon } from "@/lib/format";
import { AuctionStatusBadge } from "@/components/StatusBadge";
import CountdownTimer from "@/components/CountdownTimer";

interface BidLogEntry {
  id: string;
  price: number;
  bidderId: number;
  createdAt: string;
  mine?: boolean;
}

interface AuctionEventPayload {
  currentPrice?: number;
  auctionEndAt?: string;
  extended?: boolean;
  bidderId?: number;
}

function randomBidderId() {
  return 1000 + Math.floor(Math.random() * 900);
}

export default function BidPanel({ lot }: { lot: Lot }) {
  const [auction, setAuction] = useState(lot.auction);
  const [bidderId, setBidderId] = useState(randomBidderId());
  const [amount, setAmount] = useState(lot.auction.currentPrice + lot.auction.minBidUnit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<BidLogEntry[]>(() =>
    lot.isMock
      ? [
          {
            id: "seed-1",
            price: lot.auction.currentPrice,
            bidderId: randomBidderId(),
            createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          },
        ]
      : [],
  );

  const isBiddable = auction.status === "ONGOING" || auction.status === "EXTENDED";
  const minNext = auction.currentPrice + auction.minBidUnit;

  // 현재가가 바뀌면 다음 최소 입찰가로 입력값을 맞춰줌 (입력값이 이미 그보다 크면 유지)
  useEffect(() => {
    setAmount((prev) => (prev < minNext ? minNext : prev));
  }, [minNext]);

  useEffect(() => {
    let cancelled = false;

    // 실제 백엔드에 이 경매 데이터가 있으면 목데이터 대신 실제 값으로 갱신
    fetchAuction(auction.id)
      .then((real) => {
        if (!cancelled) setAuction(real);
      })
      .catch(() => {
        /* 백엔드가 없거나 아직 이 id가 없으면 넘겨받은 값(목데이터)을 그대로 사용 */
      });

    const unsubscribe = subscribeAuctionEvents(
      auction.id,
      (data) => {
        if (data && typeof data === "object") {
          const payload = data as AuctionEventPayload;
          if (typeof payload.currentPrice === "number") {
            setAuction((prev) => ({
              ...prev,
              currentPrice: payload.currentPrice as number,
              auctionEndAt: payload.auctionEndAt ?? prev.auctionEndAt,
              status: payload.extended ? ("EXTENDED" as AuctionStatus) : prev.status,
            }));
            setLog((prev) => [
              {
                id: `sse-${Date.now()}`,
                price: payload.currentPrice as number,
                bidderId: payload.bidderId ?? 0,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        }
      },
    );

    // 백엔드가 아직 SSE로 입찰 이벤트를 브로드캐스트하지 않는 경우(README TODO)를 대비해
    // 주기적으로 현재가를 다시 조회해서 다른 사람의 입찰도 반영되도록 보강함
    const poll = setInterval(() => {
      fetchAuction(auction.id)
        .then((real) => {
          if (cancelled) return;
          setAuction((prev) =>
            real.currentPrice !== prev.currentPrice || real.status !== prev.status ? real : prev,
          );
        })
        .catch(() => {});
    }, 5000);

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction.id]);

  const quickAdds = useMemo(
    () => [1, 5, 10].map((multiplier) => auction.minBidUnit * multiplier),
    [auction.minBidUnit],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitBid(auction.id, bidderId, amount);
      setAuction((prev) => ({
        ...prev,
        currentPrice: result.currentPrice,
        auctionEndAt: result.auctionEndAt,
        status: result.extended ? "EXTENDED" : prev.status,
      }));
      setLog((prev) => [
        {
          id: `me-${Date.now()}`,
          price: result.currentPrice,
          bidderId,
          createdAt: new Date().toISOString(),
          mine: true,
        },
        ...prev,
      ]);
      setAmount(result.currentPrice + auction.minBidUnit);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: unknown } })?.response;
      const data = response?.data;
      const message =
        typeof data === "string"
          ? data
          : (data as { message?: string })?.message ?? "입찰에 실패했습니다. 백엔드가 실행 중인지 확인해주세요.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AuctionStatusBadge status={auction.status} />
        <h1 className="mt-3 font-display text-3xl font-semibold text-[#171717]">{lot.artwork.title}</h1>
        <p className="mt-1 text-[#73756f]">
          {lot.artistName} · {lot.category}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[#171717] bg-[#171717] p-6 text-white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#bfc1bb]">현재가</p>
            <p className="font-display text-4xl font-semibold text-white">{formatWon(auction.currentPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#bfc1bb]">마감까지</p>
            <CountdownTimer target={auction.auctionEndAt} extended={auction.status === "EXTENDED"} className="text-lg" tone="dark" />
          </div>
        </div>
        <p className="text-xs text-[#bfc1bb]">
          최소 입찰 단위 {formatWon(auction.minBidUnit)} · 마감 예정 {formatDateTime(auction.auctionEndAt)}
        </p>

        {isBiddable ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-white/20 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-[#bfc1bb]">
                입찰자 ID (데모용)
                <input
                  type="number"
                  value={bidderId}
                  onChange={(e) => setBidderId(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/30 bg-[#292b27] px-4 py-2.5 text-sm text-white focus:border-[#b8f53d] focus:outline-none focus:ring-1 focus:ring-[#b8f53d]"
                />
              </label>
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
                  {idx === 0 && " (최소)"}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-[#ff6761]">{error}</p>}

            <button type="submit" disabled={submitting || amount < minNext} className="btn-primary mt-1">
              {submitting ? "입찰 중..." : `${formatWon(amount)}에 입찰하기`}
            </button>
            <p className="text-[11px] text-[#bfc1bb]">
              마감 30초 이내에 입찰이 들어오면 마감이 자동으로 30초 연장됩니다 (안티 스나이핑).
            </p>
          </form>
        ) : (
          <p className="border-t border-white/20 pt-4 text-sm text-[#bfc1bb]">
            {auction.status === "CLOSED" ? "이미 마감된 경매입니다." : "아직 입찰이 시작되지 않았습니다."}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#171717] bg-[#171717] p-6 text-white">
        <p className="text-sm font-semibold text-white">실시간 입찰 내역</p>
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-sm text-[#bfc1bb]">아직 입찰 내역이 없습니다.</p>
          ) : (
            log.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  entry.mine ? "bg-[#33421d] text-white" : "bg-white/10 text-white"
                }`}
              >
                <span>입찰자 #{entry.bidderId}</span>
                <span className="font-semibold">{formatWon(entry.price)}</span>
                <span className="text-xs text-[#bfc1bb]">
                  {new Date(entry.createdAt).toLocaleTimeString("ko-KR")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {lot.isMock && (
        <p className="text-xs text-[#73756f]">
          * 초기 현재가는 목데이터입니다. 백엔드가 실행 중이고 같은 id의 경매가 있으면 실제 API 응답으로 자동
          갱신됩니다.
        </p>
      )}
    </div>
  );
}
