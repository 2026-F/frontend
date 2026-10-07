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
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body className="min-h-screen bg-[#f2f2f0] font-sans antialiased">
        <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-white shadow-[0_0_18px_rgba(0,0,0,0.05)]">
          <Header />
          <main className="min-h-screen pb-[62px]">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
