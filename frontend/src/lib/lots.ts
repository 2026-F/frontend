import { fetchArtworks, fetchAuction } from "@/lib/api";
import { MOCK_WEEKLY_LOTS, getMockLot } from "@/lib/mock";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Auction, Lot } from "@/types";

function synthesizeAuction(artworkId: number, startPrice: number): Auction {
  const nowDate = new Date();
  return {
    id: artworkId,
    artworkId,
    startPrice,
    currentPrice: startPrice,
    minBidUnit: Math.max(10_000, Math.round(startPrice * 0.02)),
    previewStart: new Date(nowDate.getTime() - 60 * 1000).toISOString(),
    previewEnd: new Date(nowDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    auctionEndAt: new Date(nowDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: "PREVIEW",
  };
}

/**
 * 화면에 뿌릴 경매(Lot) 목록을 만듭니다.
 * 1) 백엔드 GET /api/artworks가 데이터를 주면: 각 작품에 대해 실제 현재가(GET
 *    /api/auctions/{id}/current-price)도 시도하고, 화면에만 필요한 부가 정보
 *    (작가명/카테고리/이미지 등)는 mock에서 id가 겹치면 가져다 씁니다.
 * 2) 백엔드가 비어있거나 응답하지 않으면: 위클리 목데이터만 목록에 표시합니다.
 */
export async function getLots(): Promise<Lot[]> {
  try {
    const artworks = await fetchArtworks();
    if (!artworks || artworks.length === 0) {
      return MOCK_WEEKLY_LOTS;
    }

    const weeklyArtworks = artworks.filter((artwork) => {
      const mock = getMockLot(artwork.id);
      return !(mock?.artwork.title === artwork.title && mock.saleType === "LIVE");
    });

    const lots = await Promise.all(
      weeklyArtworks.map(async (artwork): Promise<Lot> => {
        const candidate = getMockLot(artwork.id);
        const mockMatch = candidate?.artwork.title === artwork.title ? candidate : undefined;
        let auction: Auction;
        try {
          if (!artwork.auctionId) {
                throw new Error("경매 없음");
          }
          auction = await fetchAuction(artwork.auctionId);
        } catch {
          auction = mockMatch?.auction ?? synthesizeAuction(artwork.id, artwork.startPrice);
        }

        return {
          artwork,
          auction,
          artistName: artwork.artistName ?? mockMatch?.artistName ?? "작가 미상",
          category: mockMatch?.category ?? (artwork.category ? CATEGORY_LABELS[artwork.category] : "기타"),
          images: mockMatch?.images ?? (artwork.imageUrl ? [artwork.imageUrl] : []),
          bidCount: mockMatch?.bidCount ?? 0,
          viewerCount: mockMatch?.viewerCount ?? 0,
          isMock: false,
        };
      }),
    );

    return lots;
  } catch {
    return MOCK_WEEKLY_LOTS;
  }
}

export async function getLot(id: number): Promise<Lot | undefined> {
  const lots = await getLots();
  return lots.find((lot) => lot.artwork.id === id) ?? getMockLot(id);
}
