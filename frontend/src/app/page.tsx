import Link from 'next/link';
import { getLots } from '@/lib/lots';
import AuctionCard from '@/components/AuctionCard';
import DataNotice from '@/components/DataNotice';
import { requestFailure } from '@/lib/requestFailure';
import { AUCTION_CATEGORIES, CATEGORY_LABELS } from '@/lib/categories';

import { PROMOTIONS } from '@/lib/promotions';
import PromotionCarousel from '@/components/PromotionCarousel';
import type { CatalogItem } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let lots: CatalogItem[] = [];
  let failure: string | null = null;
  try {
    lots = (await getLots()).content;
  } catch (error) {
    failure = requestFailure(error);
  }
  return (
    <div className="bg-white pb-12 text-[#171717]">
      <section className="px-5 pt-5" aria-label="프로모션">
        <PromotionCarousel promotions={PROMOTIONS} />
      </section>

      <section className="px-5 pt-9" aria-label="작품 카테고리">
        <h2 className="text-[19px] font-extrabold tracking-[-0.04em]">취향으로 찾기</h2>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {AUCTION_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/categories?category=${category}`}
              className="flex min-h-11 items-center justify-center rounded-full border border-[#dfe2d8] bg-[#f7f8f4] px-1 text-xs font-semibold text-[#454641]"
            >
              {CATEGORY_LABELS[category]}
            </Link>
          ))}
        </div>
      </section>

      {
        <section className="pt-9" aria-label="위클리 경매 작품">
          <div className="flex items-end justify-between px-5">
            <h2 className="text-[19px] font-extrabold tracking-[-0.04em]">이번 주의 작품</h2>
            <Link
              href="/auctions"
              className="text-xs font-semibold text-[#666862] underline underline-offset-4"
            >
              전체 보기
            </Link>
          </div>
          {failure ? (
            <div className="px-5">
              <DataNotice message={failure} />
            </div>
          ) : lots.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#73756f]">아직 등록된 작품이 없습니다.</p>
          ) : null}
          {lots.some((item) => item.auctionError) && (
            <div className="px-5">
              <DataNotice message="일부 경매 정보를 불러오지 못했습니다." />
            </div>
          )}
          <div className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto px-5 pb-1">
            {lots.map((lot) => (
              <div key={lot.artwork.id} className="w-[152px] shrink-0">
                <AuctionCard lot={lot} />
              </div>
            ))}
          </div>
        </section>
      }

      <section className="px-5 pt-10" aria-label="라이브 경매 방송">
        <h2 className="text-[19px] font-extrabold">라이브 경매</h2>
        <DataNotice
          message="라이브 편성 안내는 준비 중입니다. 개별 경매의 방송 정보는 해당 경매에서 확인해 주세요."
          retry={false}
        />
      </section>
    </div>
  );
}
