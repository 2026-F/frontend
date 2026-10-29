'use client';

// 어드민용 "경매 상태 관리" 화면.
// 1) 작품 승인/반려 (PENDING_REVIEW -> PREVIEW/REJECTED)
// 2) 승인된 작품(PREVIEW)에 경매 생성 (시작가 / 프리뷰 기간 / 마감시간)
// 3) 이미 만들어진 경매의 상태를 직접 바꾸기 (SCHEDULED/PREVIEW/ONGOING/EXTENDED/CLOSED)
//
// 참고: 지금 백엔드에는 PREVIEW 경매를 시간에 맞춰 자동으로 ONGOING으로 바꿔주는 기능이
// 없어서, 3번에서 상태를 직접 ONGOING으로 바꿔줘야 실제로 입찰이 가능해진다.
import { useEffect, useState } from 'react';
import AdminArtworkRow from '@/components/AdminArtworkRow';
import { errorMessage, fetchArtworks, fetchAuction } from '@/lib/api';
import type { Artwork, ArtworkStatus, Auction } from '@/types';

export type AdminRow = { artwork: Artwork; auction: Auction | null };

const STATUSES: ArtworkStatus[] = ['PENDING_REVIEW', 'PREVIEW', 'IN_AUCTION', 'SOLD', 'REJECTED'];
// 목록에서 더 신경써야 할 상태(심사 대기 등)가 위로 오도록 정렬 순서를 정해둔다.
const STATUS_ORDER: Record<ArtworkStatus, number> = {
  PENDING_REVIEW: 0,
  PREVIEW: 1,
  IN_AUCTION: 2,
  SOLD: 3,
  REJECTED: 4,
};

export default function AdminArtworksPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /api/artworks는 status 파라미터를 하나만 받을 수 있어서,
      // 보고 싶은 상태 5개를 각각 호출한 뒤 하나로 합친다.
      const byStatus = await Promise.all(STATUSES.map((status) => fetchArtworks({ status, size: 100 })));
      const artworks = byStatus.flat();

      const withAuctions = await Promise.all(
        artworks.map(async (artwork): Promise<AdminRow> => {
          if (!artwork.auctionId) return { artwork, auction: null };
          try {
            const auction = await fetchAuction(artwork.auctionId);
            return { artwork, auction };
          } catch {
            return { artwork, auction: null };
          }
        }),
      );

      withAuctions.sort((a, b) => {
        const order = STATUS_ORDER[a.artwork.status] - STATUS_ORDER[b.artwork.status];
        return order !== 0 ? order : b.artwork.id - a.artwork.id;
      });
      setRows(withAuctions);
    } catch (cause) {
      setError(errorMessage(cause, '작품 목록을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (artworkId: number, next: AdminRow) => {
    setRows((prev) => prev.map((row) => (row.artwork.id === artworkId ? next : row)));
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
          <button type="button" onClick={load} className="mt-2 text-[13px] font-bold underline">
            다시 불러오기
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-3">
          {rows.length === 0 && <p className="text-[13px] text-[#73756f]">등록된 작품이 없습니다.</p>}
          {rows.map((row) => (
            <AdminArtworkRow
              key={row.artwork.id}
              artwork={row.artwork}
              auction={row.auction}
              onChange={(next) => updateRow(row.artwork.id, next)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
