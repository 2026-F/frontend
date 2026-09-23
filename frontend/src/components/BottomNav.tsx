"use client";
// 하단 탭바. 폰 프레임(overflow-y-auto인 부모) 안에서 sticky로 붙어있어야
// 데스크톱에서 프레임이 둥근 테두리로 잘려도 탭바가 프레임 밖으로 삐져나오지 않음.
// (fixed를 쓰면 브라우저 창 기준으로 고정되어 프레임을 벗어나 버림)

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏛️" },
  { href: "/auctions", label: "경매", icon: "🔨" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-50 border-t border-ink-700 bg-ink-900/95 backdrop-blur">
      <div className="flex">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${
                active ? "font-semibold text-accent-light" : "text-ink-300"
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
