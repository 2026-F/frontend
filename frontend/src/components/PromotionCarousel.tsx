"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Promotion } from "@/lib/promotions";

const INTERVAL_MS = 5000;

export default function PromotionCarousel({ promotions }: { promotions: Promotion[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (paused || promotions.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % promotions.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active, paused, promotions.length]);

  function move(step: number) {
    setActive((current) => (current + step + promotions.length) % promotions.length);
  }

  return (
    <div
      className="relative"
      aria-roledescription="캐러셀"
      aria-label="프로모션 배너"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchStart === null) return;
        const distance = event.changedTouches[0].clientX - touchStart;
        if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
        setTouchStart(null);
      }}
    >
      <div className="relative h-[220px] overflow-hidden rounded-[20px] bg-[#171717]">
        {promotions.map((promotion, index) => (
          <Link
            key={promotion.id}
            href={`/promotions/${promotion.id}`}
            aria-label={`${promotion.title} 프로모션 보기`}
            aria-hidden={index !== active}
            tabIndex={index === active ? 0 : -1}
            className={`absolute inset-0 block text-white transition-opacity duration-500 ${index === active ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <img src={promotion.imageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#07100c]/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />
            <div className="absolute inset-x-5 bottom-7 top-5 flex flex-col justify-center">
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#c8f887]">{promotion.eyebrow}</p>
              <h1 className="mt-3 max-w-[285px] break-keep font-['Poppins',Pretendard,sans-serif] text-[27px] font-black leading-[1.17] tracking-[-0.055em] drop-shadow-md">{promotion.title}</h1>
              <p className="mt-2 max-w-[285px] break-keep text-xs leading-5 text-white/90">{promotion.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <div className="flex gap-1.5" aria-label="배너 선택">
          {promotions.map((promotion, index) => (
            <button key={promotion.id} type="button" onClick={() => setActive(index)} aria-label={`${index + 1}번 배너: ${promotion.title}`} aria-current={index === active ? "true" : undefined} className={`h-1.5 rounded-full transition-all ${index === active ? "w-6 bg-[#171717]" : "w-1.5 bg-[#cfd2c9]"}`} />
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-[#555751]">
          <span className="mr-2 tabular-nums">{active + 1} / {promotions.length}</span>
          <button type="button" onClick={() => move(-1)} aria-label="이전 배너" className="grid h-7 w-7 place-items-center rounded-full border border-[#e5e7e1]">‹</button>
          <button type="button" onClick={() => move(1)} aria-label="다음 배너" className="grid h-7 w-7 place-items-center rounded-full border border-[#e5e7e1]">›</button>
        </div>
      </div>
    </div>
  );
}
