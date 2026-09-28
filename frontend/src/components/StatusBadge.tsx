import type { ArtworkStatus, AuctionStatus } from "@/types";

const AUCTION_STYLES: Record<AuctionStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "예정", className: "bg-ink-600 text-ink-100" },
  PREVIEW: { label: "프리뷰", className: "bg-ink-600 text-cream" },
  ONGOING: { label: "경매 진행중", className: "bg-accent text-white" },
  EXTENDED: { label: "연장", className: "bg-red-500 text-white" },
  CLOSED: { label: "마감", className: "bg-ink-700 text-ink-300" },
};

const ARTWORK_STYLES: Record<ArtworkStatus, { label: string; className: string }> = {
  PENDING_REVIEW: { label: "심사중", className: "bg-ink-600 text-ink-100" },
  PREVIEW: { label: "프리뷰", className: "bg-ink-600 text-cream" },
  IN_AUCTION: { label: "경매 진행중", className: "bg-accent text-white" },
  SOLD: { label: "낙찰", className: "bg-ink-700 text-ink-300" },
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
