"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "@google/model-viewer"; // import하는 순간 브라우저에 <model-viewer> 커스텀 엘리먼트가 등록됨
import { api } from "@/lib/api";
import type { ArtworkMedia } from "@/types";

export default function ArtworkViewerPage() {
  const params = useParams<{ id: string }>();
  const artworkId = params.id;

  const [modelUrl, setModelUrl] = useState<string | null>(null);
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
          setStatus("아직 등록된 3D 모델이 없습니다.");
          return;
        }
        setModelUrl(model.url);
      } catch {
        setStatus("3D 모델 정보를 불러오지 못했습니다.");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [artworkId]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">작품 #{artworkId} 3D 뷰어</h1>

      {modelUrl ? (
        <div className="aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {/*
            camera-controls: 마우스 드래그/손가락으로 회전·확대·이동 가능하게 함
            auto-rotate: 페이지 열리면 처음에 천천히 자동 회전 (사용자가 만지면 멈춤)
            ar + ar-modes: 이 두 속성이 있으면 지원 기기에서 화면 오른쪽 아래에
              AR 버튼이 자동으로 나타남. 누르면 카메라를 켜서 실제 공간에 모델을 띄워줌
              (아이폰은 Quick Look, 안드로이드는 Scene Viewer, 그 외엔 WebXR로 시도)
          */}
          <model-viewer
            src={modelUrl}
            alt={`작품 ${artworkId} 3D 모델`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            camera-orbit="0deg 75deg 200%"
            style={{ width: "50%", height: "50%" }}
            />
        </div>
      ) : (
        <p className="text-sm text-gray-500">{status}</p>
      )}
    </div>
  );
}