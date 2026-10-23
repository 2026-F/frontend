"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import "@google/model-viewer"; // import하는 순간 브라우저에 <model-viewer> 커스텀 엘리먼트가 등록됨
import { api, fetchArtworkDetail } from "@/lib/api";
import { getMockArtworkDetail } from "@/lib/mock";
import type { ArtworkCategory, ArtworkDetail, ArtworkMedia } from "@/types";

// 작품 전용 3D 스캔 모델이 없을 때 쓰는 "빈 캔버스" 모델.
// 1×1×1 박스이고, 앞면 재질 이름이 "Painting"이라 여기에 작품 이미지를 텍스처로 붙인다.
// 실제 크기(cm)는 model-viewer의 scale 속성으로 맞춘다. (public/models/canvas.glb)
const CANVAS_MODEL_URL = "/models/canvas.glb";
const PAINTING_MATERIAL = "Painting";
const DEFAULT_DEPTH_CM = 3; // 캔버스 프레임 두께 기본값
const DEFAULT_WIDTH_CM = 60; // 크기 정보가 없을 때 가로 기준값 (세로는 이미지 비율로 계산)

// 캔버스(평면 액자) 모드는 평면 작품에만 씀. 조각·공예 같은 입체 작품에 사진을 액자처럼 붙이면 어색하니까 제외
// (작품 상세 페이지의 "3D로 보기" 버튼 노출 조건과 같은 규칙)
const SOLID_CATEGORIES: ArtworkCategory[] = ["SCULPTURE", "CRAFT"];
const isFlat = (category: ArtworkCategory | null | undefined) => !category || !SOLID_CATEGORIES.includes(category);

// 이미지·크기 정보도 없을 때 뷰어 동작만 확인하는 샘플
const FALLBACK_MODEL_URL = "/duck.glb";

type ViewerSource =
  | { kind: "model"; url: string }
  | { kind: "canvas"; imageUrl: string; scale: string }
  | { kind: "fallback"; url: string };

// model-viewer 엘리먼트에서 우리가 쓰는 API만 최소로 타입 정의
type ModelViewerElement = HTMLElement & {
  model?: {
    materials: Array<{
      name: string;
      pbrMetallicRoughness: {
        baseColorTexture: { setTexture: (texture: unknown) => void } | null;
      };
    }>;
  };
  createTexture: (uri: string) => Promise<unknown>;
};

function loadImageRatio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalHeight / img.naturalWidth || 1);
    img.onerror = () => resolve(1);
    img.src = url;
  });
}

// 작품 크기(cm)를 model-viewer scale("가로 세로 두께", 단위 m)로 변환
async function canvasScale(artwork: ArtworkDetail, imageUrl: string) {
  let width = artwork.widthCm;
  let height = artwork.heightCm;
  if (!width || !height) {
    const ratio = await loadImageRatio(imageUrl);
    width = width ?? (height ? height / ratio : DEFAULT_WIDTH_CM);
    height = height ?? width * ratio;
  }
  const depth = artwork.depthCm || DEFAULT_DEPTH_CM;
  return [width, height, depth].map((cm) => (cm / 100).toFixed(4)).join(" ");
}

async function loadArtwork(artworkId: number): Promise<ArtworkDetail | null> {
  try {
    return await fetchArtworkDetail(artworkId);
  } catch {
    return getMockArtworkDetail(artworkId) ?? null;
  }
}

async function loadModelMedia(artworkId: string): Promise<ArtworkMedia | null> {
  try {
    const res = await api.get<ArtworkMedia[]>(`/api/artworks/${artworkId}/media`);
    return (
      res.data
        .filter((m) => m.mediaType === "MODEL_3D" && m.url)
        .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null
    );
  } catch {
    return null;
  }
}

export default function ArtworkViewerPage() {
  const params = useParams<{ id: string }>();
  const artworkId = params.id;
  const viewerRef = useRef<ModelViewerElement | null>(null);

  const [source, setSource] = useState<ViewerSource | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [model, artwork] = await Promise.all([loadModelMedia(artworkId), loadArtwork(Number(artworkId))]);
      if (cancelled) return;
      setTitle(artwork?.title ?? null);

      // 1순위: 작품 전용 3D 모델(MODEL_3D)이 등록돼 있으면 그걸 그대로 보여줌
      //  - 미디어 API에 있으면 그걸 쓰고, 없으면 작품 상세(백엔드 또는 목업)의 media에서 찾음
      //  - 목업 조각·공예 작품은 lib/mock.ts에서 MODEL_3D(.glb)를 넣어둬서 여기로 들어옴
      const detailModel = artwork?.media
        .filter((m) => m.mediaType === "MODEL_3D" && m.url)
        .sort((a, b) => a.sortOrder - b.sortOrder)[0];
      const modelUrl = model?.url ?? detailModel?.url;
      if (modelUrl) {
        setSource({ kind: "model", url: modelUrl });
        return;
      }

      // 2순위: 대표 사진을 캔버스 모델 앞면에 붙여서 보여줌
      const photo = artwork?.media
        .filter((m) => m.mediaType === "PHOTO" && m.url)
        .sort((a, b) => a.sortOrder - b.sortOrder)[0];
      const imageUrl = photo?.url ?? artwork?.imageUrl;
      if (artwork && imageUrl && isFlat(artwork.category)) {
        const scale = await canvasScale(artwork, imageUrl);
        if (!cancelled) setSource({ kind: "canvas", imageUrl, scale });
        return;
      }

      setSource({ kind: "fallback", url: FALLBACK_MODEL_URL });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [artworkId]);

  // 캔버스 모델이 로드되면 "Painting" 재질의 텍스처를 작품 이미지로 교체
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || source?.kind !== "canvas") return;
    let cancelled = false;

    const applyPainting = async () => {
      const material = viewer.model?.materials.find((m) => m.name === PAINTING_MATERIAL);
      const slot = material?.pbrMetallicRoughness.baseColorTexture;
      if (!slot) return;
      const texture = await viewer.createTexture(source.imageUrl);
      if (!cancelled) slot.setTexture(texture);
    };

    // 이미 로드가 끝났으면 바로, 아니면 load 이벤트 때 적용
    if (viewer.model?.materials.length) applyPainting();
    viewer.addEventListener("load", applyPainting);
    return () => {
      cancelled = true;
      viewer.removeEventListener("load", applyPainting);
    };
  }, [source]);

  const modelSrc = source?.kind === "canvas" ? CANVAS_MODEL_URL : source?.url;

  return (
    <div className="container-page flex flex-col gap-4 py-6">
      <p className="eyebrow">3D Viewer</p>
      <h1 className="font-display text-xl font-semibold text-cream">{title ?? `작품 #${artworkId}`} 3D 뷰어</h1>

      {source && modelSrc ? (
        <div className="flex flex-col gap-2">
          <div className="aspect-square w-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
            {/*
              camera-controls: 마우스 드래그/손가락으로 회전·확대·이동 가능하게 함
              auto-rotate: 페이지 열리면 처음에 천천히 자동 회전 (사용자가 만지면 멈춤)
              scale: 캔버스 모드일 때 작품 실제 크기(m)로 박스를 늘림
              AR 기능은 현재 범위에서 제외 — ar / ar-modes 속성을 넣지 않았습니다.
            */}
            <model-viewer
              ref={viewerRef}
              key={modelSrc}
              src={modelSrc}
              alt={`${title ?? `작품 ${artworkId}`} 3D 모델`}
              camera-controls
              auto-rotate
              scale={source.kind === "canvas" ? source.scale : undefined}
              camera-orbit={source.kind === "canvas" ? "25deg 80deg auto" : source.kind === "model" ? "25deg 75deg auto" : "0deg 75deg 200%"}
              shadow-intensity="0.6"
              style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
            />
          </div>
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
