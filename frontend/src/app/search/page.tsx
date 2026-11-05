import { getLots } from '@/lib/lots';
import { pageParams } from '@/lib/catalogDisplay';
import { requestFailure } from '@/lib/requestFailure';
import AuctionCard from '@/components/AuctionCard';
import PageNavigation from '@/components/PageNavigation';
import DataNotice from '@/components/DataNotice';
export const dynamic = 'force-dynamic';

// 작품 목록 API(GET /api/artworks)의 keyword로 검색한다. 공개 상태 작품만 나온다.
export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string; size?: string };
}) {
  const keyword = searchParams?.q?.trim() ?? '';
  let page;
  let failure;
  if (keyword) {
    try {
      page = await getLots({ ...pageParams(searchParams), keyword });
    } catch (error) {
      failure = requestFailure(error);
    }
  }

  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <form
        action="/search"
        role="search"
        className="flex h-12 items-center gap-3 rounded-[12px] border border-[#e8e9e4] bg-[#f7f8f4] px-4"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-[#73756f]">
          <circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="m15.5 15.5 4.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={keyword}
          aria-label="검색어"
          placeholder="작품명, 작가명으로 검색"
          maxLength={100}
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9b9d95]"
        />
      </form>

      <section className="mt-9">
        {!keyword ? (
          <p className="py-16 text-center text-[14px] text-[#73756f]">
            찾고 싶은 작품이나 작가를 검색해 보세요
          </p>
        ) : (
          <>
            <h2 className="text-[18px] font-bold tracking-[-0.04em]">
              &lsquo;{keyword}&rsquo; 검색 결과
            </h2>
            {failure && <DataNotice message={failure} />}
            {page &&
              (page.content.length ? (
                <>
                  {page.content.some((item) => item.auctionError) && (
                    <DataNotice message="일부 경매 정보를 불러오지 못했습니다." />
                  )}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {page.content.map((lot) => (
                      <AuctionCard key={lot.artwork.id} lot={lot} />
                    ))}
                  </div>
                  <PageNavigation page={page} path="/search" keyword={keyword} />
                </>
              ) : (
                <DataNotice message="검색 결과가 없습니다." retry={false} />
              ))}
          </>
        )}
      </section>
    </div>
  );
}
