import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLot } from '@/lib/lots';
import DataNotice from '@/components/DataNotice';
import ArtworkImage from '@/components/ArtworkImage';
import { isMissing, requestFailure } from '@/lib/requestFailure';
import BidPanel from '@/components/BidPanel';

export const dynamic = 'force-dynamic';

export default async function AuctionDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  let lot;
  try {
    lot = await getLot(id);
  } catch (error) {
    if (isMissing(error)) notFound();
    return (
      <div className="container-page">
        <DataNotice message={requestFailure(error)} />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#e8e9e4] bg-[#f7f8f4]">
        <ArtworkImage src={lot.artwork.imageUrl} alt={lot.artwork.title} />
      </div>

      <BidPanel lot={lot} />

      <div className="flex gap-2 border-t border-[#e8e9e4] pt-5">
        <Link
          href={`/artworks/${lot.artwork.id}?auctionId=${lot.auction.id}`}
          className="btn-outline flex-1"
        >
          작품 상세
        </Link>
        <Link href={`/artworks/${lot.artwork.id}/viewer`} className="btn-outline flex-1">
          3D
        </Link>
        <Link href={`/auctions/${lot.auction.id}/watch`} className="btn-outline flex-1">
          라이브
        </Link>
      </div>
    </div>
  );
}
