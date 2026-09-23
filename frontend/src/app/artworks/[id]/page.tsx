import Link from "next/link";
import { notFound } from "next/navigation";
import { getLot } from "@/lib/lots";
import { formatDateTime, formatWon } from "@/lib/format";
import { ArtworkStatusBadge } from "@/components/StatusBadge";

export default async function ArtworkDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const lot = await getLot(id);
  if (!lot) notFound();

  const { artwork, auction } = lot;

  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-3">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
          <img
            src={lot.images[0] ?? artwork.imageUrl ?? ""}
            alt={artwork.title}
            className="h-full w-full object-cover"
          />
        </div>
        {lot.images.length > 1 && (
          <div className="flex gap-2">
            {lot.images.slice(1).map((src) => (
              <div key={src} className="h-16 w-16 overflow-hidden rounded-lg border border-ink-700">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <ArtworkStatusBadge status={artwork.status} />
          <h1 className="mt-2 font-display text-2xl font-semibold text-cream">{artwork.title}</h1>
          <p className="mt-1 text-sm text-ink-300">
            {lot.artistName} · {lot.category}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-ink-200">{lot.description}</p>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-ink-700 bg-ink-800/60 p-4">
          <div>
            <p className="text-[11px] text-ink-400">시작가</p>
            <p className="font-display text-base text-cream">{formatWon(artwork.startPrice)}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">추정가</p>
            <p className="font-display text-base text-cream">{formatWon(artwork.estimatedPrice)}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">프리뷰 기간</p>
            <p className="text-xs text-ink-200">
              {formatDateTime(auction.previewStart)} ~ {formatDateTime(auction.previewEnd)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-ink-400">경매 마감</p>
            <p className="text-xs text-ink-200">{formatDateTime(auction.auctionEndAt)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Link href={`/auctions/${auction.id}`} className="btn-primary w-full">
            실시간 입찰하러 가기
          </Link>
          <div className="flex gap-2">
            <Link href={`/artworks/${artwork.id}/viewer`} className="btn-outline flex-1">
              3D로 보기
            </Link>
            <Link href={`/auctions/${auction.id}/watch`} className="btn-outline flex-1">
              라이브 시청
            </Link>
          </div>
        </div>

        {lot.isMock && (
          <p className="text-xs text-ink-500">
            * 백엔드에 작품 상세 조회 API가 아직 없어 목데이터로 채워진 화면입니다.
          </p>
        )}
      </div>
    </div>
  );
}
