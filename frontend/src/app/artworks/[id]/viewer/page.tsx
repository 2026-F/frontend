"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "@google/model-viewer"; // import하는 순간 브라우저에 <model-viewer> 커스텀 엘리먼트가 등록됨
import { api } from "@/lib/api";
import type { ArtworkMedia } from "@/types";

// 백엔드 미디어 API가 비어있거나 아직 연결 전이어도 뷰어 동작을 확인할 수 있도록
// public/duck.glb 샘플 모델로 대체합니다. 실제 3D 스캔 데이터가 등록되면 쓰이지 않습니다.
const FALLBACK_MODEL_URL = "/duck.glb";

export default function ArtworkViewerPage() {
  const params = useParams<{ id: string }>();
  const artworkId = params.id;

  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [status, setStatus] = useState("불러오는 중...");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // 이 작품에 등록된 모든 미디어(사진/동영상/3D모델) 목록을 받아옴
        const res = await api.get<ArtworkMedia[]>(`/api/artworks/${artworkId}/media`);
        if (cancelled) return;

        // 그중 mediaType이 "MODEL_3D"인 것만 걸러서, sortOrder가 가장 앞선 걸 하나 고름
        const model = res.data
          .filter((m) => m.mediaType === "MODEL_3D" && m.url)
          .sort((a, b) => a.sortOrder - b.sortOrder)[0];

        if (!model || !model.url) {
          setModelUrl(FALLBACK_MODEL_URL);
          setIsFallback(true);
          return;
        }
        setModelUrl(model.url);
      } catch {
        setModelUrl(FALLBACK_MODEL_URL);
        setIsFallback(true);
        setStatus("3D 모델 정보를 불러오지 못해 샘플 모델을 보여줍니다.");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [artworkId]);

  return (
    <div className="container-page flex flex-col gap-4 py-6">
      <p className="eyebrow">3D Viewer</p>
      <h1 className="font-display text-xl font-semibold text-cream">작품 #{artworkId} 3D 뷰어</h1>

      {modelUrl ? (
        <div className="flex flex-col gap-2">
          <div className="aspect-square w-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
            {/*
              camera-controls: 마우스 드래그/손가락으로 회전·확대·이동 가능하게 함
              auto-rotate: 페이지 열리면 처음에 천천히 자동 회전 (사용자가 만지면 멈춤)
              AR 기능은 현재 범위에서 제외 — ar / ar-modes 속성을 넣지 않았습니다.
            */}
            <model-viewer
              src={modelUrl}
              alt={`작품 ${artworkId} 3D 모델`}
              camera-controls
              auto-rotate
              camera-orbit="0deg 75deg 200%"
              style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
            />
          </div>
          {isFallback && (
            <p className="text-xs text-ink-500">
              * 이 작품에 등록된 3D 모델이 없어 샘플 모델(duck.glb)로 뷰어 동작만 보여주고 있습니다.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-400">{status}</p>
      )}
    </div>
  );
}
