"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { composePlacement, loadImageForCanvas, type ArtworkPlacement } from "@/lib/composeImage";
import { saveOrShareImage } from "@/lib/saveImage";
import { useCameraStream } from "./useCameraStream";

interface LiveArtworkPlacementProps {
  artworkImageUrl: string;
  artworkTitle: string;
  /** 작품 가로/세로 비율 (widthCm / heightCm). 없으면 이미지 원본 비율을 사용 */
  aspectRatio?: number;
}

type Placement = ArtworkPlacement;

/** 셔터로 찍은 결과 이미지 */
interface CapturedImage {
  blob: Blob;
  /** 미리보기용 object URL */
  url: string;
}

const INITIAL_PLACEMENT: Placement = { centerX: 0.5, centerY: 0.42, width: 0.45 };
const MIN_WIDTH = 0.1;
const MAX_WIDTH = 0.95;

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * 실시간 카메라 화면 위에 작품 이미지를 띄우고 위치·크기를 조절하는 컴포넌트
 * - 한 손가락(마우스) 드래그: 위치 이동
 * - 두 손가락 핀치: 크기 조절
 * - 하단 슬라이더: 크기 조절 (PC나 핀치가 불편할 때)
 * - 셔터: 화면에 보이는 그대로(카메라 + 작품) 합성 → 미리보기 → 저장
 */
export default function LiveArtworkPlacement({
  artworkImageUrl,
  artworkTitle,
  aspectRatio,
}: LiveArtworkPlacementProps) {
  const { videoRef, status, error } = useCameraStream();
  const stageRef = useRef<HTMLDivElement>(null);

  const [placement, setPlacement] = useState<Placement>(INITIAL_PLACEMENT);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const ratio = aspectRatio ?? imageRatio ?? 4 / 5;

  // 현재 화면에 닿아 있는 손가락들 (pointerId → 위치)
  const pointersRef = useRef(new Map<number, Point>());
  // 제스처 시작 시점의 기준값 — 손가락 수가 바뀔 때마다 다시 잡아서 작품이 튀지 않게 함
  const gestureStartRef = useRef<{ points: Point[]; placement: Placement } | null>(null);
  const placementRef = useRef(placement);
  placementRef.current = placement;

  const resetGestureStart = () => {
    const points = Array.from(pointersRef.current.values());
    gestureStartRef.current = points.length ? { points, placement: placementRef.current } : null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId); // 손가락이 작품 밖으로 나가도 계속 추적
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    resetGestureStart();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const start = gestureStartRef.current;
    const stage = stageRef.current;
    if (!start || !stage) return;

    const rect = stage.getBoundingClientRect();
    const points = Array.from(pointersRef.current.values());

    if (points.length === 1) {
      // 드래그: 시작 위치에서 움직인 만큼 작품도 이동
      const dx = (points[0].x - start.points[0].x) / rect.width;
      const dy = (points[0].y - start.points[0].y) / rect.height;
      setPlacement({
        ...start.placement,
        centerX: clamp(start.placement.centerX + dx, 0, 1),
        centerY: clamp(start.placement.centerY + dy, 0, 1),
      });
    } else if (points.length >= 2 && start.points.length >= 2) {
      // 핀치: 두 손가락 사이 거리가 늘어난 비율만큼 작품도 커짐
      const scale = distance(points[0], points[1]) / distance(start.points[0], start.points[1]);
      setPlacement({
        ...start.placement,
        width: clamp(start.placement.width * scale, MIN_WIDTH, MAX_WIDTH),
      });
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    resetGestureStart();
  };

  // ---- 셔터 / 저장 ----
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // 합성용 작품 이미지를 미리 불러둠 → 셔터를 누른 순간의 카메라 화면이 바로 찍히도록
  const artworkForCanvasRef = useRef<Promise<HTMLImageElement> | null>(null);
  useEffect(() => {
    const loading = loadImageForCanvas(artworkImageUrl);
    loading.catch(() => {}); // 실패는 셔터를 누를 때 안내
    artworkForCanvasRef.current = loading;
  }, [artworkImageUrl]);

  // 결과를 다시 찍거나 화면을 떠날 때 미리보기 URL 해제
  useEffect(() => {
    return () => {
      if (captured) URL.revokeObjectURL(captured.url);
    };
  }, [captured]);

  const handleCapture = async () => {
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!video || !stage || !video.videoWidth || !artworkForCanvasRef.current) return;

    setIsCapturing(true);
    setCaptureError(null);
    try {
      const artwork = await artworkForCanvasRef.current;
      const rect = stage.getBoundingClientRect();
      const blob = await composePlacement({
        background: video,
        backgroundSize: { width: video.videoWidth, height: video.videoHeight },
        stageSize: { width: rect.width, height: rect.height },
        artwork,
        artworkSize: { width: artwork.naturalWidth, height: artwork.naturalHeight },
        artworkRatio: ratio,
        placement,
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
      const safeTitle = artworkTitle.replace(/[\\/:*?"<>|\s]+/g, "_"); // 파일 이름에 못 쓰는 문자 제거
      await saveOrShareImage(captured.blob, `artbid-${safeTitle}-${Date.now()}.jpg`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stageRef}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-[10px] bg-[#111111]"
      >
        {/* playsInline: 아이폰에서 영상이 전체화면으로 튀어나가지 않게 함 */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        {status === "live" && (
          <div
            role="img"
            aria-label={`${artworkTitle} 배치 위치`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute cursor-grab touch-none select-none active:cursor-grabbing"
            style={{
              left: `${placement.centerX * 100}%`,
              top: `${placement.centerY * 100}%`,
              width: `${placement.width * 100}%`,
              aspectRatio: `${ratio}`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <img
              src={artworkImageUrl}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setImageRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
              }
              className="h-full w-full object-cover shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
            />
          </div>
        )}

        {status === "starting" && (
          <p className="absolute inset-0 flex items-center justify-center text-[13px] text-white/80">
            카메라를 켜는 중...
          </p>
        )}

        {status === "error" && (
          <p
            role="alert"
            className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] leading-relaxed text-white/90"
          >
            {error}
          </p>
        )}

        {/* 셔터로 찍은 결과 미리보기 — 카메라 화면 위에 덮어서 보여줌 */}
        {captured && (
          <img
            src={captured.url}
            alt={`${artworkTitle}을(를) 내 공간에 걸어본 사진`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {captureError && (
        <p role="alert" className="text-[12px] text-[#d6453d]">
          {captureError}
        </p>
      )}

      {status === "live" && !captured && (
        <label className="flex items-center gap-3 text-[12px] font-medium text-[#42433f]">
          크기
          <input
            type="range"
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            step={0.01}
            value={placement.width}
            onChange={(e) => setPlacement((prev) => ({ ...prev, width: Number(e.target.value) }))}
            className="flex-1 accent-[#111111]"
          />
        </label>
      )}

      {status === "live" && !captured && (
        <button
          type="button"
          aria-label="사진 찍기"
          disabled={isCapturing}
          onClick={handleCapture}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-[#111111] bg-white transition active:scale-95 disabled:opacity-40"
        >
          <span className="h-11 w-11 rounded-full bg-[#111111]" />
        </button>
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
