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

export interface SellerProfile {
  id: number;
  memberId: number;
  shopName: string;
  introduction: string | null;
  profileImageUrl: string | null;
}

export interface SellerProfileRegisterRequest {
  shopName: string;
  introduction: string;
  profileImageUrl: string;
}

export type SellerProfileUpdateRequest = Partial<SellerProfileRegisterRequest>;

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
  images: string[];
  bidCount: number;
  viewerCount: number;
  isMock?: boolean;
}

// ---------------------------------------------------------------------
// 로그인 API(POST /api/auth/login)의 응답 모양
// 백엔드 LoginResponse.java 레코드와 필드 이름이 똑같아야 JSON이 그대로 들어옴
// ---------------------------------------------------------------------
export interface LoginResponse {
  // JWT 토큰. 이후 요청마다 "Authorization: Bearer <토큰>" 헤더로 보내면
  // 백엔드 JwtAuthenticationFilter가 이걸 읽어서 "누가 보낸 요청인지" 알아냄
  // 유효기간은 기본 1시간 (백엔드 app.jwt.validity-ms 설정)
  accessToken: string;
  // 로그인한 회원의 번호. 이름은 응답에 없어서 이 번호로 회원 정보를 따로 조회해야 함
  memberId: number;
}

// ---------------------------------------------------------------------
// 작가(Artist) 관련 타입 — GET/POST /api/artists
// ---------------------------------------------------------------------
export interface Artist {
  id: number;
  name: string;
  biography: string | null;
  birthYear: number | null;
  nationality: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistPageResponse {
  content: Artist[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ArtistCreateRequest {
  name: string;
  biography: string;
  birthYear: number | null;
  nationality: string;
  profileImageUrl: string;
}

// ---------------------------------------------------------------------
// 작품 등록 요청 — POST /api/artworks
// 백엔드 ArtworkCreateRequest.java 레코드와 필드명이 똑같아야 한다.
// consignorId는 로그인한 판매자 본인의 memberId를 그대로 보낸다
// (백엔드에 아직 인증 검증이 안 붙어 있음 — 이슈 #33, 프론트에서는 임의 입력을 받지 않고 항상 본인 id만 보냄)
// ---------------------------------------------------------------------
export interface ArtworkCreateRequest {
  consignorId: number;
  artistId: number;
  title: string;
  description: string;
  category: ArtworkCategory;
  medium: string;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  productionYear: number | null;
  startPrice: number;
  estimatedPrice: number | null;
  certificateUrl: string;
  imageUrl: string;
}
