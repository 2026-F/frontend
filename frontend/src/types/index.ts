// 백엔드 엔티티(JSON 직렬화) 기준 타입입니다. 실제 응답 DTO가 따로 생기면 그에 맞춰 조정하세요.

export type ArtworkStatus = "PENDING_REVIEW" | "PREVIEW" | "IN_AUCTION" | "SOLD" | "REJECTED";

export interface Artwork {
  id: number;
  consignorId: number | null;
  title: string;
  startPrice: number;
  estimatedPrice: number;
  certificateUrl: string | null;
  imageUrl: string | null;
  status: ArtworkStatus;
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

export interface Livestream {
  id: number;
  auctionId: number;
  ivsChannelArn: string | null;
  streamKey: string | null;
  ingestEndpoint: string | null;
  playbackUrl: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED";
}

export interface ArtworkMedia {
  id: number;
  artworkId: number;
  mediaType: "PHOTO" | "VIDEO" | "MODEL_3D";
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
