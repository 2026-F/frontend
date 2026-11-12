import Link from 'next/link';
import type { CatalogItem } from '@/types';
import { formatWon } from '@/lib/format';
import { priceOf, itemHref } from '@/lib/catalogDisplay';
import { AuctionStatusBadge } from '@/components/StatusBadge';
import ArtworkImage from '@/components/ArtworkImage';
import CountdownTimer from '@/components/CountdownTimer';
import type { AuctionClock } from '@/lib/auctionClock';

export default function AuctionCard({ lot, clock }: { lot: CatalogItem; clock?: AuctionClock | null }) {
  const { artwork, auction } = lot;
  const price = priceOf(artwork, auction);
  return (
    <Link
      href={itemHref(lot)}
      className="card-surface group flex flex-col overflow-hidden transition active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#e8e9e4]">
        <ArtworkImage src={artwork.imageUrl} alt={artwork.title} />
        <div className="absolute left-2 top-2">
          {auction ? (
            <AuctionStatusBadge status={auction.status} />
          ) : (
            <span className="rounded bg-white/90 px-2 py-1 text-xs">
              {lot.auctionError ? '경매 조회 실패' : '작품 프리뷰'}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-[10px] font-semibold text-[#566e22]">{lot.category}</p>
        <h3 className="line-clamp-1 text-sm font-semibold">{artwork.title}</h3>
        <p className="truncate text-xs text-[#73756f]">{lot.artistName}</p>
        <div className="mt-auto pt-2">
          {lot.auctionError ? (
            <p className="text-xs text-[#73756f]">경매 정보 확인 필요</p>
          ) : (
            <>
              <p className="text-[10px] text-[#73756f]">{price.label}</p>
              <p className="text-sm font-semibold">{formatWon(price.value)}</p>
            </>
          )}
        </div>
        {auction && (auction.status === 'ONGOING' || auction.status === 'EXTENDED') && (
          <CountdownTimer
            target={auction.auctionEndAt}
            clock={clock}
            awaitingClose={clock !== undefined}
            extended={auction.status === 'EXTENDED'}
            className="text-xs"
          />
        )}
      </div>
    </Link>
  );
}
