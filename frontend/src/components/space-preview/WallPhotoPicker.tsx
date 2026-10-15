"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { resizeImageFile, type ResizedImage } from "@/lib/image";

export type WallPhoto = ResizedImage;

interface WallPhotoPickerProps {
  /** 사진이 준비되면(리사이즈 완료) 호출 — 다음 단계(작품 배치)로 넘길 때 사용 */
  onSelect?: (photo: WallPhoto) => void;
}

/**
 * 앨범에서 벽(공간) 사진을 고르는 컴포넌트
 * 메인 흐름은 실시간 카메라 위 배치이고, 이 컴포넌트는 카메라를 쓸 수 없을 때
 * (권한 거부 · PC · HTTPS가 아닌 환경) 이미 찍어둔 사진으로 대신 배치하기 위한 대체 수단
 */
export default function WallPhotoPicker({ onSelect }: WallPhotoPickerProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<WallPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사진을 바꾸거나 페이지를 떠날 때 이전 object URL을 해제해서 메모리 누수를 막음
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 사진을 다시 골라도 onChange가 실행되도록 초기화
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const resized = await resizeImageFile(file);
      setPhoto(resized);
      onSelect?.(resized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진을 불러오지 못했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[10px] border border-[#e6e7e2] bg-[#f7f7f5]">
        {photo ? (
          <img src={photo.url} alt="선택한 벽 사진" className="h-full w-full object-cover" />
        ) : (
          <p className="px-6 text-center text-[13px] leading-relaxed text-[#858680]">
            작품을 걸어볼 벽 사진을 골라주세요.
            <br />
            정면에서 밝게 찍은 사진일수록 결과가 자연스러워요.
          </p>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[13px] font-medium text-[#42433f]">
            사진 준비 중...
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-[12px] text-[#d6453d]">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={isProcessing}
        onClick={() => galleryInputRef.current?.click()}
        className="w-full rounded-full bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white transition disabled:opacity-40"
      >
        {photo ? "다른 사진 선택" : "앨범에서 선택"}
      </button>
    </div>
  );
}
