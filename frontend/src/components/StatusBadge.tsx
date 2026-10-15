import type { ArtworkStatus, AuctionStatus } from "@/types";

const AUCTION_STYLES: Record<AuctionStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "예정", className: "bg-[#b8f53d] text-[#171717]" },
  PREVIEW: { label: "프리뷰", className: "bg-[#b8f53d] text-[#171717]" },
  ONGOING: { label: "진행중", className: "bg-[#ff453e] text-white" },
  EXTENDED: { label: "진행중", className: "bg-[#ff453e] text-white" },
  CLOSED: { label: "마감", className: "bg-[#e8e9e4] text-[#73756f]" },
};

const ARTWORK_STYLES: Record<ArtworkStatus, { label: string; className: string }> = {
  PENDING_REVIEW: { label: "심사중", className: "bg-[#e8e9e4] text-[#454641]" },
  PREVIEW: { label: "프리뷰", className: "bg-[#b8f53d] text-[#171717]" },
  IN_AUCTION: { label: "진행중", className: "bg-[#ff453e] text-white" },
  SOLD: { label: "낙찰", className: "bg-[#e8e9e4] text-[#73756f]" },
  REJECTED: { label: "반려", className: "bg-red-900 text-red-200" },
};

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  const style = AUCTION_STYLES[status];
  return <span className={`badge ${style.className}`}>{style.label}</span>;
}

export function ArtworkStatusBadge({ status }: { status: ArtworkStatus }) {
  const style = ARTWORK_STYLES[status];
  return <span className={`badge ${style.className}`}>{style.label}</span>;
}
