'use client';

import { useState } from 'react';
import { safeHttpUrl } from '@/lib/admin-review';

export default function ReviewArtworkImage({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const safeUrl = safeHttpUrl(url);
  return safeUrl && !failed ? (
    // API 제공 원본을 표시하며 실패 시 합성 작품 이미지로 대체하지 않는다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safeUrl}
      alt={title}
      onError={() => setFailed(true)}
      className="h-full w-full object-contain"
    />
  ) : (
    <span className="p-3 text-center text-[12px] text-[#73756f]">
      {failed ? '이미지를 불러오지 못했습니다' : '이미지 미등록'}
    </span>
  );
}
