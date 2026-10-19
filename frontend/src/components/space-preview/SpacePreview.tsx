"use client";

import { useEffect, useState } from "react";
import LiveArtworkPlacement from "./LiveArtworkPlacement";
import WallPhotoPicker, { type WallPhoto } from "./WallPhotoPicker";

interface SpacePreviewProps {
  artworkTitle: string;
  artworkImageUrl: string;
  /** 작품 가로/세로 비율 (widthCm / heightCm) */
  aspectRatio?: number;
  /** 화면에 보여줄 실제 크기 문구 (예: "60 × 80 cm") */
  dimensionsLabel?: string | null;
}

type BackgroundPhoto = { url: string; width: number; height: number };

/**
 * '내 공간에 걸어보기' 화면
 * - 기본: 실시간 카메라 위에 작품 배치
 * - 카메라를 쓸 수 없거나 원하면: 앨범 사진 위에 작품 배치
 */
export default function SpacePreview({
  artworkTitle,
  artworkImageUrl,
  aspectRatio,
  dimensionsLabel,
}: SpacePreviewProps) {
  const [mode, setMode] = useState<"camera" | "album">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<BackgroundPhoto | null>(null);

  // WallPhotoPicker는 화면에서 사라질 때 자기 미리보기 URL을 해제하므로,
  // 배치 화면에서 쓸 URL은 여기서 따로 만들고 직접 해제함
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const handlePhotoSelect = (selected: WallPhoto) => {
    setPhoto({
      url: URL.createObjectURL(selected.blob),
      width: selected.width,
      height: selected.height,
    });
  };

  const switchToAlbum = () => {
    setMode("album");
    setPhoto(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[18px] font-bold tracking-[-0.03em]">내 공간에 걸어보기</h1>
        <p className="mt-1 text-[12px] text-[#74756f]">
          {artworkTitle}
          {dimensionsLabel && ` · 실제 크기 ${dimensionsLabel}`}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#858680]">
          작품을 손가락으로 끌어 옮기고, 두 손가락으로 크기를 맞춘 뒤 셔터를 눌러 저장하세요.
        </p>
      </div>

      {mode === "camera" && (
        <>
          <LiveArtworkPlacement
            artworkTitle={artworkTitle}
            artworkImageUrl={artworkImageUrl}
            aspectRatio={aspectRatio}
            onCameraError={setCameraError}
          />
          <button
            type="button"
            onClick={switchToAlbum}
            className={
              cameraError
                ? "w-full rounded-full bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white"
                : "self-center text-[12px] font-medium text-[#74756f] underline underline-offset-2"
            }
          >
            {cameraError ? "앨범 사진으로 걸어보기" : "카메라 대신 앨범 사진으로 하기"}
          </button>
        </>
      )}

      {mode === "album" && !photo && <WallPhotoPicker onSelect={handlePhotoSelect} />}

      {mode === "album" && photo && (
        <>
          <LiveArtworkPlacement
            artworkTitle={artworkTitle}
            artworkImageUrl={artworkImageUrl}
            aspectRatio={aspectRatio}
            photo={photo}
          />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            className="self-center text-[12px] font-medium text-[#74756f] underline underline-offset-2"
          >
            다른 사진 선택
          </button>
        </>
      )}

      {mode === "album" && !cameraError && (
        <button
          type="button"
          onClick={() => setMode("camera")}
          className="self-center text-[12px] font-medium text-[#74756f] underline underline-offset-2"
        >
          카메라로 돌아가기
        </button>
      )}
    </div>
  );
}
