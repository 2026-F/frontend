import Link from "next/link";
import { getLots } from "@/lib/lots";
import { MOCK_LIVE_EVENT, MOCK_LIVE_LOTS } from "@/lib/mock";
import { AUCTION_CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import { formatWon } from "@/lib/format";
import { PROMOTIONS } from "@/lib/promotions";
import PromotionCarousel from "@/components/PromotionCarousel";
import type { Lot } from "@/types";

export const dynamic = "force-dynamic";

const isBidding = (lot: Lot) => lot.auction.status === "ONGOING" || lot.auction.status === "EXTENDED";

function WeeklyArtworkCard({ lot }: { lot: Lot }) {
  return (
    <Link href={`/auctions/${lot.auction.id}`} className="w-[152px] shrink-0" aria-label={`${lot.artwork.title} 경매 보기`}>
      <div className="aspect-[4/5] overflow-hidden rounded-[14px] bg-[#f0f1ed]">
        {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <p className="mt-3 truncate text-xs text-[#777971]">{lot.artistName}</p>
      <h3 className="mt-1 truncate text-[15px] font-bold tracking-[-0.035em]">{lot.artwork.title}</h3>
      <p className="mt-1 text-xs font-semibold text-[#555751]">{isBidding(lot) ? "현재가" : "시작가"} {formatWon(isBidding(lot) ? lot.auction.currentPrice : lot.auction.startPrice)}</p>
    </Link>
  );
}

export default async function HomePage() {
  const lots = (await getLots()).filter((lot) => lot.auction.status !== "CLOSED");
  const liveLots = MOCK_LIVE_EVENT.lotIds
    .map((id) => MOCK_LIVE_LOTS.find((lot) => lot.artwork.id === id))
    .filter((lot): lot is (typeof MOCK_LIVE_LOTS)[number] => Boolean(lot));
  const liveFeatured = liveLots.find((lot) => lot.artwork.id === MOCK_LIVE_EVENT.currentLotId) ?? liveLots[0];

  return (
    <div className="bg-white pb-12 text-[#171717]">
      <section className="px-5 pt-5" aria-label="프로모션">
        <PromotionCarousel promotions={PROMOTIONS} />
      </section>

        <section className="px-5 pt-9" aria-label="작품 카테고리">
          <h2 className="text-[19px] font-extrabold tracking-[-0.04em]">취향으로 찾기</h2>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {AUCTION_CATEGORIES.map((category) => (
              <Link key={category} href={`/categories?category=${category}`} className="flex min-h-11 items-center justify-center rounded-full border border-[#dfe2d8] bg-[#f7f8f4] px-1 text-xs font-semibold text-[#454641]">
                {CATEGORY_LABELS[category]}
              </Link>
            ))}
          </div>
        </section>

      {lots.length > 0 && (
        <section className="pt-9" aria-label="위클리 경매 작품">
          <div className="flex items-end justify-between px-5">
            <h2 className="text-[19px] font-extrabold tracking-[-0.04em]">이번 주의 작품</h2>
            <Link href="/auctions" className="text-xs font-semibold text-[#666862] underline underline-offset-4">전체 보기</Link>
          </div>
          <div className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto px-5 pb-1">
            {lots.map((lot) => <WeeklyArtworkCard key={lot.artwork.id} lot={lot} />)}
          </div>
        </section>
      )}

      {liveFeatured && (
        <section className="px-5 pt-10" aria-label="라이브 경매 방송">
          <h2 className="text-[19px] font-extrabold tracking-[-0.04em]">라이브 경매</h2>
          <Link href={`/live/${MOCK_LIVE_EVENT.id}`} className="mt-4 flex overflow-hidden rounded-[16px] bg-[#191c18] text-white">
            <div className="h-[132px] w-[116px] shrink-0 bg-[#343a30]">
              {liveFeatured.artwork.imageUrl && <img src={liveFeatured.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="relative flex min-w-0 flex-1 flex-col justify-center px-4 py-3 pr-11">
              <span className="self-start rounded-full bg-[#ff483f] px-2 py-1 text-[10px] font-extrabold">LIVE</span>
              <h3 className="mt-2 truncate text-[15px] font-bold">{MOCK_LIVE_EVENT.title}</h3>
              <p className="mt-1 text-[11px] text-white/70">현재 Lot {liveLots.indexOf(liveFeatured) + 1}/{liveLots.length}</p>
              <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[#b8f53d] text-lg font-bold text-[#171717]" aria-hidden="true">→</span>
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}
