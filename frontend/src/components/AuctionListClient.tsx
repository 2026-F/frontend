'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionStatus, CatalogItem, PageResponse } from '@/types';
import AuctionCard from '@/components/AuctionCard';
import PageNavigation from '@/components/PageNavigation';
import { fetchAuctionLive } from '@/lib/api';
import { auctionClock, type AuctionClock } from '@/lib/auctionClock';
import { getLots } from '@/lib/lots';

const REFRESH_INTERVAL_MS = 30_000;
const PARTIAL_ERROR = '일부 경매 정보를 갱신하지 못했습니다.';

const FILTERS: { key: string; label: string; match: (s: AuctionStatus) => boolean }[] = [
  { key: 'all', label: '전체', match: () => true },
  { key: 'ongoing', label: '진행중', match: (s) => s === 'ONGOING' || s === 'EXTENDED' },
  { key: 'preview', label: '입찰 전', match: (s) => s === 'PREVIEW' || s === 'SCHEDULED' },
  { key: 'closed', label: '마감', match: (s) => s === 'CLOSED' },
];

export default function AuctionListClient({ initialPage }: { initialPage: PageResponse<CatalogItem> }) {
  const [page, setPage] = useState(initialPage);
  const [filter, setFilter] = useState('all');
  const [clock, setClock] = useState<AuctionClock | null>(null);
  const [error, setError] = useState<string | null>(
    initialPage.content.some((item) => item.auctionError) ? PARTIAL_ERROR : null,
  );
  const [clockFailed, setClockFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const requestRef = useRef<AbortController>();

  const refresh = useCallback(async (clockOnly = false) => {
    if (requestRef.current) return;
    const request = new AbortController();
    const { signal } = request;
    requestRef.current = request;
    setPending(true);
    try {
      const next = clockOnly ? initialPage : await getLots(
        { page: initialPage.page, size: initialPage.size },
        signal,
      );
      if (signal.aborted) return;
      if (!clockOnly) {
        setError(next.content.some((item) => item.auctionError) ? PARTIAL_ERROR : null);
        setPage((previous) => {
          const previousLots = new Map(previous.content.map((item) => [item.artwork.id, item.auction]));
          return {
            ...next,
            content: next.content.map((item) => {
              const auction = previousLots.get(item.artwork.id);
              return item.auctionError && auction && auction.id === item.artwork.auctionId
                ? { ...item, auction, auctionError: undefined }
                : item;
            }),
          };
        });
      }
      const active = next.content.find(({ auction }) => auction?.status === 'ONGOING' || auction?.status === 'EXTENDED');
      if (!active?.auction) {
        setClockFailed(false);
        return;
      }
      try {
        const view = await fetchAuctionLive(active.auction.id, signal);
        const nextClock = auctionClock(view.serverTime);
        if (!nextClock) throw new Error('Invalid server clock');
        if (!signal.aborted) {
          setClock(nextClock);
          setClockFailed(false);
        }
      } catch {
        if (!signal.aborted) setClockFailed(true);
      }
    } catch {
      if (!signal.aborted) setError('경매 목록을 갱신하지 못했습니다. 마지막으로 불러온 정보를 표시합니다.');
    } finally {
      if (requestRef.current === request) {
        requestRef.current = undefined;
        setPending(false);
      }
    }
  }, [initialPage]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const schedule = () => {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    };
    const onVisibility = () => {
      if (!document.hidden) void refresh();
      schedule();
    };
    if (!document.hidden) void refresh(true);
    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      requestRef.current?.abort();
      requestRef.current = undefined;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  const lots = page.content;
  const filtered = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    return lots.filter(
      (lot) => filter === 'all' || (lot.auction !== null && active.match(lot.auction.status)),
    );
  }, [lots, filter]);

  return (
    <div className="flex flex-col gap-5">
      {(error || clockFailed) && (
        <div role="status" className="rounded-xl bg-[#f7f8f4] p-4 text-sm text-[#555751]">
          {error && <p>{error}</p>}
          {clockFailed && <p>서버 마감 시각을 갱신하지 못했습니다.</p>}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={pending}
            className="mt-2 underline disabled:opacity-50"
          >
            다시 시도
          </button>
        </div>
      )}
      <p className="text-xs text-[#73756f]">
        상태 필터는 현재 페이지에만 적용됩니다. 경매 없는 작품은 전체에서 확인할 수 있습니다.
      </p>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              filter === f.key
                ? 'border-[#171717] bg-[#171717] font-semibold text-[#b8f53d]'
                : 'border-[#d9dcd2] text-[#454641] hover:border-[#8dbb30] hover:text-[#566e22]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#73756f]">
          현재 페이지에 해당하는 작품이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((lot) => (
            <AuctionCard key={lot.artwork.id} lot={lot} clock={clock} />
          ))}
        </div>
      )}
      <PageNavigation page={page} path="/auctions" />
    </div>
  );
}
