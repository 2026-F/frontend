"use client";

import { useEffect } from "react";

/**
 * 라이브 방송 전용 세로 전체 화면 틀.
 * 헤더와 하단 메뉴 위를 덮고, 휴대폰에서는 화면 전체를, 넓은 화면에서는 가운데 9:16 기둥을 쓴다.
 * 영상은 children 맨 앞에 absolute inset-0 + object-cover로 깔고, 그 위에 조작 요소를 올린다.
 */
export default function LivePortraitShell({ children }: { children: React.ReactNode }) {
  // 뒤에 깔린 페이지가 같이 스크롤되지 않게 막는다.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* 휴대폰을 눕힌 것처럼 높이가 낮은 화면에서는 9:16 기둥이 너무 좁아지므로 가로 전체를 쓴다. */}
      <div className="relative mx-auto h-dvh w-full max-w-[calc(100dvh*9/16)] overflow-hidden bg-black text-white [@media(max-height:500px)]:max-w-none">
        {children}
      </div>
    </div>
  );
}

/** 영상 위 글자가 읽히도록 위아래에 까는 어두운 그라데이션 */
export function LiveScrim() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/70 to-transparent" />
    </>
  );
}

export function LiveBadge({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
        live ? "bg-[#e0443e] text-white" : "bg-white/20 text-white"
      }`}
    >
      {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {live ? "LIVE" : "OFF AIR"}
    </span>
  );
}
