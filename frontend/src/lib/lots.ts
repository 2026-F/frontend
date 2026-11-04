import { fetchArtworkPage, fetchArtworkDetail, fetchAuction, type ArtworkQuery } from '@/lib/api';
import { CATEGORY_LABELS } from '@/lib/categories';
import { requestFailure } from '@/lib/requestFailure';
import type { Artwork, ArtworkDetail, Auction, CatalogItem, Lot, PageResponse } from '@/types';

function item(artwork: Artwork, auction: Auction | null): CatalogItem {
  return {
    artwork,
    auction,
    artistName: artwork.artistName ?? '작가 미상',
    category: artwork.category ? CATEGORY_LABELS[artwork.category] : '기타',
    images: artwork.imageUrl ? [artwork.imageUrl] : [],
    bidCount: 0,
    viewerCount: 0,
  };
}
export function summaryOf(detail: ArtworkDetail): Artwork {
  return { ...detail, artistId: detail.artist?.id, artistName: detail.artist?.name };
}
export async function getLots(params?: ArtworkQuery): Promise<PageResponse<CatalogItem>> {
  const page = await fetchArtworkPage(params);
  const content = await Promise.all(
    page.content.map(async (artwork) => {
      if (artwork.auctionId == null) return item(artwork, null);
      try {
        const auction = await fetchAuction(artwork.auctionId);
        if (auction.artworkId !== artwork.id) throw new Error('경매 연결 불일치');
        return item(artwork, auction);
      } catch (error) {
        return {
          ...item(artwork, null),
          auctionError: requestFailure(error, '경매 정보를 불러오지 못했습니다.'),
        };
      }
    }),
  );
  return { ...page, content };
}
/** URL의 ID는 작품 ID가 아니라 경매 ID다. 목록 페이지를 검색하지 않는다. */
export async function getLot(auctionId: number): Promise<Lot> {
  const auction = await fetchAuction(auctionId);
  const artwork = await fetchArtworkDetail(auction.artworkId);
  return { ...item(summaryOf(artwork), auction), auction };
}
