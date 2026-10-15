import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_LIVE_EVENT, MOCK_LOTS } from "@/lib/mock";
import { getPromotion, PROMOTIONS } from "@/lib/promotions";
import { formatWon } from "@/lib/format";

export function generateStaticParams() {
  return PROMOTIONS.map((promotion) => ({ id: promotion.id }));
}

export default function PromotionPage({ params }: { params: { id: string } }) {
  const promotion = getPromotion(params.id);
  if (!promotion) notFound();

  const artworks = promotion.artworkIds
    .map((id) => MOCK_LOTS.find((lot) => lot.artwork.id === id))
    .filter((lot): lot is (typeof MOCK_LOTS)[number] => Boolean(lot));

  return (
    <article className="bg-white pb-12 text-[#171717]">
      <div className="relative h-[285px] overflow-hidden bg-[#171717] text-white">
        <img src={promotion.imageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />
        <div className="absolute inset-x-5 bottom-7">
          <p className="text-[11px] font-bold tracking-[0.15em] text-[#c8f887]">{promotion.eyebrow}</p>
          <h1 className="mt-3 break-keep text-[29px] font-black leading-tight tracking-[-0.055em]">{promotion.title}</h1>
          <p className="mt-2 text-sm text-white/85">{promotion.subtitle}</p>
        </div>
      </div>

      <div className="px-5">
        <section className="py-10">
          <span className="text-[11px] font-bold tracking-[0.12em] text-[#637e27]">THE STORY</span>
          <h2 className="mt-2 text-[21px] font-extrabold tracking-[-0.04em]">{promotion.title}</h2>
          <p className="mt-4 break-keep text-[14px] leading-7 text-[#555751]">{promotion.intro}</p>
        </section>

        <section className="border-t border-[#e8e9e4] py-9" aria-label="프로모션 작품">
          <div className="flex items-end justify-between">
            <h2 className="text-[20px] font-extrabold tracking-[-0.04em]">함께 보는 작품</h2>
            <span className="text-xs font-semibold text-[#73756f]">{artworks.length}점</span>
          </div>
          <div className="mt-5 space-y-5">
            {artworks.map((lot, index) => {
              const href = lot.saleType === "LIVE" ? `/live/${MOCK_LIVE_EVENT.id}` : `/auctions/${lot.auction.id}`;
              return (
                <Link key={lot.artwork.id} href={href} className="block overflow-hidden rounded-[16px] border border-[#e8e9e4]">
                  <div className="relative h-[215px] bg-[#f0f1ed]">
                    {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#73756f]">{lot.artistName}</p>
                    <h3 className="mt-1 text-[17px] font-extrabold tracking-[-0.035em]">{lot.artwork.title}</h3>
                    <div className="mt-3 flex items-center justify-between border-t border-[#ebede7] pt-3 text-xs">
                      <span className="font-semibold text-[#555751]">{lot.saleType === "LIVE" ? "라이브 출품작" : `시작가 ${formatWon(lot.auction.startPrice)}`}</span>
                      <span className="font-bold">{lot.saleType === "LIVE" ? "방송 보기 ↗" : "경매 보기 ↗"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-[#e8e9e4] py-9">
          <h2 className="text-[20px] font-extrabold tracking-[-0.04em]">이어서 둘러보기</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#73756f]">관심 있는 작품의 상세 정보와 진행 상태를 확인해 보세요.</p>
          <Link href={promotion.primaryLink.href} className="mt-5 block rounded-full bg-[#171717] px-5 py-3.5 text-center text-sm font-bold text-white">{promotion.primaryLink.label} ↗</Link>
          {promotion.secondaryLink && <Link href={promotion.secondaryLink.href} className="mt-3 block rounded-full border border-[#dfe2d8] px-5 py-3.5 text-center text-sm font-bold">{promotion.secondaryLink.label}</Link>}
        </section>
      </div>
    </article>
  );
}
