"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useCameraStream } from "./useCameraStream";

interface LiveArtworkPlacementProps {
  artworkImageUrl: string;
  artworkTitle: string;
  /** 작품 가로/세로 비율 (widthCm / heightCm). 없으면 이미지 원본 비율을 사용 */
  aspectRatio?: number;
}

/** 작품 위치·크기 — 화면 크기가 달라도 똑같이 보이도록 화면 대비 비율(0~1)로 저장 */
interface Placement {
  /** 작품 중심의 가로 위치 (0 = 왼쪽 끝, 1 = 오른쪽 끝) */
  centerX: number;
  /** 작품 중심의 세로 위치 (0 = 위쪽 끝, 1 = 아래쪽 끝) */
  centerY: number;
  /** 작품 가로 길이 / 화면 가로 길이 */
  width: number;
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
      </div>

      {status === "live" && (
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
    </div>
  );
}
