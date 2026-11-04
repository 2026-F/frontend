'use client';

import { useState } from 'react';

export default function ArtworkImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return src && failed !== src ? (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(src)}
      className="h-full w-full object-cover"
    />
  ) : (
    <div
      className="flex h-full min-h-24 w-full items-center justify-center bg-[#f0f1ed] p-3 text-center text-xs text-[#73756f]"
      role="img"
      aria-label={`${alt}: 이미지 없음`}
    >
      이미지 준비 중
    </div>
  );
}
