// 백엔드 엔티티(JSON 직렬화) 기준 타입입니다. 실제 응답 DTO가 따로 생기면 그에 맞춰 조정하세요.

export type ArtworkStatus = "PENDING_REVIEW" | "PREVIEW" | "IN_AUCTION" | "SOLD" | "REJECTED";

export type ArtworkCategory =
  | "PAINTING"
  | "DRAWING"
  | "PRINT"
  | "PHOTOGRAPHY"
  | "SCULPTURE"
  | "CRAFT"
  | "MIXED_MEDIA"
  | "DIGITAL"
  | "OTHER";

// GET /api/artworks 목록 항목 기준. consignorId·certificateUrl은 목록 응답에 없고 상세에만 있어 optional.
export interface Artwork {
  id: number;
  consignorId?: number | null;
  artistId?: number | null;
  artistName?: string | null;
  category?: ArtworkCategory | null;
  title: string;
  startPrice: number;
  estimatedPrice: number | null;
  certificateUrl?: string | null;
  imageUrl: string | null;
  status: ArtworkStatus;
  auctionId?: number | null;
}

export interface ArtworkDetailArtist {
  id: number;
  name: string;
  profileImageUrl: string | null;
}

export interface ArtworkDetailMedia {
  id: number;
  mediaType: MediaType;
  url: string | null;
  sourceUrl: string | null;
  sortOrder: number;
}

export interface ArtworkDetail {
  id: number;
  consignorId: number | null;
  artist: ArtworkDetailArtist | null;
  title: string;
  description: string | null;
  category: ArtworkCategory | null;
  medium: string | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  productionYear: number | null;
  startPrice: number;
  estimatedPrice: number | null;
  certificateUrl: string | null;
  imageUrl: string | null;
  status: ArtworkStatus;
  media: ArtworkDetailMedia[];
  createdAt: string;
  updatedAt: string;
}

// 목록 API 공통 페이지 응답
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type AuctionStatus = "SCHEDULED" | "PREVIEW" | "ONGOING" | "EXTENDED" | "CLOSED";

export interface Auction {
  id: number;
  artworkId: number;
  startPrice: number;
  currentPrice: number;
  minBidUnit: number;
  previewStart: string;
  previewEnd: string;
  auctionEndAt: string;
  status: AuctionStatus;
}

export interface Bid {
  id: number;
  auctionId: number;
  bidderId: number;
  price: number;
  createdAt: string;
}

export interface BidResult {
  currentPrice: number;
  auctionEndAt: string;
  extended: boolean;
}

export interface Member {
  id: number;
  email: string;
  name: string;
  role: "CONSIGNOR" | "BIDDER" | "ADMIN";
}

// GET/POST /api/auctions/{auctionId}/stream 응답. AWS IVS Real-Time(스테이지) 기준이라
// RTMP/HLS 시절의 streamKey·ingestEndpoint·playbackUrl은 없다 — stageArn은 AWS 계정 정보가
// 담긴 내부 식별자라 응답에서도 빠진다. 대신 스테이지 참여는 StageToken으로 한다.
export interface Livestream {
  id: number;
  auctionId: number;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  startedAt: string | null;
  endedAt: string | null;
}

// POST /api/auctions/{auctionId}/stream/tokens 응답.
// role이 PUBLISH면 위탁자 본인(송출), SUBSCRIBE면 그 외(시청, 비로그인 포함)다.
export interface StageToken {
  token: string;
  role: "PUBLISH" | "SUBSCRIBE";
  expiresAt: string;
}

export type MediaType = "PHOTO" | "VIDEO" | "MODEL_3D";

// POST /api/artworks/{artworkId}/media/presigned-url 응답
export interface PresignedUploadResponse {
  uploadUrl: string;
  objectKey: string;
  mediaType: MediaType;
}

export interface ArtworkMedia {
  id: number;
  artworkId: number;
  mediaType: MediaType;
  url: string | null;
  sourceUrl: string | null;
  sortOrder: number;
}

export interface Settlement {
  id: number;
  auctionId: number;
  winnerId: number;
  finalPrice: number;
  premiumFee: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
}

// ---------------------------------------------------------------------
// 아래는 백엔드에 아직 없는 화면(경매 목록 등)을 채우기 위한 프런트 전용 뷰 모델입니다.
// 실제 목록/상세 API가 생기면 이 타입은 지우고 위 백엔드 타입만으로 화면을 구성하면 됩니다.
// ---------------------------------------------------------------------

export interface Lot {
  artwork: Artwork;
  auction: Auction;
  artistName: string;
  category: string;
  description: string;
  images: string[];
  bidCount: number;
  viewerCount: number;
  isMock?: boolean;
}
