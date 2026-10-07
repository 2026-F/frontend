import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

// Pretendard는 next/font로 감싸지 않고 CDN <link>로 불러옵니다. 빌드 타임에 폰트를
// 받아오는 next/font/google 방식은 네트워크가 막힌 환경(사내망 등)에서 build 자체가
// 실패할 수 있어서, 브라우저에서 불러오는 방식을 씁니다. 폰트를 못 받아와도 빌드는
// 항상 성공하고, tailwind.config.ts의 시스템 폰트로 자연스럽게 대체됩니다.

export const metadata: Metadata = {
  title: "Artbid — 실시간 온라인 미술품 경매",
  description:
    "위탁 작품을 프리뷰로 감상하고, 라이브 스트리밍과 3D로 살펴본 뒤 실시간으로 입찰하는 웹앱입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      {/*
        PWA(모바일 웹앱) 컨셉: 브라우저 창 크기와 무관하게 항상 "스마트폰 화면" 안에서
        돌아가야 함. sm(640px) 이상 데스크톱에서는 실제 폰처럼 보이는 프레임(베젤 + 노치 +
        상태바 + 홈 인디케이터)을 그려주고, 실제 스마트폰(<640px)에서는 그 장식을 다 지우고
        화면을 꽉 채움 — 진짜 폰에서는 이미 진짜 상태바가 있으니까.
      */}
      <body className="h-full overflow-hidden bg-[#b2b2b2] font-sans antialiased sm:flex sm:items-center sm:justify-center">
        <div className="relative mx-auto h-full w-full max-w-[414px] sm:my-6 sm:h-[min(868px,calc(100vh-3rem))] sm:rounded-[3rem] sm:bg-[#090909] sm:p-3 sm:shadow-2xl sm:ring-1 sm:ring-black/60">
          {/* 측면 버튼 장식 (볼륨/전원) — 데스크톱 프레임에서만 보임 */}
          <span className="pointer-events-none absolute -left-[3px] top-28 hidden h-8 w-[3px] rounded-l bg-ink-700 sm:block" />
          <span className="pointer-events-none absolute -left-[3px] top-40 hidden h-14 w-[3px] rounded-l bg-ink-700 sm:block" />
          <span className="pointer-events-none absolute -right-[3px] top-32 hidden h-16 w-[3px] rounded-r bg-ink-700 sm:block" />

          <div className="relative flex h-full w-full flex-col overflow-y-auto bg-white sm:rounded-[2.25rem]">
            {/* 상태바 + 노치 (데스크톱 프레임 장식용, 실제 폰에선 숨김) */}
            <div className="sticky top-0 z-50 hidden shrink-0 bg-white sm:block">
              <div className="relative flex items-center justify-between px-6 pb-1 pt-2 text-[11px] font-semibold text-[#111111]">
                <span>9:41</span>
                <div className="absolute left-1/2 top-1.5 h-4 w-24 -translate-x-1/2 rounded-full bg-ink-950" />
                <span className="flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px]">
                    <span className="h-1 w-[3px] rounded-sm bg-[#111111]" />
                    <span className="h-1.5 w-[3px] rounded-sm bg-[#111111]" />
                    <span className="h-2 w-[3px] rounded-sm bg-[#111111]" />
                    <span className="h-2.5 w-[3px] rounded-sm bg-[#111111]" />
                  </span>
                  <span className="relative h-3 w-6 rounded-[3px] border border-[#111111]/80">
                    <span className="absolute inset-y-[1.5px] left-[1.5px] w-4 rounded-[1px] bg-[#111111]" />
                    <span className="absolute -right-[3px] top-1/2 h-1.5 w-[2px] -translate-y-1/2 rounded-r-sm bg-[#111111]/80" />
                  </span>
                </span>
              </div>
            </div>

            <Header />
            <main className="flex-1">{children}</main>
            <BottomNav />

            {/* 홈 인디케이터 바 (데스크톱 프레임 장식용) */}
            <div className="sticky bottom-0 z-50 hidden justify-center bg-white pb-1.5 pt-1 sm:flex">
              <div className="h-1 w-28 rounded-full bg-[#111111]" />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
