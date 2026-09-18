import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Artbid",
  description: "작품 위탁·경매 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      {/* pb-16: 하단바(대략 64px)에 콘텐츠가 가려지지 않도록 본문 아래에 여백을 줌 */}
      <body className="min-h-screen antialiased pb-16">
        <header className="border-b border-gray-200 px-6 py-4">
          <span className="font-semibold">Artbid</span>
        </header>
        <main className="px-6 py-8">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}