import { fetchArtworks, fetchAuction } from "@/lib/api";
import { MOCK_LOTS, getMockLot } from "@/lib/mock";
import type { Auction, Lot } from "@/types";

function synthesizeAuction(artworkId: number, startPrice: number): Auction {
  const nowDate = new Date();
  return {
    id: artworkId,
    artworkId,
    startPrice,
    currentPrice: startPrice,
    minBidUnit: Math.max(10_000, Math.round(startPrice * 0.02)),
    previewStart: nowDate.toISOString(),
    previewEnd: nowDate.toISOString(),
    auctionEndAt: new Date(nowDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    status: "PREVIEW",
  };
}

/**
 * 화면에 뿌릴 경매(Lot) 목록을 만듭니다.
 * 1) 백엔드 GET /api/artworks가 데이터를 주면: 각 작품에 대해 실제 현재가(GET
 *    /api/auctions/{id}/current-price)도 시도하고, 화면에만 필요한 부가 정보
 *    (작가명/카테고리/설명/이미지 등)는 mock에서 id가 겹치면 가져다 씁니다.
 * 2) 백엔드가 비어있거나 응답하지 않으면: MOCK_LOTS로 화면을 완성합니다.
 */
export async function getLots(): Promise<Lot[]> {
  try {
    const artworks = await fetchArtworks();
    if (!artworks || artworks.length === 0) {
      return MOCK_LOTS;
    }

    const lots = await Promise.all(
      artworks.map(async (artwork): Promise<Lot> => {
        const mockMatch = getMockLot(artwork.id);
        let auction: Auction;
        try {
          auction = await fetchAuction(artwork.id);
        } catch {
          auction = mockMatch?.auction ?? synthesizeAuction(artwork.id, artwork.startPrice);
        }

        return {
          artwork,
          auction,
          artistName: mockMatch?.artistName ?? "작가 미상",
          category: mockMatch?.category ?? "작품 정보 준비중",
          description: mockMatch?.description ?? "작품 설명이 아직 등록되지 않았습니다.",
          images: mockMatch?.images ?? (artwork.imageUrl ? [artwork.imageUrl] : []),
          bidCount: mockMatch?.bidCount ?? 0,
          viewerCount: mockMatch?.viewerCount ?? 0,
          isMock: false,
        };
      }),
    );

    return lots;
  } catch {
    return MOCK_LOTS;
  }
}

export async function getLot(id: number): Promise<Lot | undefined> {
  const lots = await getLots();
  return lots.find((lot) => lot.artwork.id === id) ?? getMockLot(id);
}
