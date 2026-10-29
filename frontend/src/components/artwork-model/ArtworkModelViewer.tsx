"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "@google/model-viewer"; // import하는 순간 브라우저에 <model-viewer> 커스텀 엘리먼트가 등록됨
import { modelUrlOf, PAINTING_MATERIAL, type ModelSource } from "@/lib/artworkModel";

// model-viewer 엘리먼트에서 우리가 쓰는 API만 최소로 타입 정의
export type ModelViewerElement = HTMLElement & {
  model?: {
    materials: Array<{
      name: string;
      pbrMetallicRoughness: {
        baseColorTexture: { setTexture: (texture: unknown) => void } | null;
      };
    }>;
  };
  createTexture: (uri: string) => Promise<unknown>;
  /** 지금 화면에 그려진 3D 장면을 이미지로. 배경이 투명이면 PNG에 투명도가 유지된다 */
  toBlob: (options?: { mimeType?: string; idealAspect?: boolean }) => Promise<Blob>;
  getCameraOrbit: () => { theta: number; phi: number; radius: number };
  cameraOrbit: string;
  cameraTarget: string;
  jumpCameraToGoal: () => void;
};

interface ArtworkModelViewerProps {
  source: ModelSource;
  alt: string;
  /** 처음 카메라 각도 (model-viewer camera-orbit) */
  cameraOrbit?: string;
  /** 카메라 이동 범위 (model-viewer min/max-camera-orbit). 멀리 빼서 작게 보려면 max 반지름을 늘린다 */
  minCameraOrbit?: string;
  maxCameraOrbit?: string;
  autoRotate?: boolean;
  /** 바닥 그림자 진하기. 벽에 거는 그림은 0 */
  shadowIntensity?: number;
  /** 손가락 동작을 페이지 스크롤 대신 전부 3D 조작에 쓸지 */
  captureTouch?: boolean;
  className?: string;
}

/**
 * 작품 3D 모델 표시. 캔버스 모델이면 로드 후 "Painting" 재질에 작품 사진을 텍스처로 붙인다.
 * 배경은 항상 투명이라 뒤에 카메라 화면이나 사진을 깔 수 있다.
 * ref로 model-viewer 엘리먼트(사진 찍기, 카메라 조작용)를 받을 수 있다.
 */
const ArtworkModelViewer = forwardRef<ModelViewerElement | null, ArtworkModelViewerProps>(function ArtworkModelViewer(
  { source, alt, cameraOrbit, minCameraOrbit, maxCameraOrbit, autoRotate = false, shadowIntensity = 0.6, captureTouch = false, className },
  ref,
) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  useImperativeHandle(ref, () => viewerRef.current as ModelViewerElement, []);

  // 캔버스 모델이 로드되면 "Painting" 재질의 텍스처를 작품 이미지로 교체
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || source.kind !== "canvas") return;
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

  const modelSrc = modelUrlOf(source);

  return (
    /*
      camera-controls: 마우스 드래그/손가락으로 회전·확대·이동 가능하게 함
      scale: 캔버스 모드일 때 작품 실제 크기(m)로 박스를 늘림
      AR 기능은 현재 범위에서 제외 — ar / ar-modes 속성을 넣지 않았습니다.
    */
    <model-viewer
      ref={viewerRef}
      key={modelSrc}
      src={modelSrc}
      alt={alt}
      camera-controls
      auto-rotate={autoRotate || undefined}
      scale={source.kind === "canvas" ? source.scale : undefined}
      camera-orbit={cameraOrbit}
      min-camera-orbit={minCameraOrbit}
      max-camera-orbit={maxCameraOrbit}
      shadow-intensity={String(shadowIntensity)}
      touch-action={captureTouch ? "none" : undefined}
      interaction-prompt="none"
      class={className}
      style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
    />
  );
});

export default ArtworkModelViewer;
