import Link from "next/link";
import { notFound } from "next/navigation";
import { getLot } from "@/lib/lots";
import BidPanel from "@/components/BidPanel";

export default async function AuctionDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const lot = await getLot(id);
  if (!lot) notFound();

  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
        <img
          src={lot.images[0] ?? lot.artwork.imageUrl ?? ""}
          alt={lot.artwork.title}
          className="h-full w-full object-cover"
        />
      </div>

      <BidPanel lot={lot} />

      <div className="flex gap-2 border-t border-ink-700 pt-5">
        <Link href={`/artworks/${lot.artwork.id}?auctionId=${lot.auction.id}`} className="btn-outline flex-1">
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
