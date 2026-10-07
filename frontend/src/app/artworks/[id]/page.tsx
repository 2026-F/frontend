import axios from 'axios';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArtworkStatusBadge } from '@/components/StatusBadge';
import { fetchArtworkDetail, fetchAuction } from '@/lib/api';
import { formatDateTime, formatWon } from '@/lib/format';
import type { ArtworkCategory, ArtworkDetail, Auction } from '@/types';

const CATEGORY_LABELS: Record<ArtworkCategory, string> = {
  PAINTING: '회화',
  DRAWING: '드로잉',
  PRINT: '판화',
  PHOTOGRAPHY: '사진',
  SCULPTURE: '조각',
  CRAFT: '공예',
  MIXED_MEDIA: '혼합 매체',
  DIGITAL: '디지털',
  OTHER: '기타',
};

type ArtworkDetailPageProps = {
  params: { id: string };
  searchParams?: { auctionId?: string };
};

async function getAuctionContext(
  auctionIdValue: string | undefined,
  artworkId: number,
): Promise<Auction | null> {
  if (!auctionIdValue) return null;

  const auctionId = Number(auctionIdValue);
  if (!Number.isInteger(auctionId) || auctionId <= 0) return null;

  try {
    const auction = await fetchAuction(auctionId);
    return auction.artworkId === artworkId ? auction : null;
  } catch {
    return null;
  }
}

function formatDimensions(widthCm: number | null, heightCm: number | null, depthCm: number | null) {
  const values = [widthCm, heightCm, depthCm].filter((value): value is number => value !== null);
  return values.length > 0 ? `${values.join(' × ')} cm` : null;
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
    .filter((item) => item.mediaType === 'PHOTO' && item.url)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const videos = artwork.media
    .filter((item) => item.mediaType === 'VIDEO')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const hasModel = artwork.media.some(
    (item) => item.mediaType === 'MODEL_3D' && (item.url || item.sourceUrl),
  );
  const primaryImage = photos[0]?.url ?? artwork.imageUrl;
  const dimensions = formatDimensions(artwork.widthCm, artwork.heightCm, artwork.depthCm);
  const category = artwork.category ? CATEGORY_LABELS[artwork.category] : '분류 미정';

  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <section className="flex flex-col gap-3">
        <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
          {primaryImage ? (
            <img src={primaryImage} alt={artwork.title} className="h-full w-full object-cover" />
          ) : (
            <p className="text-sm text-ink-400">등록된 대표 이미지가 없습니다.</p>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.slice(1).map((photo) => (
              <div
                key={photo.id}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-700"
              >
                <img
                  src={photo.url!}
                  alt={`${artwork.title} 추가 이미지`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <ArtworkStatusBadge status={artwork.status} />
          <h1 className="mt-2 font-display text-2xl font-semibold text-cream">{artwork.title}</h1>
          <p className="mt-1 text-sm text-ink-300">
            {artwork.artist?.name ?? '작가 미상'} · {category}
          </p>
        </div>

        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-200">
          {artwork.description || '작품 설명이 아직 등록되지 않았습니다.'}
        </p>

        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-ink-700 bg-ink-800/60 p-4">
          <div>
            <dt className="text-[11px] text-ink-400">시작가</dt>
            <dd className="font-display text-base text-cream">{formatWon(artwork.startPrice)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-ink-400">추정가</dt>
            <dd className="font-display text-base text-cream">
              {formatWon(artwork.estimatedPrice)}
            </dd>
          </div>
          {artwork.medium && (
            <div>
              <dt className="text-[11px] text-ink-400">재료</dt>
              <dd className="text-sm text-ink-100">{artwork.medium}</dd>
            </div>
          )}
          {dimensions && (
            <div>
              <dt className="text-[11px] text-ink-400">크기</dt>
              <dd className="text-sm text-ink-100">{dimensions}</dd>
            </div>
          )}
          {artwork.productionYear && (
            <div>
              <dt className="text-[11px] text-ink-400">제작 연도</dt>
              <dd className="text-sm text-ink-100">{artwork.productionYear}</dd>
            </div>
          )}
        </dl>

        {videos.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold text-cream">작품 영상</h2>
            {videos.map((video) =>
              video.url ? (
                <video
                  key={video.id}
                  controls
                  playsInline
                  className="w-full rounded-xl border border-ink-700 bg-black"
                >
                  <source src={video.url} />
                  브라우저에서 영상을 재생할 수 없습니다.
                </video>
              ) : (
                <div key={video.id} className="card-surface p-4 text-sm text-ink-300">
                  영상을 감상할 수 있도록 변환 중입니다.
                </div>
              ),
            )}
          </div>
        )}

        {auction && (
          <div className="card-surface grid grid-cols-2 gap-3 p-4">
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
        )}

        <div className="flex flex-col gap-2 pt-1">
          {auction && (
            <Link href={`/auctions/${auction.id}`} className="btn-primary w-full">
              실시간 입찰하러 가기
            </Link>
          )}
          <div className="flex gap-2">
            {hasModel && (
              <Link href={`/artworks/${artwork.id}/viewer`} className="btn-outline flex-1">
                3D로 보기
              </Link>
            )}
            {auction && (
              <Link href={`/auctions/${auction.id}/watch`} className="btn-outline flex-1">
                라이브 시청
              </Link>
            )}
          </div>
        </div>

        {artwork.certificateUrl && (
          <a
            href={artwork.certificateUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent-light underline"
          >
            작품 보증서 확인
          </a>
        )}
      </section>
    </div>
  );
}
