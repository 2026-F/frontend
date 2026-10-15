import axios from "axios";
import Link from "next/link";
import { notFound } from "next/navigation";
import SpacePreview from "@/components/space-preview/SpacePreview";
import { fetchArtworkDetail } from "@/lib/api";
import { getMockArtworkDetail } from "@/lib/mock";
import type { ArtworkDetail } from "@/types";

type ArtworkSpacePreviewPageProps = {
  params: { id: string };
};

export default async function ArtworkSpacePreviewPage({ params }: ArtworkSpacePreviewPageProps) {
  const artworkId = Number(params.id);
  if (!Number.isInteger(artworkId) || artworkId <= 0) notFound();

  // 작품 상세 페이지와 같은 방식: API 실패 시 목데이터로 대체
  let artwork: ArtworkDetail;
  try {
    artwork = await fetchArtworkDetail(artworkId);
  } catch (error) {
    const mock = getMockArtworkDetail(artworkId);
    if (mock) artwork = mock;
    else {
      if (axios.isAxiosError(error) && error.response?.status === 404) notFound();
      throw error;
    }
  }

  const primaryImage =
    artwork.media
      .filter((item) => item.mediaType === "PHOTO" && item.url)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? artwork.imageUrl;

  // 실제 크기가 있으면 그 비율로, 없으면 이미지 원본 비율로 표시
  const hasSize = Boolean(artwork.widthCm && artwork.heightCm);
  const aspectRatio = hasSize ? artwork.widthCm! / artwork.heightCm! : undefined;
  const dimensionsLabel = hasSize ? `${artwork.widthCm} × ${artwork.heightCm} cm` : null;

  return (
    <div className="min-h-full bg-white px-4 pb-8 pt-3 text-[#111111]">
      <Link
        href={`/artworks/${artwork.id}`}
        className="mb-3 inline-flex text-[12px] font-medium text-[#74756f]"
      >
        ← 작품 상세로
      </Link>

      {primaryImage ? (
        <SpacePreview
          artworkTitle={artwork.title}
          artworkImageUrl={primaryImage}
          aspectRatio={aspectRatio}
          dimensionsLabel={dimensionsLabel}
        />
      ) : (
        <p className="rounded-lg bg-[#f6f7f2] p-4 text-[12px] text-[#74756f]">
          이 작품은 등록된 이미지가 없어 공간 미리보기를 할 수 없어요.
        </p>
      )}
    </div>
  );
}
