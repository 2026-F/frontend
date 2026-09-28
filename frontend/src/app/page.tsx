import Link from "next/link";
import { getLots } from "@/lib/lots";
import type { Lot } from "@/types";
import AuctionCard from "@/components/AuctionCard";

export default async function HomePage() {
  const lots = await getLots();
  const ongoing = lots.filter((l) => l.auction.status === "ONGOING" || l.auction.status === "EXTENDED");
  const preview = lots.filter((l) => l.auction.status === "PREVIEW" || l.auction.status === "SCHEDULED");
  const closed = lots.filter((l) => l.auction.status === "CLOSED");

  return (
    <div className="container-page flex flex-col gap-10 py-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-900 p-6">
        <p className="eyebrow">Live Online Art Auction</p>
        <h1 className="font-display text-2xl font-semibold leading-tight text-cream">
          보고, 감상하고, 입찰하는 순간까지 — <span className="bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent">하나의 웹앱</span>에서
        </h1>
        <p className="text-sm text-ink-200">
          작가와 소규모 갤러리의 위탁 작품을 프리뷰 기간 동안 라이브 스트리밍과 3D로 감상하고, 마감
          임박 시 자동으로 30초씩 연장되는 안티 스나이핑 규칙 아래 실시간으로 입찰하세요.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/auctions" className="btn-primary">
            진행 중인 경매 보기
          </Link>
          <Link href="#preview" className="btn-outline">
            프리뷰 둘러보기
          </Link>
        </div>
      </section>

      <LotSection
        title="지금 입찰 가능"
        description="마감이 얼마 남지 않은 진행 중인 경매입니다."
        lots={ongoing}
      />
      <LotSection
        id="preview"
        title="프리뷰 중"
        description="사전 관람 기간이며, 경매는 아직 시작 전입니다."
        lots={preview}
      />
      <LotSection title="낙찰 기록" description="최근 마감된 경매입니다." lots={closed} />
    </div>
  );
}

function LotSection({
  id,
  title,
  description,
  lots,
}: {
  id?: string;
  title: string;
  description: string;
  lots: Lot[];
}) {
  if (lots.length === 0) return null;

  return (
    <section id={id} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-cream">{title}</h2>
        <p className="mt-1 text-xs text-ink-300">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {lots.map((lot) => (
          <AuctionCard key={lot.artwork.id} lot={lot} />
        ))}
      </div>
    </section>
  );
}
