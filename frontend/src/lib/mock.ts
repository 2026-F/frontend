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
  sourcePageUrl: string | null; // 가상 작품은 출처가 없어서 null
  category: ArtworkCategory;
  medium: string | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm?: number | null; // 조각·공예처럼 입체 작품만 씀
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

// ---------------------------------------------------------------------
// 아래는 목록을 풍성하게 보여주기 위한 "가상" 작품 35점입니다. (회화 5 · 사진 10 · 조각 10 · 공예 10)
// - 작가 이름·제목·가격·상태는 모두 지어낸 값이고, 실존 작가·작품과 관계없습니다.
// - 이미지(public/artworks/mock/)는 코드로 직접 생성한 그림/3D 렌더링이라 저작권 걱정이 없습니다.
// - 실제 데이터가 백엔드에 쌓이면 FICTIONAL_SEEDS를 통째로 지우면 됩니다.
// ---------------------------------------------------------------------

// 경매 진행 상황. 이 값 하나로 작품 상태·경매 상태·프리뷰/마감 시각을 한꺼번에 정합니다.
type MockStage = "ONGOING" | "PREVIEW" | "SCHEDULED" | "CLOSED";

type FictionalSeed = {
  id: number;
  artistName: string;
  title: string;
  image: string; // public/artworks/mock/ 안의 파일 이름
  category: ArtworkCategory;
  medium: string;
  size: [number, number] | [number, number, number]; // [가로, 세로] 또는 [가로, 높이, 깊이] (cm)
  year: number;
  stage: MockStage;
  startPrice: number;
  estimatedPrice: number;
  bids?: number; // 진행 중·낙찰 작품의 입찰 수
  endInDays?: number; // 진행 중 작품이 며칠 뒤 마감되는지
};

const FICTIONAL_SEEDS: FictionalSeed[] = [
  // 회화 5
  { id: 7, artistName: "한서윤", title: "붉은 정원의 오후", image: "paint-colorfield.jpg", category: "PAINTING", medium: "캔버스에 유채", size: [80, 100], year: 2024, stage: "ONGOING", startPrice: 1_200_000, estimatedPrice: 2_500_000, bids: 6, endInDays: 3 },
  { id: 8, artistName: "박도현", title: "파동 No.7", image: "paint-dots.jpg", category: "PAINTING", medium: "캔버스에 아크릴", size: [72.7, 90.9], year: 2025, stage: "PREVIEW", startPrice: 800_000, estimatedPrice: 1_600_000 },
  { id: 9, artistName: "최윤슬", title: "구성 — 오후 세 시", image: "paint-geometric.jpg", category: "PAINTING", medium: "캔버스에 아크릴", size: [60, 75], year: 2023, stage: "ONGOING", startPrice: 650_000, estimatedPrice: 1_200_000, bids: 3, endInDays: 5 },
  { id: 10, artistName: "강민재", title: "엉킨 대화", image: "paint-gesture.jpg", category: "PAINTING", medium: "캔버스에 혼합 재료", size: [100, 125], year: 2025, stage: "SCHEDULED", startPrice: 1_500_000, estimatedPrice: 3_000_000 },
  { id: 11, artistName: "오하늘", title: "먼 산, 옅은 숨", image: "paint-ink.jpg", category: "PAINTING", medium: "한지에 수묵담채", size: [64, 80], year: 2024, stage: "CLOSED", startPrice: 900_000, estimatedPrice: 1_500_000, bids: 5 },

  // 사진 10
  { id: 12, artistName: "서지안", title: "해 질 녘의 수평선", image: "photo-sea-dusk.jpg", category: "PHOTOGRAPHY", medium: "아카이벌 피그먼트 프린트 (에디션 2/5)", size: [80, 100], year: 2025, stage: "ONGOING", startPrice: 450_000, estimatedPrice: 900_000, bids: 4, endInDays: 2 },
  { id: 13, artistName: "류태오", title: "안개의 층위 #3", image: "photo-misty-mountains.jpg", category: "PHOTOGRAPHY", medium: "아카이벌 피그먼트 프린트 (에디션 1/7)", size: [60, 75], year: 2024, stage: "PREVIEW", startPrice: 380_000, estimatedPrice: 700_000 },
  { id: 14, artistName: "문가을", title: "모래의 시간", image: "photo-dunes.jpg", category: "PHOTOGRAPHY", medium: "C-프린트 (에디션 3/5)", size: [80, 100], year: 2023, stage: "ONGOING", startPrice: 520_000, estimatedPrice: 1_000_000, bids: 7, endInDays: 4 },
  { id: 15, artistName: "윤채린", title: "도시의 잔광", image: "photo-city-bokeh.jpg", category: "PHOTOGRAPHY", medium: "아카이벌 피그먼트 프린트 (에디션 4/10)", size: [50, 62.5], year: 2025, stage: "SCHEDULED", startPrice: 300_000, estimatedPrice: 600_000 },
  { id: 16, artistName: "백승호", title: "겨울, 침묵", image: "photo-snow-trees.jpg", category: "PHOTOGRAPHY", medium: "젤라틴 실버 프린트 (에디션 2/5)", size: [60, 75], year: 2024, stage: "ONGOING", startPrice: 350_000, estimatedPrice: 650_000, bids: 2, endInDays: 6 },
  { id: 17, artistName: "신다온", title: "오후의 그림자", image: "photo-architecture.jpg", category: "PHOTOGRAPHY", medium: "아카이벌 피그먼트 프린트 (에디션 1/5)", size: [50, 62.5], year: 2025, stage: "PREVIEW", startPrice: 280_000, estimatedPrice: 500_000 },
  { id: 18, artistName: "장하람", title: "빛이 머무는 숲", image: "photo-forest-fog.jpg", category: "PHOTOGRAPHY", medium: "C-프린트 (에디션 5/7)", size: [80, 100], year: 2024, stage: "CLOSED", startPrice: 600_000, estimatedPrice: 1_100_000, bids: 9 },
  { id: 19, artistName: "권우진", title: "북쪽의 밤", image: "photo-aurora.jpg", category: "PHOTOGRAPHY", medium: "아카이벌 피그먼트 프린트 (에디션 1/3)", size: [100, 125], year: 2023, stage: "ONGOING", startPrice: 900_000, estimatedPrice: 1_800_000, bids: 5, endInDays: 1 },
  { id: 20, artistName: "남궁별", title: "호수에 비친 저녁", image: "photo-lake-reflection.jpg", category: "PHOTOGRAPHY", medium: "아카이벌 피그먼트 프린트 (에디션 2/10)", size: [60, 75], year: 2025, stage: "SCHEDULED", startPrice: 400_000, estimatedPrice: 750_000 },
  { id: 21, artistName: "홍예서", title: "비 오는 창가", image: "photo-rain-window.jpg", category: "PHOTOGRAPHY", medium: "아카이벌 피그먼트 프린트 (에디션 6/10)", size: [40, 50], year: 2025, stage: "PREVIEW", startPrice: 250_000, estimatedPrice: 450_000 },

  // 조각 10
  { id: 22, artistName: "김태린", title: "매듭", image: "sc-bronze-knot.jpg", category: "SCULPTURE", medium: "브론즈", size: [45, 48, 30], year: 2024, stage: "ONGOING", startPrice: 3_500_000, estimatedPrice: 6_000_000, bids: 4, endInDays: 5 },
  { id: 23, artistName: "이도윤", title: "균형의 탑", image: "sc-stacked-stones.jpg", category: "SCULPTURE", medium: "자연석", size: [30, 62, 26], year: 2025, stage: "PREVIEW", startPrice: 1_800_000, estimatedPrice: 3_000_000 },
  { id: 24, artistName: "정아름", title: "비틀린 기둥", image: "sc-marble-twist.jpg", category: "SCULPTURE", medium: "대리석", size: [22, 120, 22], year: 2023, stage: "SCHEDULED", startPrice: 4_200_000, estimatedPrice: 7_000_000 },
  { id: 25, artistName: "조현우", title: "반사하는 정원", image: "sc-steel-spheres.jpg", category: "SCULPTURE", medium: "스테인리스 스틸", size: [70, 40, 60], year: 2025, stage: "ONGOING", startPrice: 2_600_000, estimatedPrice: 4_500_000, bids: 3, endInDays: 3 },
  { id: 26, artistName: "배소율", title: "서 있는 사람", image: "sc-thin-figure.jpg", category: "SCULPTURE", medium: "브론즈", size: [14, 92, 12], year: 2024, stage: "CLOSED", startPrice: 2_200_000, estimatedPrice: 3_500_000, bids: 6 },
  { id: 27, artistName: "임재석", title: "붉은 아치", image: "sc-red-arc.jpg", category: "SCULPTURE", medium: "철에 우레탄 도장", size: [120, 60, 20], year: 2025, stage: "PREVIEW", startPrice: 3_000_000, estimatedPrice: 5_000_000 },
  { id: 28, artistName: "황보은", title: "쌓인 시간", image: "sc-wood-totem.jpg", category: "SCULPTURE", medium: "느티나무", size: [24, 95, 24], year: 2024, stage: "ONGOING", startPrice: 1_400_000, estimatedPrice: 2_400_000, bids: 2, endInDays: 6 },
  { id: 29, artistName: "송지후", title: "흰 물결", image: "sc-white-wave.jpg", category: "SCULPTURE", medium: "레진에 도장", size: [80, 55, 40], year: 2025, stage: "SCHEDULED", startPrice: 1_900_000, estimatedPrice: 3_200_000 },
  { id: 30, artistName: "차민서", title: "흩어진 정육면체", image: "sc-fragment-cube.jpg", category: "SCULPTURE", medium: "콘크리트", size: [50, 50, 50], year: 2023, stage: "PREVIEW", startPrice: 1_600_000, estimatedPrice: 2_800_000 },
  { id: 31, artistName: "유하진", title: "결정", image: "sc-glass-crystal.jpg", category: "SCULPTURE", medium: "캐스팅 유리", size: [35, 35, 35], year: 2025, stage: "ONGOING", startPrice: 2_000_000, estimatedPrice: 3_600_000, bids: 5, endInDays: 2 },

  // 공예 10
  { id: 32, artistName: "노은재", title: "백자 달항아리", image: "cr-moon-jar.jpg", category: "CRAFT", medium: "백자", size: [42, 44, 42], year: 2024, stage: "ONGOING", startPrice: 2_800_000, estimatedPrice: 5_000_000, bids: 8, endInDays: 4 },
  { id: 33, artistName: "구본결", title: "청자 매병", image: "cr-celadon.jpg", category: "CRAFT", medium: "청자", size: [30, 38, 30], year: 2025, stage: "PREVIEW", startPrice: 1_700_000, estimatedPrice: 3_000_000 },
  { id: 34, artistName: "탁서영", title: "분청 다완", image: "cr-buncheong-bowl.jpg", category: "CRAFT", medium: "분청사기", size: [14, 8, 14], year: 2025, stage: "ONGOING", startPrice: 350_000, estimatedPrice: 600_000, bids: 4, endInDays: 2 },
  { id: 35, artistName: "피윤호", title: "흑유 화병", image: "cr-black-vase.jpg", category: "CRAFT", medium: "흑유 도자", size: [12, 34, 12], year: 2024, stage: "SCHEDULED", startPrice: 420_000, estimatedPrice: 800_000 },
  { id: 36, artistName: "변다희", title: "느티나무 볼", image: "cr-wood-bowl.jpg", category: "CRAFT", medium: "느티나무에 옻칠", size: [36, 10, 36], year: 2025, stage: "PREVIEW", startPrice: 280_000, estimatedPrice: 500_000 },
  { id: 37, artistName: "마준서", title: "방짜 유기 한 쌍", image: "cr-brass-bowl.jpg", category: "CRAFT", medium: "방짜유기", size: [22, 8, 22], year: 2024, stage: "ONGOING", startPrice: 480_000, estimatedPrice: 900_000, bids: 3, endInDays: 5 },
  { id: 38, artistName: "석하윤", title: "푸른 숨", image: "cr-glass-vase.jpg", category: "CRAFT", medium: "블로잉 유리", size: [14, 30, 14], year: 2025, stage: "CLOSED", startPrice: 380_000, estimatedPrice: 650_000, bids: 5 },
  { id: 39, artistName: "양지석", title: "나전 함", image: "cr-lacquer-box.jpg", category: "CRAFT", medium: "나전칠기", size: [30, 11, 21], year: 2023, stage: "ONGOING", startPrice: 1_300_000, estimatedPrice: 2_200_000, bids: 2, endInDays: 3 },
  { id: 40, artistName: "연보람", title: "짚 바구니", image: "cr-basket.jpg", category: "CRAFT", medium: "볏짚", size: [30, 22, 30], year: 2025, stage: "SCHEDULED", startPrice: 180_000, estimatedPrice: 320_000 },
  { id: 41, artistName: "도채운", title: "세 개의 잔", image: "cr-terracotta-cups.jpg", category: "CRAFT", medium: "테라코타 (3점 1조)", size: [9, 7, 9], year: 2025, stage: "PREVIEW", startPrice: 150_000, estimatedPrice: 280_000 },
];

// 시작가에 맞춰 호가 단위를 정함 (100만 원 미만 5만, 500만 원 미만 10만, 그 이상 20만)
const bidUnitFor = (price: number) => (price < 1_000_000 ? 50_000 : price < 5_000_000 ? 100_000 : 200_000);

// 간단한 씨앗 데이터(FictionalSeed)를 기존 화면이 쓰는 MockRecord 모양으로 펼쳐줌
function toRecord(seed: FictionalSeed): MockRecord {
  const minBidUnit = bidUnitFor(seed.startPrice);
  const bids = seed.bids ?? 0;
  const [widthCm, heightCm, depthCm = null] = seed.size;

  // 단계별로 상태값과 시각을 정함 (기존 6개 작품의 규칙과 동일)
  const stage = {
    ONGOING: { artworkStatus: "IN_AUCTION", auctionStatus: "ONGOING", previewStart: at(-3 * DAY), previewEnd: at(-DAY), auctionEndAt: at((seed.endInDays ?? 3) * DAY) },
    PREVIEW: { artworkStatus: "PREVIEW", auctionStatus: "PREVIEW", previewStart: at(-DAY), previewEnd: at(DAY), auctionEndAt: at(8 * DAY) },
    SCHEDULED: { artworkStatus: "PREVIEW", auctionStatus: "SCHEDULED", previewStart: at(2 * DAY), previewEnd: at(4 * DAY), auctionEndAt: at(11 * DAY) },
    CLOSED: { artworkStatus: "SOLD", auctionStatus: "CLOSED", previewStart: at(-9 * DAY), previewEnd: at(-7 * DAY), auctionEndAt: at(-DAY) },
  }[seed.stage] as Pick<MockRecord, "artworkStatus" | "auctionStatus" | "previewStart" | "previewEnd" | "auctionEndAt">;

  return {
    id: seed.id,
    saleType: "WEEKLY",
    artistName: seed.artistName,
    title: seed.title,
    imageUrl: `/artworks/mock/${seed.image}`,
    sourcePageUrl: null,
    category: seed.category,
    medium: seed.medium,
    widthCm,
    heightCm,
    depthCm,
    productionYear: seed.year,
    ...stage,
    startPrice: seed.startPrice,
    estimatedPrice: seed.estimatedPrice,
    currentPrice: seed.startPrice + bids * minBidUnit, // 입찰 1번마다 호가 단위만큼 올랐다고 가정
    minBidUnit,
    bidCount: bids,
    viewerCount: seed.stage === "ONGOING" ? 8 + bids * 5 : 0,
  };
}

// 실제 작품 6점 + 가상 작품 35점. 아래 목록/상세 데이터는 모두 이 배열에서 만들어짐
const ALL_RECORDS: MockRecord[] = [...RECORDS, ...FICTIONAL_SEEDS.map(toRecord)];

export const MOCK_ARTWORK_DETAILS: ArtworkDetail[] = ALL_RECORDS.map((record) => ({
  id: record.id,
  consignorId: 100 + record.id,
  artist: { id: 200 + record.id, name: record.artistName, profileImageUrl: null },
  title: record.title,
  description: null,
  category: record.category,
  medium: record.medium,
  widthCm: record.widthCm,
  heightCm: record.heightCm,
  depthCm: record.depthCm ?? null,
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

export type MockLot = Lot & { saleType: MockSaleType; sourcePageUrl: string | null };

export const MOCK_LOTS: MockLot[] = ALL_RECORDS.map((record) => ({
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
