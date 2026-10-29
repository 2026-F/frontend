"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import ArtworkModelViewer, { type ModelViewerElement } from "@/components/artwork-model/ArtworkModelViewer";
import type { ModelSource } from "@/lib/artworkModel";
import { composeLayers } from "@/lib/composeImage";
import { resizeImageFile, type ResizedImage } from "@/lib/image";
import { saveOrShareImage } from "@/lib/saveImage";
import { useCameraStream } from "./useCameraStream";

interface Live3DPlacementProps {
  source: ModelSource;
  artworkTitle: string;
}

interface CapturedImage {
  blob: Blob;
  url: string;
}

// model-viewer 기본값은 처음 거리보다 멀어질 수 없어 작게 줄일 수가 없음 → 4배까지 멀어지게 허용
const MAX_CAMERA_ORBIT = "auto auto 420%";
// auto 거리는 이상 거리의 105%. 크기 1 = 화면을 꽉 채우는 거리
const AUTO_RADIUS_PERCENT = 105;
const MIN_SIZE = 0.25;
const MAX_SIZE = 2.5;
// 처음부터 꽉 차면 벽에 건 느낌이 안 나서 조금 작게 시작
const INITIAL_SIZE = 0.6;
const radiusOf = (size: number) => `${(AUTO_RADIUS_PERCENT / size).toFixed(1)}%`;
// 그림(캔버스)은 정면에서, 입체 모델은 살짝 비스듬히 시작
const initialOrbitOf = (source: ModelSource) =>
  source.kind === "canvas" ? `0deg 90deg ${radiusOf(INITIAL_SIZE)}` : `20deg 80deg ${radiusOf(INITIAL_SIZE)}`;

/**
 * 카메라 화면이나 불러온 사진을 배경으로 깔고, 그 위에 작품 3D 모델을 띄워 보는 화면
 * - 한 손가락(마우스 왼쪽) 드래그: 돌리기
 * - 두 손가락(마우스 오른쪽 드래그): 옮기기, 핀치(휠): 크기
 * - 셔터: 배경 + 3D 화면을 그대로 합쳐 미리보기 → 저장
 */
export default function Live3DPlacement({ source, artworkTitle }: Live3DPlacementProps) {
  // 배경 종류와 불러온 사진을 따로 보관 → 카메라로 갔다 와도 사진이 남아 있음
  const [mode, setMode] = useState<"camera" | "photo">("camera");
  const [loadedPhoto, setLoadedPhoto] = useState<ResizedImage | null>(null);
  const { videoRef, status, error } = useCameraStream(mode === "camera");
  const photo = mode === "photo" ? loadedPhoto : null;
  const ready = mode === "camera" ? status === "live" : Boolean(photo);

  const stageRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState(INITIAL_SIZE);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // 불러온 사진 URL은 바꾸거나 화면을 떠날 때 해제
  useEffect(() => {
    return () => {
      if (loadedPhoto) URL.revokeObjectURL(loadedPhoto.url);
    };
  }, [loadedPhoto]);

  const openPhotoPicker = () => fileInputRef.current?.click();

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 사진을 다시 골라도 change가 일어나게
    if (!file) return;
    setPhotoError(null);
    try {
      const resized = await resizeImageFile(file);
      setLoadedPhoto(resized);
      setMode("photo");
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "사진을 불러오지 못했어요.");
    }
  };

  const handleSizeChange = (value: number) => {
    setSize(value);
    const viewer = viewerRef.current;
    if (!viewer) return;
    // 크기 = 카메라 거리의 역수. 지금 보는 방향은 그대로 두고 거리만 바꿈
    const { theta, phi } = viewer.getCameraOrbit();
    viewer.cameraOrbit = `${theta}rad ${phi}rad ${radiusOf(value)}`;
  };

  const handleReset = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    setSize(INITIAL_SIZE);
    viewer.cameraOrbit = initialOrbitOf(source);
    viewer.cameraTarget = "auto auto auto";
    viewer.jumpCameraToGoal();
  };

  // ---- 셔터 / 저장 ----
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (captured) URL.revokeObjectURL(captured.url);
    };
  }, [captured]);

  const handleCapture = async () => {
    const viewer = viewerRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!viewer || !stage) return;

    setIsCapturing(true);
    setCaptureError(null);
    try {
      // 배경을 먼저 잡아야 셔터를 누른 순간의 카메라 화면이 찍힘
      let bg: { source: CanvasImageSource; width: number; height: number };
      if (photo) {
        const bitmap = await createImageBitmap(photo.blob);
        bg = { source: bitmap, width: bitmap.width, height: bitmap.height };
      } else {
        if (!video || !video.videoWidth) return;
        const frame = document.createElement("canvas");
        frame.width = video.videoWidth;
        frame.height = video.videoHeight;
        frame.getContext("2d")?.drawImage(video, 0, 0);
        bg = { source: frame, width: frame.width, height: frame.height };
      }

      // 3D 화면: 배경이 투명한 PNG, 화면에 보이는 비율 그대로
      const overlayBlob = await viewer.toBlob({ mimeType: "image/png", idealAspect: false });
      const overlay = await createImageBitmap(overlayBlob);

      const rect = stage.getBoundingClientRect();
      const blob = await composeLayers({
        background: bg.source,
        backgroundSize: { width: bg.width, height: bg.height },
        stageSize: { width: rect.width, height: rect.height },
        overlay,
      });
      setCaptured({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      setCaptureError(e instanceof Error ? e.message : "사진을 찍지 못했어요.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSave = async () => {
    if (!captured) return;
    setIsSaving(true);
    try {
      const safeTitle = artworkTitle.replace(/[\\/:*?"<>|\s]+/g, "_");
      await saveOrShareImage(captured.blob, `artbid-${safeTitle}-${Date.now()}.jpg`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition ${
      active ? "bg-[#111111] text-white" : "text-[#74756f]"
    }`;

  return (
    <div className="flex flex-col gap-3">
      {/* 배경 고르기: 카메라 / 사진 */}
      <div className="flex gap-1 rounded-full bg-[#f1f2ec] p-1">
        <button
          type="button"
          onClick={() => setMode("camera")}
          className={tabClass(mode === "camera")}
        >
          카메라
        </button>
        <button
          type="button"
          onClick={() => (loadedPhoto ? setMode("photo") : openPhotoPicker())}
          className={tabClass(mode === "photo")}
        >
          사진 불러오기
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

      <div ref={stageRef} className="relative aspect-[3/4] w-full overflow-hidden rounded-[10px] bg-[#111111]">
        {mode === "camera" && (
          // playsInline: 아이폰에서 영상이 전체화면으로 튀어나가지 않게 함
          <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        )}
        {photo && <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}

        {mode === "camera" && status === "starting" && (
          <p className="absolute inset-x-0 top-4 text-center text-[12px] text-white/80">카메라를 켜는 중...</p>
        )}
        {mode === "camera" && status === "error" && (
          <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-2 bg-black/60 px-6 py-4 text-center">
            <p role="alert" className="text-[12px] leading-relaxed text-white/90">
              {error}
            </p>
            <button
              type="button"
              onClick={openPhotoPicker}
              className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-[#111111]"
            >
              사진으로 걸어보기
            </button>
          </div>
        )}
        {mode === "photo" && !photo && (
          <button
            type="button"
            onClick={openPhotoPicker}
            className="absolute inset-x-0 top-4 mx-auto w-fit rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-[#111111]"
          >
            벽 사진 고르기
          </button>
        )}

        {/* 3D 작품: 배경이 투명이라 뒤의 카메라/사진이 그대로 보임 */}
        <div className="absolute inset-0">
          <ArtworkModelViewer
            ref={viewerRef}
            source={source}
            alt={`${artworkTitle} 3D 모델`}
            cameraOrbit={initialOrbitOf(source)}
            maxCameraOrbit={MAX_CAMERA_ORBIT}
            shadowIntensity={source.kind === "canvas" ? 0 : 0.6}
            captureTouch
          />
        </div>

        {captured && (
          <img
            src={captured.url}
            alt={`${artworkTitle}을(를) 내 공간에 걸어본 사진`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {photoError && (
        <p role="alert" className="text-[12px] text-[#d6453d]">
          {photoError}
        </p>
      )}
      {captureError && (
        <p role="alert" className="text-[12px] text-[#d6453d]">
          {captureError}
        </p>
      )}

      {!captured && (
        <>
          <p className="text-center text-[11px] text-[#858680]">한 손가락: 돌리기 · 두 손가락: 옮기기·크기</p>
          <div className="flex items-center gap-3 text-[12px] font-medium text-[#42433f]">
            <label className="flex flex-1 items-center gap-3">
              크기
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={0.01}
                value={size}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="flex-1 accent-[#111111]"
              />
            </label>
            <button type="button" onClick={handleReset} className="text-[12px] text-[#74756f] underline underline-offset-2">
              처음 위치로
            </button>
          </div>
          {photo && (
            <button
              type="button"
              onClick={openPhotoPicker}
              className="self-center text-[12px] font-medium text-[#74756f] underline underline-offset-2"
            >
              다른 사진
            </button>
          )}
          <button
            type="button"
            aria-label="사진 찍기"
            disabled={!ready || isCapturing}
            onClick={handleCapture}
            className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-[#111111] bg-white transition active:scale-95 disabled:opacity-40"
          >
            <span className="h-11 w-11 rounded-full bg-[#111111]" />
          </button>
        </>
      )}

      {captured && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCaptured(null)}
            className="flex-1 rounded-full border border-[#d9dcd2] bg-white px-4 py-3 text-[13px] font-semibold text-[#111111]"
          >
            다시 찍기
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 rounded-full bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            저장하기
          </button>
        </div>
      )}
    </div>
  );
}
