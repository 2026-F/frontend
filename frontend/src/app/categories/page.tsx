import Link from 'next/link';
import { AUCTION_CATEGORIES, CATEGORY_LABELS } from '@/lib/categories';
import { getLots } from '@/lib/lots';
import { pageParams } from '@/lib/catalogDisplay';
import { requestFailure } from '@/lib/requestFailure';
import AuctionCard from '@/components/AuctionCard';
import PageNavigation from '@/components/PageNavigation';
import DataNotice from '@/components/DataNotice';
import type { ArtworkCategory } from '@/types';
export const dynamic = 'force-dynamic';
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: { category?: string; page?: string; size?: string };
}) {
  const category = Object.prototype.hasOwnProperty.call(
    CATEGORY_LABELS,
    searchParams?.category ?? '',
  )
    ? (searchParams?.category as ArtworkCategory)
    : undefined;
  let page;
  let failure;
  try {
    page = await getLots({ ...pageParams(searchParams), category });
  } catch (error) {
    failure = requestFailure(error);
  }
  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <p className="text-xs font-bold text-[#637e27]">DISCOVER ART</p>
      <h1 className="mt-2 text-[26px] font-black">카테고리 탐색</h1>
      <p className="mt-2 text-sm text-[#73756f]">관심 있는 분야에서 작품을 찾아보세요.</p>
      <nav aria-label="작품 카테고리" className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/categories"
          aria-current={!category ? 'page' : undefined}
          className="btn-outline"
        >
          전체
        </Link>
        {AUCTION_CATEGORIES.map((value) => (
          <Link
            key={value}
            href={`/categories?category=${value}`}
            aria-current={category === value ? 'page' : undefined}
            className="btn-outline"
          >
            {CATEGORY_LABELS[value]}
          </Link>
        ))}
      </nav>
      <h2 className="mt-8 text-lg font-bold">
        {category ? CATEGORY_LABELS[category] : '전체 작품'}
      </h2>
      {failure && <DataNotice message={failure} />}
      {page && (
        <>
          {page.content.some((item) => item.auctionError) && (
            <DataNotice message="일부 경매 정보를 불러오지 못했습니다." />
          )}
          {page.content.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {page.content.map((lot) => (
                <AuctionCard key={lot.artwork.id} lot={lot} />
              ))}
            </div>
          ) : (
            <DataNotice message="이 페이지에 등록된 작품이 없습니다." retry={false} />
          )}
          <PageNavigation page={page} path="/categories" category={category} />
        </>
      )}
    </div>
  );
}
