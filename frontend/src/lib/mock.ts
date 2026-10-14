import type { ArtworkCategory, ArtworkDetail, ArtworkStatus, AuctionStatus, Lot } from "@/types";
import { CATEGORY_LABELS } from "@/lib/categories";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const baseTime = Date.now();
const at = (offset: number) => new Date(baseTime + offset).toISOString();

export type MockSaleType = "WEEKLY" | "LIVE";

type MockRecord = {
  id: number;
  saleType: MockSaleType;
  artistName: string;
  title: string;
  imageUrl: string;
  sourcePageUrl: string;
  category: ArtworkCategory;
  medium: string | null;
  widthCm: number | null;
  heightCm: number | null;
  productionYear: number;
  artworkStatus: ArtworkStatus;
  auctionStatus: AuctionStatus;
  startPrice: number;
  estimatedPrice: number | null;
  currentPrice: number;
  minBidUnit: number;
  previewStart: string;
  previewEnd: string;
  auctionEndAt: string;
  bidCount: number;
  viewerCount: number;
};

// 작품명·작가·제작연도와 확인된 재료·크기는 출처를 따릅니다.
// 가격·입찰 수·시각·경매 상태와 라이브 편성은 화면 시연용 가상 값입니다.
// 여섯 작품 모두 평면 작품이므로 조각·공예·사진으로 임의 분류하지 않습니다.
// 혼합 재료를 사용한 평면 작품은 화면의 네 가지 분류 중 회화에 포함합니다.
const RECORDS: MockRecord[] = [
  {
    id: 1, saleType: "WEEKLY", artistName: "유제이", title: "파랑새",
    imageUrl: "/artworks/uj-bluebird-2025.jpg",
    sourcePageUrl: "https://www.opengallery.co.kr/artwork/A2827-0008/",
    category: "PAINTING", medium: "캔버스에 아크릴", widthCm: 73, heightCm: 61,
    productionYear: 2025,
    artworkStatus: "IN_AUCTION", auctionStatus: "ONGOING",
    startPrice: 400_000, estimatedPrice: 1_000_000, currentPrice: 600_000, minBidUnit: 50_000,
    previewStart: at(-3 * DAY), previewEnd: at(-DAY), auctionEndAt: at(6 * DAY),
    bidCount: 4, viewerCount: 28,
  },
  {
    id: 2, saleType: "WEEKLY", artistName: "이현영", title: "관조_바람소나타3",
    imageUrl: "/artworks/lee-hyunyoung-wind-sonata-3-2025.webp",
    sourcePageUrl: "https://www.seoulauction.com/auction/online/1060/43",
    category: "PAINTING", medium: null, widthCm: null, heightCm: null,
    productionYear: 2025,
    artworkStatus: "PREVIEW", auctionStatus: "PREVIEW",
    startPrice: 400_000, estimatedPrice: null, currentPrice: 400_000, minBidUnit: 50_000,
    previewStart: at(-DAY), previewEnd: at(DAY), auctionEndAt: at(8 * DAY),
    bidCount: 0, viewerCount: 12,
  },
  {
    id: 3, saleType: "WEEKLY", artistName: "정국영", title: "Chaotic Signal (The Rhythm of Life)",
    imageUrl: "/artworks/jeong-kookyoung-chaotic-signal-2024.webp",
    sourcePageUrl: "https://findartinfo.com/artwork/chaotic-signal-the-rhythm-of-life/B8C291CEF09047949DA0E925FE83227F",
    category: "PAINTING", medium: "캔버스에 한지 혼합 재료", widthCm: 60, heightCm: 60,
    productionYear: 2024,
    artworkStatus: "PREVIEW", auctionStatus: "SCHEDULED",
    startPrice: 900_000, estimatedPrice: 1_800_000, currentPrice: 900_000, minBidUnit: 100_000,
    previewStart: at(DAY), previewEnd: at(2 * DAY), auctionEndAt: at(9 * DAY),
    bidCount: 0, viewerCount: 0,
  },
  {
    id: 4, saleType: "LIVE", artistName: "임수영", title: "대박이의 화려한 외출-몽유대박도",
    imageUrl: "/artworks/lim-sooyoung-daebak-dream-2025.webp",
    sourcePageUrl: "https://findartinfo.com/artwork/daebaks-splendid-outing-dream-journey-of-daebak/F5AC7DC242974F10B07A3FB64973EE8A",
    category: "PAINTING", medium: "캔버스에 아크릴", widthCm: 40, heightCm: 40,
    productionYear: 2025,
    artworkStatus: "SOLD", auctionStatus: "CLOSED",
    startPrice: 1_200_000, estimatedPrice: 2_000_000, currentPrice: 1_500_000, minBidUnit: 100_000,
    previewStart: at(-2 * DAY), previewEnd: at(-DAY), auctionEndAt: at(-10 * MINUTE),
    bidCount: 3, viewerCount: 0,
  },
  {
    id: 5, saleType: "LIVE", artistName: "송유미", title: "인드라망 25-16",
    imageUrl: "/artworks/song-yumi-indras-net-25-16-2025.webp",
    sourcePageUrl: "https://findartinfo.com/artwork/indras-net-25-16/065972EA40404B2F96EC9F98FC69208A",
    category: "PAINTING", medium: "한지에 색연필과 아크릴", widthCm: 34.9, heightCm: 28.1,
    productionYear: 2025,
    artworkStatus: "IN_AUCTION", auctionStatus: "ONGOING",
    startPrice: 350_000, estimatedPrice: 800_000, currentPrice: 450_000, minBidUnit: 50_000,
    previewStart: at(-2 * DAY), previewEnd: at(-30 * MINUTE), auctionEndAt: at(10 * MINUTE),
    bidCount: 2, viewerCount: 128,
  },
  {
    id: 6, saleType: "LIVE", artistName: "전동민", title: "달빛 아래 한남동",
    imageUrl: "/artworks/jeon-dongmin-hannam-moonlight-2019.jpg",
    sourcePageUrl: "https://www.namdogallery.or.kr/nd/ndgallery/artistworks.html?awidx=5591",
    category: "PAINTING", medium: "한지에 채색", widthCm: 80, heightCm: 117,
    productionYear: 2019,
    artworkStatus: "PREVIEW", auctionStatus: "PREVIEW",
    startPrice: 700_000, estimatedPrice: 1_500_000, currentPrice: 700_000, minBidUnit: 50_000,
    previewStart: at(-2 * DAY), previewEnd: at(10 * MINUTE), auctionEndAt: at(25 * MINUTE),
    bidCount: 0, viewerCount: 0,
  },
];

export const MOCK_ARTWORK_DETAILS: ArtworkDetail[] = RECORDS.map((record) => ({
  id: record.id,
  consignorId: 100 + record.id,
  artist: { id: 200 + record.id, name: record.artistName, profileImageUrl: null },
  title: record.title,
  description: null,
  category: record.category,
  medium: record.medium,
  widthCm: record.widthCm,
  heightCm: record.heightCm,
  depthCm: null,
  productionYear: record.productionYear,
  startPrice: record.startPrice,
  estimatedPrice: record.estimatedPrice,
  certificateUrl: null,
  imageUrl: record.imageUrl,
  status: record.artworkStatus,
  media: [{ id: record.id, mediaType: "PHOTO", url: record.imageUrl, sourceUrl: null, sortOrder: 0 }],
  createdAt: at(-7 * DAY),
  updatedAt: at(-DAY),
}));

export type MockLot = Lot & { saleType: MockSaleType; sourcePageUrl: string };

export const MOCK_LOTS: MockLot[] = RECORDS.map((record) => ({
  artwork: {
    id: record.id,
    consignorId: 100 + record.id,
    artistId: 200 + record.id,
    artistName: record.artistName,
    category: record.category,
    title: record.title,
    startPrice: record.startPrice,
    estimatedPrice: record.estimatedPrice,
    certificateUrl: null,
    imageUrl: record.imageUrl,
    status: record.artworkStatus,
    auctionId: record.id,
  },
  auction: {
    id: record.id,
    artworkId: record.id,
    startPrice: record.startPrice,
    currentPrice: record.currentPrice,
    minBidUnit: record.minBidUnit,
    previewStart: record.previewStart,
    previewEnd: record.previewEnd,
    auctionEndAt: record.auctionEndAt,
    status: record.auctionStatus,
  },
  artistName: record.artistName,
  category: [CATEGORY_LABELS[record.category], record.medium].filter(Boolean).join(" · "),
  images: [record.imageUrl],
  bidCount: record.bidCount,
  viewerCount: record.viewerCount,
  isMock: true,
  saleType: record.saleType,
  sourcePageUrl: record.sourcePageUrl,
}));

export const MOCK_WEEKLY_LOTS = MOCK_LOTS.filter((lot) => lot.saleType === "WEEKLY");
export const MOCK_LIVE_LOTS = MOCK_LOTS.filter((lot) => lot.saleType === "LIVE");

// 방송 단위 모델은 아직 백엔드에 없습니다. 편성과 순서는 프런트 데모용입니다.
export const MOCK_LIVE_EVENT = {
  id: 1,
  title: "2026 가을 컬렉션",
  status: "LIVE" as const,
  startedAt: at(-15 * MINUTE),
  lotIds: [4, 5, 6],
  currentLotId: 5,
  viewerCount: 128,
};

export function getMockLot(id: number): MockLot | undefined {
  return MOCK_LOTS.find((lot) => lot.artwork.id === id);
}

export function getMockArtworkDetail(id: number): ArtworkDetail | undefined {
  return MOCK_ARTWORK_DETAILS.find((artwork) => artwork.id === id);
}
