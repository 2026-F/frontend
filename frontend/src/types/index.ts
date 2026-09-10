// ERD 기준으로 잡은 기본 타입입니다. 백엔드 응답 스펙(DTO)이 확정되면 그에 맞춰 조정하세요.

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface Artwork {
  id: string;
  consignorId: string;
  artistId: string;
  title: string;
  category: string;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  status: string;
}

export interface AuctionEvent {
  id: string;
  type: string;
  title: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: string;
}

export interface AuctionLot {
  id: string;
  auctionEventId: string;
  artworkId: string;
  lotNumber: number;
  startPrice: number;
  currentPrice: number;
  biddingStartAt: string;
  biddingEndAt: string;
  status: string;
}

export interface Bid {
  id: string;
  auctionLotId: string;
  bidderId: string;
  amount: number;
  status: string;
  createdAt: string;
}
