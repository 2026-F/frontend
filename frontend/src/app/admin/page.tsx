'use client';

// 어드민용 "경매 상태 관리" 화면.
// 1) 작품 승인/반려 (PENDING_REVIEW -> PREVIEW/REJECTED)
// 2) 승인된 작품(PREVIEW)에 경매 생성 (시작가 / 프리뷰 기간 / 마감시간)
// 3) 이미 만들어진 경매의 상태를 직접 바꾸기 (SCHEDULED/PREVIEW/ONGOING/EXTENDED/CLOSED)
// 4) 마감된 경매를 골라 새 경매로 다시 열기 (개별 또는 일괄)
//
// 참고: 지금 백엔드에는 PREVIEW 경매를 시간에 맞춰 자동으로 ONGOING으로 바꿔주는 기능이
// 없어서, 3번에서 상태를 직접 ONGOING으로 바꿔줘야 실제로 입찰이 가능해진다.
import { useEffect, useState } from 'react';
import AdminArtworkRow from '@/components/AdminArtworkRow';
import ReopenEndPicker, {
  REOPEN_END_ERROR,
  reopenDurationMinutes,
  reopenEndAfterDays,
} from '@/components/ReopenEndPicker';
import { fetchAdminRow, fetchAllArtworksByStatus, type AdminRow } from '@/lib/adminArtworks';
import { errorMessage, reopenAuction } from '@/lib/api';
import type { ArtworkStatus } from '@/types';

const STATUSES: ArtworkStatus[] = ['PENDING_REVIEW', 'PREVIEW', 'IN_AUCTION', 'SOLD', 'REJECTED'];
// 목록에서 더 신경써야 할 상태(심사 대기 등)가 위로 오도록 정렬 순서를 정해둔다.
const STATUS_ORDER: Record<ArtworkStatus, number> = {
  PENDING_REVIEW: 0,
  PREVIEW: 1,
  IN_AUCTION: 2,
  SOLD: 3,
  REJECTED: 4,
};

function isReopenable(row: AdminRow): boolean {
  return row.auction?.status === 'CLOSED' && row.artwork.status !== 'REJECTED';
}

export default function AdminArtworksPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkEndAt, setBulkEndAt] = useState(() => reopenEndAfterDays(7));
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [bulkFailures, setBulkFailures] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const byStatus = await Promise.all(STATUSES.map((status) => fetchAllArtworksByStatus(status, signal)));
        const unique = new Map(byStatus.flat().map((artwork) => [artwork.id, artwork]));
        const artworks = [...unique.values()].sort(
          (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.id - a.id,
        );
        const loadedRows: AdminRow[] = [];
        for (let start = 0; start < artworks.length; start += 6) {
          const batch = artworks.slice(start, start + 6);
          loadedRows.push(...await Promise.all(batch.map((artwork) => fetchAdminRow(artwork, signal))));
        }
        if (!signal.aborted) setRows(loadedRows);
      } catch (cause) {
        if (signal.aborted) return;
        setError(errorMessage(cause, '작품 목록을 불러오지 못했습니다.'));
        controller.abort();
        setLoading(false);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [loadAttempt]);

  const updateRow = (artworkId: number, next: AdminRow) => {
    setRows((prev) => prev.map((row) => (row.artwork.id === artworkId ? next : row)));
    if (!isReopenable(next)) {
      setSelectedIds((prev) => {
        const remaining = new Set(prev);
        remaining.delete(artworkId);
        return remaining;
      });
    }
  };

  const reopenableRows = rows.filter(isReopenable);
  const selectedRows = reopenableRows.filter((row) => selectedIds.has(row.artwork.id));
  const allSelected = reopenableRows.length > 0 && selectedRows.length === reopenableRows.length;

  const toggleOne = (artworkId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(artworkId)) next.add(artworkId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(reopenableRows.map((row) => row.artwork.id)));
  };

  // 한 건이 실패해도 나머지는 계속 연다. 결제가 끝난 작품 등은 서버가 거절하고 실패 목록에 남는다.
  const handleBulkReopen = async () => {
    setBulkResult(null);
    setBulkFailures([]);
    if (reopenDurationMinutes(bulkEndAt) === null) {
      setBulkResult(REOPEN_END_ERROR);
      return;
    }
    const confirmed = window.confirm(
      `${selectedRows.length}개 작품을 다시 엽니다. 미결제 낙찰은 무효가 됩니다. 계속할까요?`,
    );
    if (!confirmed) return;

    setBulkBusy(true);
    const failures: string[] = [];
    let opened = 0;
    for (const row of selectedRows) {
      const minutes = reopenDurationMinutes(bulkEndAt);
      if (!row.auction || minutes === null) continue;
      try {
        const created = await reopenAuction(row.auction.id, minutes);
        updateRow(row.artwork.id, {
          artwork: { ...row.artwork, status: 'IN_AUCTION', auctionId: created.id },
          auctionStatus: 'loaded',
          auction: created,
        });
        opened += 1;
      } catch (cause) {
        failures.push(`${row.artwork.title}: ${errorMessage(cause, '다시 열지 못했습니다.')}`);
      }
    }
    setBulkBusy(false);
    setBulkResult(`${opened}개를 다시 열었습니다.${failures.length ? ` ${failures.length}개는 실패했습니다.` : ''}`);
    setBulkFailures(failures);
  };

  return (
    <div>
      <h1 className="text-[24px] font-extrabold tracking-[-0.04em]">경매 상태 관리</h1>
      <p className="mt-2 text-[13px] leading-6 text-[#73756f]">
        작품을 승인/반려하고, 경매를 생성하거나 상태를 직접 바꿀 수 있습니다.
      </p>

      {loading && <p className="mt-6 text-[13px] text-[#73756f]">불러오는 중...</p>}
      {error && (
        <div className="mt-6">
          <p role="alert" className="text-[13px] text-[#c13b32]">
            {error}
          </p>
          <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)} className="mt-2 text-[13px] font-bold underline">
            다시 불러오기
          </button>
        </div>
      )}

      {!loading && !error && (reopenableRows.length > 0 || bulkResult) && (
        <section aria-label="마감된 작품 일괄 다시 열기" className="mt-6 space-y-3 rounded-[14px] bg-[#f7f8f4] p-4">
          {reopenableRows.length > 0 && (
            <>
              <label className="flex items-center gap-2 text-[13px] font-bold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={bulkBusy}
                  onChange={toggleAll}
                  className="h-4 w-4"
                />
                마감된 작품 전체 선택 ({selectedRows.length}/{reopenableRows.length})
              </label>
              <ReopenEndPicker value={bulkEndAt} onChange={setBulkEndAt} disabled={bulkBusy} />
              <button
                type="button"
                disabled={bulkBusy || selectedRows.length === 0}
                onClick={handleBulkReopen}
                className="h-10 w-full rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
              >
                {bulkBusy ? '여는 중...' : `선택한 ${selectedRows.length}개 다시 열기`}
              </button>
            </>
          )}
          {bulkResult && (
            <p role="status" className="text-[12px] font-semibold">
              {bulkResult}
            </p>
          )}
          {bulkFailures.length > 0 && (
            <ul className="space-y-1 text-[12px] text-[#c13b32]">
              {bulkFailures.map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-3">
          {rows.length === 0 && <p className="text-[13px] text-[#73756f]">등록된 작품이 없습니다.</p>}
          {rows.map((row) => (
            <AdminArtworkRow
              key={`${row.artwork.id}-${row.artwork.auctionId ?? 'none'}`}
              row={row}
              onChange={(next) => updateRow(row.artwork.id, next)}
              selected={selectedIds.has(row.artwork.id)}
              onToggleSelect={isReopenable(row) ? () => toggleOne(row.artwork.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
