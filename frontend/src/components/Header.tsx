"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isAuctionDetail = pathname.startsWith("/artworks/");

  if (isAuctionDetail) {
    return (
      <header className="sticky top-0 z-40 shrink-0 border-b border-[#efefeb] bg-white">
        <div className="relative flex h-[52px] items-center justify-between px-4 text-[#111111]">
          <Link href="/auctions" aria-label="경매 목록으로 돌아가기" className="-ml-1 grid h-9 w-9 place-items-center">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold tracking-[-0.02em]">위클리 경매</h1>
          <button type="button" aria-label="더보기" className="-mr-1 grid h-9 w-9 place-items-center">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><circle cx="5" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="19" cy="12" r="1.3" fill="currentColor" /></svg>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8e8e5] bg-white/95 backdrop-blur">
      <div className="flex h-[58px] items-center justify-between px-[18px] text-[#171717]">
        <Link href="/" className="text-[25px] font-extrabold tracking-[-0.055em]">ArtBid</Link>
        <div className="flex items-center gap-2">
          <Link href="/auctions" aria-label="검색" className="grid h-9 w-9 place-items-center">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10.8" cy="10.8" r="6.3" />
              <path d="m15.5 15.5 4.3 4.3" />
            </svg>
          </Link>
          <Link href="/mypage" aria-label="알림" className="grid h-9 w-9 place-items-center">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
              <path d="M10 21h4" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
