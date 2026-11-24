'use client';

// 어드민 "경매 상태 관리" 화면의 작품 한 줄(카드).
// 작품 상태에 따라 보여주는 액션이 달라진다.
//  - PENDING_REVIEW: 승인 / 반려 버튼
//  - PREVIEW이면서 경매가 아직 없음: "경매 생성" 폼 (시작가/최소입찰단위/기간)
//  - 경매가 있음: 현재 경매 상태 + 상태를 직접 바꾸는 선택창(관리자 수동 전환)
//  - 경매가 마감됨: 같은 작품을 새 경매로 다시 여는 폼
import axios from 'axios';
import { useState } from 'react';
import { fetchAdminRow, type AdminRow } from '@/lib/adminArtworks';
import AdminAuctionCreateForm from '@/components/AdminAuctionCreateForm';
import ReopenEndPicker, {
  REOPEN_END_ERROR,
  reopenDurationMinutes,
  reopenEndAfterDays,
} from '@/components/ReopenEndPicker';
import {
  approveArtwork,
  errorMessage,
  fetchArtworkDetail,
  rejectArtwork,
  reopenAuction,
  unpublishArtwork,
  updateAuctionStatus,
} from '@/lib/api';
import { summaryOf } from '@/lib/lots';
import type { ArtworkStatus, Auction, AuctionStatus } from '@/types';

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

const LOOKUP_FAILURE_MESSAGE = {
  auction: '연결 경매를 불러오지 못했습니다.',
  mismatch: '작품과 연결 경매 정보가 일치하지 않습니다.',
  artwork: '최신 작품 정보를 불러오지 못했습니다.',
};

export default function AdminArtworkRow({
  row,
  onChange,
  selected,
  onToggleSelect,
}: {
  row: AdminRow;
  onChange: (next: AdminRow) => void;
  selected?: boolean;
  // 다시 열 수 있는 작품에만 넘긴다. 없으면 선택 체크박스를 보여주지 않는다.
  onToggleSelect?: () => void;
}) {
  const { artwork, auction, auctionStatus } = row;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const canCreateAuction =
    auctionStatus === 'none' && artwork.status !== 'PENDING_REVIEW' && artwork.status !== 'REJECTED';

  const [nextAuctionStatus, setNextAuctionStatus] = useState<AuctionStatus>(auction?.status ?? 'ONGOING');
  const [reopenEndAt, setReopenEndAt] = useState(() => reopenEndAfterDays(7));

  const handleApprove = async () => {
    setError(null);
    setBusy(true);
    try {
      await approveArtwork(artwork.id);
      onChange({ ...row, artwork: { ...artwork, status: 'PREVIEW' } });
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
      onChange({ ...row, artwork: { ...artwork, status: 'REJECTED' } });
    } catch (cause) {
      setError(errorMessage(cause, '반려에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handleAuctionCreated = (created: Auction) => {
    setNextAuctionStatus(created.status);
    setShowCreateForm(false);
    onChange({ artwork: { ...artwork, auctionId: created.id }, auctionStatus: 'loaded', auction: created });
  };

  const handleReopen = async () => {
    if (!auction) return;
    const minutes = reopenDurationMinutes(reopenEndAt);
    if (minutes === null) {
      setError(REOPEN_END_ERROR);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const created = await reopenAuction(auction.id, minutes);
      setNextAuctionStatus(created.status);
      onChange({
        artwork: { ...artwork, status: 'IN_AUCTION', auctionId: created.id },
        auctionStatus: 'loaded',
        auction: created,
      });
    } catch (cause) {
      setError(errorMessage(cause, '경매를 다시 열지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    setError(null);
    setBusy(true);
    try {
      await unpublishArtwork(artwork.id);
      onChange({ ...row, artwork: { ...artwork, status: 'REJECTED' } });
    } catch (cause) {
      setError(errorMessage(cause, '작품을 내리지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const refreshRow = async () => {
    try {
      const current = await fetchArtworkDetail(artwork.id);
      const refreshed = await fetchAdminRow(summaryOf(current));
      setNextAuctionStatus(refreshed.auction?.status ?? 'ONGOING');
      onChange(refreshed);
    } catch {
      onChange({ artwork, auctionStatus: 'failed', auction: null, failure: 'artwork' });
    }
  };

  const handleStatusChange = async () => {
    if (!auction) return;
    setError(null);
    setBusy(true);
    try {
      await updateAuctionStatus(auction.id, nextAuctionStatus);
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setError(status === 403 ? '관리자 권한이 필요합니다.' : errorMessage(cause, '경매 상태 변경에 실패했습니다.'));
    }
    await refreshRow();
    setBusy(false);
  };

  const retryRefresh = async () => {
    setBusy(true);
    await refreshRow();
    setBusy(false);
  };

  return (
    <div className="rounded-[14px] border border-[#dfe0da] p-4">
      <div className="flex items-start justify-between gap-3">
        {onToggleSelect && (
          <input
            type="checkbox"
            aria-label={`${artwork.title} 선택`}
            checked={Boolean(selected)}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
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

      {/* 폼을 닫아도 다시 열 때 기존 입력을 유지한다. */}
      <div className="mt-3" hidden={!canCreateAuction}>
        {canCreateAuction && !showCreateForm && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowCreateForm(true)}
            className="h-10 w-full rounded-[8px] border border-[#dfe0da] text-[13px] font-bold disabled:opacity-50"
          >
            경매 생성
          </button>
        )}
        <AdminAuctionCreateForm
          artworkId={artwork.id}
          artworkStartPrice={artwork.startPrice}
          open={canCreateAuction && showCreateForm}
          busy={busy}
          onCancel={() => setShowCreateForm(false)}
          onBusyChange={setBusy}
          onError={setError}
          onCreated={handleAuctionCreated}
        />
      </div>

      {auction && (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#f7f8f4] p-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#73756f]">
              경매 #{auction.id} · 현재가 {auction.currentPrice.toLocaleString()}원
            </p>
            <select
              disabled={busy || auction.status === 'CLOSED'}
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
            disabled={busy || auction.status === 'CLOSED' || nextAuctionStatus === auction.status}
            onClick={handleStatusChange}
            className="h-10 shrink-0 rounded-[8px] bg-[#a8ff00] px-4 text-[13px] font-bold disabled:opacity-50"
          >
            변경
          </button>
        </div>
      )}

      {auction?.status === 'CLOSED' && artwork.status !== 'REJECTED' && (
        <div className="mt-3 space-y-2 rounded-[10px] bg-[#f7f8f4] p-3">
          <ReopenEndPicker value={reopenEndAt} onChange={setReopenEndAt} disabled={busy} />
          <p className="text-[11px] leading-5 text-[#73756f]">
            시작가부터 새 경매가 바로 진행됩니다. 미결제 낙찰은 무효가 되고, 결제가 완료됐거나 진행 중이면
            다시 열 수 없습니다.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleReopen}
            className="h-10 w-full rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
          >
            {busy ? '여는 중...' : '다시 열기'}
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
      {auctionStatus === 'failed' && (
        <p role="status" className="mt-3 text-sm text-[#c13d32]">
          {LOOKUP_FAILURE_MESSAGE[row.failure]}{' '}
          <button type="button" className="underline" disabled={busy} onClick={retryRefresh}>
            다시 조회
          </button>
        </p>
      )}
    </div>
  );
}
