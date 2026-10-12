import Link from "next/link";
import type { Lot } from "@/types";
import { formatWon } from "@/lib/format";
import { AuctionStatusBadge } from "@/components/StatusBadge";
import CountdownTimer from "@/components/CountdownTimer";

export default function AuctionCard({ lot }: { lot: Lot }) {
  const { artwork, auction } = lot;
  const isClosed = auction.status === "CLOSED";
  const showCountdown = auction.status === "ONGOING" || auction.status === "EXTENDED";
  const priceLabel = isClosed ? "낙찰가" : "현재가";

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="card-surface group flex flex-col overflow-hidden transition active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f3f3f3]">
        <img src={artwork.imageUrl ?? lot.images[0]} alt={artwork.title} className="h-full w-full object-cover" />
        <div className="absolute left-2 top-2">
          <AuctionStatusBadge status={auction.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#555651]">{lot.category}</p>
        <h3 className="line-clamp-1 font-display text-sm font-bold leading-snug text-[#171717]">{artwork.title}</h3>
        <p className="truncate text-xs text-[#555651]">{lot.artistName}</p>

        <div className="mt-auto flex flex-col gap-1 pt-2">
          <div>
            <p className="text-[10px] text-[#555651]">{priceLabel}</p>
            <p className="font-display text-sm font-extrabold text-[#171717]">{formatWon(auction.currentPrice)}</p>
          </div>
          {showCountdown && (
            <CountdownTimer target={auction.auctionEndAt} extended={auction.status === "EXTENDED"} className="text-[11px]" />
          )}
        </div>
      </div>
    </Link>
  );
}
