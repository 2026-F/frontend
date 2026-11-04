import Link from 'next/link';
import { notFound } from 'next/navigation';
import DataNotice from '@/components/DataNotice';
import { getPromotion, PROMOTIONS } from '@/lib/promotions';

export function generateStaticParams() {
  return PROMOTIONS.map((promotion) => ({ id: promotion.id }));
}

export default function PromotionPage({ params }: { params: { id: string } }) {
  const promotion = getPromotion(params.id);
  if (!promotion) notFound();

  return (
    <article className="bg-white pb-12 text-[#171717]">
      <div className="relative h-[285px] overflow-hidden bg-[#171717] text-white">
        <img src={promotion.imageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />
        <div className="absolute inset-x-5 bottom-7">
          <p className="text-[11px] font-bold tracking-[0.15em] text-[#c8f887]">
            {promotion.artworkIds.length === 0 ? "기획전 준비 중" : promotion.eyebrow}
          </p>
          <h1 className="mt-3 break-keep text-[29px] font-black leading-tight tracking-[-0.055em]">
            {promotion.title}
          </h1>
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
          <h2 className="text-xl font-bold">함께 보는 작품</h2>
          <DataNotice
            message="출품 작품 연결은 준비 중입니다. 배너와 소개는 기획 콘텐츠이며 현재 판매 상태를 의미하지 않습니다."
            retry={false}
          />
        </section>

        <section className="border-t border-[#e8e9e4] py-9">
          <h2 className="text-[20px] font-extrabold tracking-[-0.04em]">이어서 둘러보기</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#73756f]">
            관심 있는 작품의 상세 정보와 진행 상태를 확인해 보세요.
          </p>
          <Link
            href="/categories"
            className="mt-5 block rounded-full bg-[#171717] px-5 py-3.5 text-center text-sm font-bold text-white"
          >
            현재 등록된 작품 보기
          </Link>
          <button disabled className="mt-3 w-full rounded-full border px-5 py-3 text-sm">
            프로모션 출품 연결 준비 중
          </button>
        </section>
      </div>
    </article>
  );
}
