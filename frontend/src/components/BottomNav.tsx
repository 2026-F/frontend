"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M4.5 10.5 12 4l7.5 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-4v-5h-4v5H6a1.5 1.5 0 0 1-1.5-1.5z" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function AuctionIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="m9 6 6 6m-8.5-3.5 5-5m1 11 5-5M4 20h10" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="m8 5 2-2 8 8-2 2z" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function LiveIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <rect x="3" y="5" width="18" height="14" rx="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      <path d="m10 9 5 3-5 3z" fill={active ? "white" : "currentColor"} />
    </svg>
  );
}

function MyIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <circle cx="12" cy="8" r="3.2" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "HOME", Icon: HomeIcon },
  { href: "/auctions", label: "AUCTION", Icon: AuctionIcon },
  { href: "/live", label: "LIVE", Icon: LiveIcon },
  { href: "/mypage", label: "MY", Icon: MyIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 border-t border-[#dededb] bg-white" aria-label="주요 메뉴">
      <div className="grid h-[62px] grid-cols-4 px-3">
        {TABS.map(({ href, label, Icon }) => {
          const active = label === "HOME"
            ? pathname === "/"
            : label === "AUCTION"
              ? pathname.startsWith("/auctions") || pathname.startsWith("/artworks")
              : pathname.startsWith(href);

          return (
            <Link key={href} href={href} className={`relative flex flex-col items-center justify-center gap-1 text-[8px] font-semibold tracking-[0.08em] ${active ? "text-[#111111]" : "text-[#777873]"}`}>
              <Icon active={active} />
              <span>{label}</span>
              {active && <span className="absolute bottom-0 h-[2px] w-7 rounded-full bg-[#a8ff00]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
