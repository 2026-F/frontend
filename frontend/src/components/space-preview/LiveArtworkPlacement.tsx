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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * 실시간 카메라 화면 위에 작품 이미지를 띄우고, 손가락으로 끌어서 위치를 옮기는 컴포넌트
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

  // 드래그 시작 시점의 손가락 위치와 작품 위치를 기억해두고, 이동한 만큼만 더함
  const dragStartRef = useRef<{ x: number; y: number; placement: Placement } | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId); // 손가락이 작품 밖으로 나가도 계속 추적
    dragStartRef.current = { x: event.clientX, y: event.clientY, placement };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    const stage = stageRef.current;
    if (!start || !stage) return;

    const rect = stage.getBoundingClientRect();
    const dx = (event.clientX - start.x) / rect.width;
    const dy = (event.clientY - start.y) / rect.height;
    setPlacement({
      ...start.placement,
      centerX: clamp(start.placement.centerX + dx, 0, 1),
      centerY: clamp(start.placement.centerY + dy, 0, 1),
    });
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  return (
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
  );
}
