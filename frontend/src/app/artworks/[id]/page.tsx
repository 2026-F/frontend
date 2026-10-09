import axios from "axios";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchArtworkDetail, fetchAuction } from "@/lib/api";
import { formatWon } from "@/lib/format";
import type { ArtworkDetail, Auction } from "@/types";

type ArtworkDetailPageProps = {
  params: { id: string };
  searchParams?: { auctionId?: string };
};

async function getAuctionContext(value: string | undefined, artworkId: number): Promise<Auction | null> {
  if (!value) return null;
  const auctionId = Number(value);
  if (!Number.isInteger(auctionId) || auctionId <= 0) return null;

  try {
    const auction = await fetchAuction(auctionId);
    return auction.artworkId === artworkId ? auction : null;
  } catch {
    return null;
  }
}

function dimensionsOf(artwork: ArtworkDetail) {
  const values = [artwork.widthCm, artwork.heightCm, artwork.depthCm].filter(
    (value): value is number => value !== null,
  );
  return values.length ? `${values.join(" × ")} cm` : null;
}

function auctionState(auction: Auction) {
  if (auction.status === "ONGOING" || auction.status === "EXTENDED") return "진행 중";
  if (auction.status === "CLOSED") return "종료";
  return "프리뷰";
}

export default async function ArtworkDetailPage({ params, searchParams }: ArtworkDetailPageProps) {
  const artworkId = Number(params.id);
  if (!Number.isInteger(artworkId) || artworkId <= 0) notFound();

  let artwork: ArtworkDetail;
  try {
    artwork = await fetchArtworkDetail(artworkId);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) notFound();
    throw error;
  }

  const auction = await getAuctionContext(searchParams?.auctionId, artwork.id);
  const photos = artwork.media
    .filter((item) => item.mediaType === "PHOTO" && item.url)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const videos = artwork.media
    .filter((item) => item.mediaType === "VIDEO")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const hasModel = artwork.media.some(
    (item) => item.mediaType === "MODEL_3D" && (item.url || item.sourceUrl),
  );
  const primaryImage = photos[0]?.url ?? artwork.imageUrl;
  const dimensions = dimensionsOf(artwork);
  const currentPrice = auction?.currentPrice ?? artwork.startPrice;
  const nextBid = auction ? auction.currentPrice + auction.minBidUnit : null;

  return (
    <div className="min-h-full bg-white text-[#111111]">
      <section className="px-4 pt-3">
        <div className="relative flex h-[225px] items-center justify-center overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,#def6e7_0%,#c9ebef_38%,#93afff_100%)]">
          {primaryImage ? (
            <img src={primaryImage} alt={artwork.title} className="h-full w-full object-cover" />
          ) : (
            <span className="sr-only">등록된 대표 이미지가 없습니다.</span>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#42433f] shadow-sm">
            {auction ? "경매 프리뷰" : "작품 프리뷰"}
          </span>
        </div>

        {photos.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {photos.slice(1).map((photo) => (
              <div key={photo.id} className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#e6e7e2]">
                <img src={photo.url!} alt={`${artwork.title} 추가 이미지`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 pb-5 pt-4">
        <p className="text-[10px] font-medium text-[#74756f]">{artwork.artist?.name ?? "작가 미상"}</p>
        <h2 className="mt-1 text-[20px] font-bold leading-tight tracking-[-0.04em]">{artwork.title}</h2>
        <p className="mt-1.5 text-[10px] text-[#858680]">
          {[artwork.medium, dimensions, artwork.productionYear].filter(Boolean).join(", ") || "작품 정보 준비 중"}
        </p>

        <div className="my-4 h-px bg-[#efefeb]" />

        <p className="text-[10px] font-medium text-[#74756f]">현재 경매가</p>
        <p className="mt-1 text-[25px] font-extrabold leading-none tracking-[-0.035em]">{formatWon(currentPrice)}</p>
        {nextBid && <p className="mt-2 text-[10px] font-semibold text-[#ff4e44]">다음 예상가 {formatWon(nextBid)}</p>}

        {auction && (
          <dl className="mt-4 space-y-2 rounded-[8px] bg-[#f6f7f2] px-4 py-3 text-[10px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#74756f]">추정가</dt>
              <dd className="font-semibold text-[#272824]">{formatWon(artwork.startPrice)} — {formatWon(artwork.estimatedPrice)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#74756f]">구매 수수료</dt>
              <dd className="font-semibold text-[#272824]">낙찰가의 10%</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#74756f]">상태</dt>
              <dd className="font-semibold text-[#272824]">{auctionState(auction)}</dd>
            </div>
          </dl>
        )}

        {auction && (
          <Link href={`/auctions/${auction.id}`} className="mt-4 flex h-12 w-full items-center justify-center rounded-[7px] bg-[#a8ff00] text-[13px] font-extrabold text-[#111111] transition active:scale-[0.99]">
            {formatWon(nextBid ?? currentPrice)} 입찰하기
          </Link>
        )}

        {(hasModel || videos.length > 0 || artwork.description || artwork.certificateUrl) && (
          <div className="mt-6 border-t border-[#efefeb] pt-5">
            <h3 className="text-[14px] font-bold">작품 상세</h3>
            {artwork.description && <p className="mt-2 whitespace-pre-line text-[12px] leading-5 text-[#666762]">{artwork.description}</p>}
            <div className="mt-4 flex gap-2">
              {hasModel && <Link href={`/artworks/${artwork.id}/viewer`} className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#dfe0da] text-[11px] font-semibold">3D로 보기</Link>}
              {artwork.certificateUrl && <a href={artwork.certificateUrl} target="_blank" rel="noreferrer" className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#dfe0da] text-[11px] font-semibold">보증서 확인</a>}
            </div>
            {videos.map((video) => video.url ? (
              <video key={video.id} controls playsInline className="mt-4 w-full rounded-lg bg-black"><source src={video.url} />브라우저에서 영상을 재생할 수 없습니다.</video>
            ) : (
              <p key={video.id} className="mt-3 rounded-lg bg-[#f6f7f2] p-3 text-[11px] text-[#74756f]">영상을 감상할 수 있도록 변환 중입니다.</p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
