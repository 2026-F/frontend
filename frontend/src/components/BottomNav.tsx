"use client";
// 하단 탭바 자체가 "지금 이 경로가 맞나?"를 브라우저에서 판단해야 해서 클라이언트 컴포넌트로 만듦.

import Link from "next/link";
import { usePathname } from "next/navigation";

// 지금은 auctionId/artworkId를 1로 고정해뒀어 — 경매 목록/작품 목록 화면이 아직 없어서야.
// 나중에 목록 화면이 생기면 "선택된 경매/작품 ID"를 여기로 넘기도록 바꾸면 돼.
const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/auctions/1/watch", label: "라이브", icon: "🔴" },
  { href: "/artworks/1/viewer", label: "3D 뷰어", icon: "🧊" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // fixed + bottom-0: 화면 맨 아래에 항상 고정. z-50: 다른 요소들 위에 오도록.
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          // 지금 보고 있는 페이지 경로랑 탭의 href가 같으면 활성 탭으로 표시
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                active ? "text-brand font-semibold" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}