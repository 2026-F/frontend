import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen antialiased">
        <header className="border-b border-gray-200 px-6 py-4">
          <span className="font-semibold">Artbid</span>
        </header>
        <main className="px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
