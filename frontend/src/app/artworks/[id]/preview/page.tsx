import axios from "axios";
import Link from "next/link";
import { notFound } from "next/navigation";
import SpacePreview from "@/components/space-preview/SpacePreview";
import { fetchArtworkDetail } from "@/lib/api";
import { getMockArtworkDetail } from "@/lib/mock";
import type { ArtworkDetail } from "@/types";

// 작품 상세 페이지와 같은 이유로 정적 캐싱을 끈다.
export const dynamic = "force-dynamic";

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

  const hasSize = Boolean(artwork.widthCm && artwork.heightCm);
  const dimensionsLabel = hasSize ? `${artwork.widthCm} × ${artwork.heightCm} cm` : null;

  return (
    <div className="min-h-full bg-white px-4 pb-8 pt-3 text-[#111111]">
      <Link
        href={`/artworks/${artwork.id}`}
        className="mb-3 inline-flex text-[12px] font-medium text-[#74756f]"
      >
        ← 작품 상세로
      </Link>

      <SpacePreview artwork={artwork} dimensionsLabel={dimensionsLabel} />
    </div>
  );
}
