"use client";

import { useEffect, useState } from "react";
import { fetchModelMediaUrl, resolveModelSource, type ModelSource } from "@/lib/artworkModel";
import type { ArtworkDetail } from "@/types";
import Live3DPlacement from "./Live3DPlacement";

interface SpacePreviewProps {
  artwork: ArtworkDetail;
  /** 화면에 보여줄 실제 크기 문구 (예: "60 × 80 cm") */
  dimensionsLabel?: string | null;
}

/**
 * '내 공간에 걸어보기' 화면
 * 카메라 화면이나 불러온 사진을 배경으로, 3D 뷰어와 같은 작품 모델을 띄워 배치한다.
 * 실제 공간 인식이나 실측은 하지 않는다. 크기는 사용자가 맞춘다.
 */
export default function SpacePreview({ artwork, dimensionsLabel }: SpacePreviewProps) {
  // undefined: 확인 중, null: 3D로 보여줄 수 없음
  const [source, setSource] = useState<ModelSource | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const modelUrl = await fetchModelMediaUrl(artwork.id);
      const resolved = await resolveModelSource(artwork, { apiModelUrl: modelUrl });
      if (!cancelled) setSource(resolved);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [artwork]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[18px] font-bold tracking-[-0.03em]">내 공간에 걸어보기</h1>
        <p className="mt-1 text-[12px] text-[#74756f]">
          {artwork.title}
          {dimensionsLabel && ` · 실제 크기 ${dimensionsLabel}`}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#858680]">
          카메라나 벽 사진 위에서 작품을 돌리고 옮겨 크기를 맞춘 뒤 셔터를 눌러 저장하세요.
        </p>
      </div>

      {source === undefined && <p className="text-[12px] text-[#74756f]">작품 모델을 준비하는 중...</p>}
      {source === null && (
        <p className="rounded-lg bg-[#f6f7f2] p-4 text-[12px] text-[#74756f]">
          이 작품은 3D 모델이 없어 공간 미리보기를 할 수 없어요.
        </p>
      )}
      {source && <Live3DPlacement source={source} artworkTitle={artwork.title} />}
    </div>
  );
}
