'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAuction, fetchAuctionLive, fetchBids, subscribeAuctionEvents } from '@/lib/api';
import { auctionClock, type AuctionClock } from '@/lib/auctionClock';
import type { Auction, AuctionLiveView, Bid } from '@/types';

const FALLBACK_POLL_MS = 5000;

function sameAuctionState(auction: Auction, view: AuctionLiveView) {
  return (
    auction.id === view.auctionId &&
    auction.currentPrice === view.currentPrice &&
    auction.minBidUnit === view.minBidUnit &&
    auction.auctionEndAt === view.auctionEndAt &&
    auction.status === view.status
  );
}

function latestBids(list: Bid[]) {
  const unique = new Map(list.map((bid) => [bid.bidId, bid]));
  return [...unique.values()]
    .filter((bid) => !bid.canceled)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.bidId - a.bidId);
}

export function useAuctionLive(initial: Auction) {
  const auctionId = initial.id;
  const [live, setLive] = useState<{ auction: Auction; clock: AuctionClock | null }>({
    auction: initial,
    clock: null,
  });
  const [bids, setBids] = useState<Bid[]>([]);
  const [statusFailed, setStatusFailed] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const refresh = useCallback(() => refreshRef.current(), []);

  useEffect(() => {
    let active = true;
    let connected = false;
    let latest: { version: number; time: number } | undefined;
    let highestVersion = -1;
    let historyVersion = -1;
    let statusRequest: AbortController | undefined;
    let historyRequest: AbortController | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;

    const refreshHistory = async () => {
      historyRequest?.abort();
      const request = new AbortController();
      historyRequest = request;
      try {
        const list = await fetchBids(auctionId, request.signal);
        if (!request.signal.aborted) {
          setBids(latestBids(list));
          setHistoryFailed(false);
        }
      } catch {
        if (!request.signal.aborted) setHistoryFailed(true);
      }
    };

    const applyView = (view: AuctionLiveView, clock: AuctionClock) => {
      latest = { version: view.version, time: clock.serverTimeMs };
      highestVersion = Math.max(highestVersion, view.version);
      setLive(({ auction }) => ({
        auction: {
          ...auction,
          currentPrice: view.currentPrice,
          minBidUnit: view.minBidUnit,
          auctionEndAt: view.auctionEndAt,
          status: view.status,
        },
        clock,
      }));
      setStatusFailed(false);
    };

    const acceptView = (view: AuctionLiveView, clock: AuctionClock) => {
      if (!latest) return true;
      // Keep the watermark when Redis resets to a DB snapshot at version 0.
      if (latest.version === 0 && view.version > 0 && view.version <= highestVersion) return false;
      return (
        view.version > latest.version ||
        (view.version === latest.version && clock.serverTimeMs > latest.time)
      );
    };

    const refreshStatus = async () => {
      statusRequest?.abort();
      const request = new AbortController();
      statusRequest = request;
      const beforeRequest = latest;
      try {
        const view = await fetchAuctionLive(auctionId, request.signal);
        if (request.signal.aborted || view.auctionId !== auctionId) return;
        const clock = auctionClock(view.serverTime);
        if (!clock) throw new Error('Invalid server clock');

        if (view.version === 0 && latest && latest.version > 0) {
          // A cache reset returns a new DB snapshot with version 0.
          if (latest !== beforeRequest) return;
          const current = await fetchAuction(auctionId, request.signal);
          if (request.signal.aborted || latest !== beforeRequest) return;
          if (!sameAuctionState(current, view)) throw new Error('Live snapshot changed');
          historyVersion = -1;
          applyView(view, clock);
        } else if (acceptView(view, clock)) {
          applyView(view, clock);
        }
      } catch {
        if (!request.signal.aborted && latest === beforeRequest) setStatusFailed(true);
      } finally {
        if (statusRequest === request) statusRequest = undefined;
      }
    };

    const refreshAll = async () => {
      if (active) await Promise.all([refreshStatus(), refreshHistory()]);
    };

    const schedulePoll = () => {
      clearInterval(poll);
      if (!connected && !document.hidden) {
        poll = setInterval(() => {
          if (!statusRequest) void refreshAll();
        }, FALLBACK_POLL_MS);
      }
    };

    const onVisibility = () => {
      if (!document.hidden) void refreshAll();
      schedulePoll();
    };

    refreshRef.current = refreshAll;
    void refreshAll();
    const unsubscribe = subscribeAuctionEvents(
      auctionId,
      (view) => {
        if (!active || view.auctionId !== auctionId) return;
        const clock = auctionClock(view.serverTime);
        if (!clock) return;
        if (view.version === 0 && latest && latest.version > 0) {
          if (!statusRequest) void refreshAll();
          return;
        }
        const versionChanged = view.version !== latest?.version;
        if (acceptView(view, clock)) applyView(view, clock);
        const historyChanged =
          view.reason === 'BID' || view.reason === 'BID_CANCELED' || (view.reason === 'TICK' && versionChanged);
        if (!document.hidden && historyChanged && view.version === latest?.version && view.version > historyVersion) {
          historyVersion = view.version;
          void refreshHistory();
        }
      },
      {
        onOpen: () => {
          connected = true;
          schedulePoll();
          void refreshAll();
        },
        onError: () => {
          connected = false;
          schedulePoll();
        },
      },
    );
    schedulePoll();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      unsubscribe();
      statusRequest?.abort();
      historyRequest?.abort();
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [auctionId]);

  return { ...live, bids, statusFailed, historyFailed, refresh };
}
