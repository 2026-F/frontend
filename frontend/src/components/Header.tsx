import Link from "next/link";

// 폰 프레임 안 상단 앱바. 네비게이션은 전부 BottomNav가 담당하므로 여기는 로고 + 상태만.
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-900/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-cream">
          ART<span className="bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent">BID</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          LIVE
        </div>
      </div>
    </header>
  );
}
