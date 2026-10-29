"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ArtworkModelViewer from "@/components/artwork-model/ArtworkModelViewer";
import { fetchArtworkDetail } from "@/lib/api";
import { fetchModelMediaUrl, resolveModelSource, type ModelSource } from "@/lib/artworkModel";
import { getMockArtworkDetail } from "@/lib/mock";
import type { ArtworkDetail } from "@/types";

async function loadArtwork(artworkId: number): Promise<ArtworkDetail | null> {
  try {
    return await fetchArtworkDetail(artworkId);
  } catch {
    return getMockArtworkDetail(artworkId) ?? null;
  }
}

export default function ArtworkViewerPage() {
  const params = useParams<{ id: string }>();
  const artworkId = params.id;

  const [source, setSource] = useState<ModelSource | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [modelUrl, artwork] = await Promise.all([fetchModelMediaUrl(artworkId), loadArtwork(Number(artworkId))]);
      if (cancelled) return;
      setTitle(artwork?.title ?? null);
      // 모델 결정 규칙은 lib/artworkModel.ts 참고 (전용 모델 → 캔버스 + 사진 → 샘플)
      const resolved = await resolveModelSource(artwork, { apiModelUrl: modelUrl, allowFallback: true });
      if (!cancelled) setSource(resolved);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [artworkId]);

  return (
    <div className="container-page flex flex-col gap-4 py-6">
      <p className="eyebrow">3D Viewer</p>
      <h1 className="font-display text-xl font-semibold text-cream">{title ?? `작품 #${artworkId}`} 3D 뷰어</h1>

      {source ? (
        <div className="flex flex-col gap-2">
          <div className="aspect-square w-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
            {/* auto-rotate: 페이지 열리면 처음에 천천히 자동 회전 (사용자가 만지면 멈춤) */}
            <ArtworkModelViewer
              source={source}
              alt={`${title ?? `작품 ${artworkId}`} 3D 모델`}
              autoRotate
              cameraOrbit={source.kind === "canvas" ? "25deg 80deg auto" : source.kind === "model" ? "25deg 75deg auto" : "0deg 75deg 200%"}
            />
          </div>
          {source.kind !== "fallback" && (
            <Link
              href={`/artworks/${artworkId}/preview`}
              className="mt-1 flex h-11 w-full items-center justify-center rounded-lg border border-ink-700 text-sm font-semibold text-cream"
            >
              이 작품 내 공간에 걸어보기
            </Link>
          )}
          {source.kind === "canvas" && (
            <p className="text-xs text-ink-500">* 작품 사진을 실제 크기 비율의 캔버스에 입혀 보여주는 미리보기입니다.</p>
          )}
          {source.kind === "fallback" && (
            <p className="text-xs text-ink-500">
              * 이 작품에 등록된 3D 모델과 사진이 없어 샘플 모델(duck.glb)로 뷰어 동작만 보여주고 있습니다.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-400">불러오는 중...</p>
      )}
    </div>
  );
}
