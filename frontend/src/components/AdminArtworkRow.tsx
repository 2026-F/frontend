'use client';

// 어드민 "경매 상태 관리" 화면의 작품 한 줄(카드).
// 작품 상태에 따라 보여주는 액션이 달라진다.
//  - PENDING_REVIEW: 승인 / 반려 버튼
//  - PREVIEW이면서 경매가 아직 없음: "경매 생성" 폼 (시작가/최소입찰단위/기간)
//  - 경매가 있음: 현재 경매 상태 + 상태를 직접 바꾸는 선택창(관리자 수동 전환)
import axios from 'axios';
import { useState } from 'react';
import type { AdminRow } from '@/app/admin/page';
import { approveArtwork, createAuction, errorMessage, rejectArtwork, unpublishArtwork, updateAuctionStatus } from '@/lib/api';
import type { ArtworkStatus, AuctionStatus } from '@/types';

const ARTWORK_STATUS_LABELS: Record<ArtworkStatus, string> = {
  PENDING_REVIEW: '심사 대기',
  PREVIEW: '프리뷰',
  IN_AUCTION: '경매 중',
  SOLD: '낙찰 완료',
  REJECTED: '반려됨',
};

const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  SCHEDULED: '예정',
  PREVIEW: '프리뷰',
  ONGOING: '진행 중',
  EXTENDED: '연장 중',
  CLOSED: '마감',
};

const AUCTION_STATUSES: AuctionStatus[] = ['SCHEDULED', 'PREVIEW', 'ONGOING', 'EXTENDED', 'CLOSED'];

// <input type="datetime-local">가 쓰는 "YYYY-MM-DDTHH:mm" 형식으로 바꿔준다 (기본값 채우기용).
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// datetime-local 입력값(초가 없음)을 백엔드가 받는 LocalDateTime 형식으로 보정한다.
// 주의: 서버가 UTC로 돌고 있으면 여기서 입력한 "내 지역 시각" 그대로 저장되기 때문에
// 실제로는 9시간 차이가 날 수 있다 — 화면에서 시간이 이상하게 보이면 9시간을 앞/뒤로 조정해보자.
function toBackendDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

export default function AdminArtworkRow({
  artwork,
  auction,
  onChange,
}: {
  artwork: AdminRow['artwork'];
  auction: AdminRow['auction'];
  onChange: (next: AdminRow) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const now = new Date();
  const [startPrice, setStartPrice] = useState(String(artwork.startPrice ?? ''));
  const [minBidUnit, setMinBidUnit] = useState(String(Math.max(10_000, Math.round((artwork.startPrice ?? 0) * 0.02))));
  const [previewStart, setPreviewStart] = useState(toLocalInputValue(new Date(now.getTime() - 60_000)));
  const [previewEnd, setPreviewEnd] = useState(toLocalInputValue(new Date(now.getTime() + 60_000)));
  const [auctionEndAt, setAuctionEndAt] = useState(toLocalInputValue(new Date(now.getTime() + 24 * 60 * 60_000)));

  const [nextAuctionStatus, setNextAuctionStatus] = useState<AuctionStatus>(auction?.status ?? 'ONGOING');

  const handleApprove = async () => {
    setError(null);
    setBusy(true);
    try {
      await approveArtwork(artwork.id);
      onChange({ artwork: { ...artwork, status: 'PREVIEW' }, auction });
    } catch (cause) {
      setError(errorMessage(cause, '승인에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setError(null);
    setBusy(true);
    try {
      await rejectArtwork(artwork.id);
      onChange({ artwork: { ...artwork, status: 'REJECTED' }, auction });
    } catch (cause) {
      setError(errorMessage(cause, '반려에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAuction = async () => {
    const parsedStartPrice = Number(startPrice);
    const parsedMinBidUnit = Number(minBidUnit);
    if (!Number.isInteger(parsedStartPrice) || parsedStartPrice <= 0) {
      setError('시작가는 0보다 큰 정수로 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(parsedMinBidUnit) || parsedMinBidUnit <= 0) {
      setError('최소 입찰 단위는 0보다 큰 정수로 입력해 주세요.');
      return;
    }
    if (!previewStart || !previewEnd || !auctionEndAt) {
      setError('프리뷰 시작/종료, 경매 마감 시각을 모두 입력해 주세요.');
      return;
    }
    if (!(previewStart < previewEnd)) {
      setError('프리뷰 시작 시각은 프리뷰 종료 시각보다 빨라야 합니다.');
      return;
    }
    if (auctionEndAt < previewEnd) {
      setError('경매 마감 시각은 프리뷰 종료 시각보다 빠를 수 없습니다.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const created = await createAuction({
        artworkId: artwork.id,
        startPrice: parsedStartPrice,
        minBidUnit: parsedMinBidUnit,
        previewStart: toBackendDateTime(previewStart),
        previewEnd: toBackendDateTime(previewEnd),
        auctionEndAt: toBackendDateTime(auctionEndAt),
      });
      setNextAuctionStatus(created.status);
      setShowCreateForm(false);
      onChange({ artwork: { ...artwork, auctionId: created.id }, auction: created });
    } catch (cause) {
      setError(errorMessage(cause, '경매 생성에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    setError(null);
    setBusy(true);
    try {
      await unpublishArtwork(artwork.id);
      onChange({ artwork: { ...artwork, status: 'REJECTED' }, auction });
    } catch (cause) {
      setError(errorMessage(cause, '작품을 내리지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async () => {
    if (!auction) return;
    setError(null);
    setBusy(true);
    try {
      await updateAuctionStatus(auction.id, nextAuctionStatus);
      const updatedArtwork =
        nextAuctionStatus === 'ONGOING' && artwork.status === 'PREVIEW'
          ? { ...artwork, status: 'IN_AUCTION' as ArtworkStatus }
          : artwork;
      onChange({ artwork: updatedArtwork, auction: { ...auction, status: nextAuctionStatus } });
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setError(status === 403 ? '관리자 권한이 필요합니다.' : errorMessage(cause, '경매 상태 변경에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[14px] border border-[#dfe0da] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold">{artwork.title}</p>
          <p className="mt-1 text-[12px] text-[#73756f]">
            id {artwork.id} · {artwork.category ?? '카테고리 미정'}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#f7f8f4] px-2.5 py-1 text-[12px] font-semibold text-[#171717]">
          {ARTWORK_STATUS_LABELS[artwork.status]}
        </span>
      </div>

      {artwork.status === 'PENDING_REVIEW' && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleApprove}
            className="h-10 flex-1 rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
          >
            승인
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleReject}
            className="h-10 flex-1 rounded-[8px] border border-[#dfe0da] text-[13px] font-bold disabled:opacity-50"
          >
            반려
          </button>
        </div>
      )}

      {!auction && artwork.status !== 'PENDING_REVIEW' && artwork.status !== 'REJECTED' && (
        <div className="mt-3">
          {!showCreateForm ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowCreateForm(true)}
              className="h-10 w-full rounded-[8px] border border-[#dfe0da] text-[13px] font-bold disabled:opacity-50"
            >
              경매 생성
            </button>
          ) : (
            <div className="space-y-3 rounded-[10px] bg-[#f7f8f4] p-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-semibold">시작가(원)</label>
                  <input
                    type="number"
                    step="1"
                    disabled={busy}
                    value={startPrice}
                    onChange={(event) => setStartPrice(event.target.value)}
                    className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold">최소 입찰 단위</label>
                  <input
                    type="number"
                    step="1"
                    disabled={busy}
                    value={minBidUnit}
                    onChange={(event) => setMinBidUnit(event.target.value)}
                    className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold">프리뷰 시작</label>
                <input
                  type="datetime-local"
                  disabled={busy}
                  value={previewStart}
                  onChange={(event) => setPreviewStart(event.target.value)}
                  className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold">프리뷰 종료 (경매 시작)</label>
                <input
                  type="datetime-local"
                  disabled={busy}
                  value={previewEnd}
                  onChange={(event) => setPreviewEnd(event.target.value)}
                  className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold">경매 마감</label>
                <input
                  type="datetime-local"
                  disabled={busy}
                  value={auctionEndAt}
                  onChange={(event) => setAuctionEndAt(event.target.value)}
                  className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
                />
              </div>
              <p className="text-[11px] leading-5 text-[#73756f]">
                서버가 UTC로 동작 중이면 실제로는 9시간 차이가 날 수 있어요. 경매를 만든 뒤 바로 아래 상태를
                &ldquo;진행 중&rdquo;으로 바꾸면 시간과 무관하게 즉시 입찰이 가능해집니다.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowCreateForm(false)}
                  className="h-10 flex-1 rounded-[8px] border border-[#dfe0da] bg-white text-[13px] font-bold disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateAuction}
                  className="h-10 flex-1 rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
                >
                  {busy ? '생성 중...' : '경매 생성'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {auction && (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#f7f8f4] p-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#73756f]">
              경매 #{auction.id} · 현재가 {auction.currentPrice.toLocaleString()}원
            </p>
            <select
              disabled={busy}
              value={nextAuctionStatus}
              onChange={(event) => setNextAuctionStatus(event.target.value as AuctionStatus)}
              className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
            >
              {AUCTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {AUCTION_STATUS_LABELS[status]}
                  {status === auction.status ? ' (현재)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={busy || nextAuctionStatus === auction.status}
            onClick={handleStatusChange}
            className="h-10 shrink-0 rounded-[8px] bg-[#a8ff00] px-4 text-[13px] font-bold disabled:opacity-50"
          >
            변경
          </button>
        </div>
      )}

      {(artwork.status === 'PREVIEW' || artwork.status === 'IN_AUCTION') && (
        <button
          type="button"
          disabled={busy}
          onClick={handleUnpublish}
          className="mt-3 h-10 w-full rounded-[8px] border border-[#c13b32] text-[13px] font-bold text-[#c13b32] disabled:opacity-50"
        >
          작품 내리기 (비공개로 전환)
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-[#c13b32]">
          {error}
        </p>
      )}
    </div>
  );
}
