import Link from "next/link";
import { AUCTION_CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import { MOCK_LIVE_EVENT, MOCK_LOTS } from "@/lib/mock";
import { formatWon } from "@/lib/format";
import type { ArtworkCategory } from "@/types";

type SearchParams = { category?: string };

export default function CategoriesPage({ searchParams }: { searchParams?: SearchParams }) {
  const requested = searchParams?.category;
  const category = AUCTION_CATEGORIES.includes(requested as ArtworkCategory) ? requested as ArtworkCategory : undefined;
  const artworks = MOCK_LOTS.filter((lot) => {
    const displayCategory = lot.artwork.category === "MIXED_MEDIA" ? "PAINTING" : lot.artwork.category;
    return !category || displayCategory === category;
  });

  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <p className="text-[11px] font-bold tracking-[0.14em] text-[#637e27]">DISCOVER ART</p>
      <h1 className="mt-2 text-[26px] font-black tracking-[-0.05em]">카테고리 탐색</h1>
      <p className="mt-2 text-[13px] leading-5 text-[#73756f]">관심 있는 분야에서 작품을 찾아보세요.</p>

      <nav aria-label="작품 카테고리" className="mt-6 flex flex-wrap gap-2">
        <Link href="/categories" aria-current={!category ? "page" : undefined} className={`rounded-full px-3 py-2 text-xs font-semibold ${!category ? "bg-[#171717] text-[#b8f53d]" : "bg-[#f1f2ee] text-[#555751]"}`}>전체</Link>
        {AUCTION_CATEGORIES.map((item) => (
          <Link key={item} href={`/categories?category=${item}`} aria-current={category === item ? "page" : undefined} className={`rounded-full px-3 py-2 text-xs font-semibold ${category === item ? "bg-[#171717] text-[#b8f53d]" : "bg-[#f1f2ee] text-[#555751]"}`}>
            {CATEGORY_LABELS[item]}
          </Link>
        ))}
      </nav>

      <div className="mt-8 flex items-end justify-between">
        <h2 className="text-[19px] font-extrabold tracking-[-0.04em]">{category ? CATEGORY_LABELS[category] : "전체 작품"}</h2>
        <span className="text-xs text-[#73756f]">{artworks.length}점</span>
      </div>

      {artworks.length === 0 ? (
        <div className="mt-5 rounded-[16px] bg-[#f7f8f4] px-5 py-14 text-center text-sm text-[#73756f]">아직 등록된 작품이 없습니다.</div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {artworks.map((lot) => (
            <Link key={lot.artwork.id} href={lot.saleType === "LIVE" ? `/live/${MOCK_LIVE_EVENT.id}` : `/auctions/${lot.auction.id}`} className="overflow-hidden rounded-[14px] border border-[#e8e9e4]">
              <div className="aspect-[4/5] bg-[#f0f1ed]">
                {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <p className="text-[10px] font-bold text-[#637e27]">{lot.saleType === "LIVE" ? "라이브" : "위클리"}</p>
                <p className="mt-2 truncate text-[11px] text-[#73756f]">{lot.artistName}</p>
                <h3 className="mt-1 truncate text-[13px] font-bold">{lot.artwork.title}</h3>
                <p className="mt-2 text-[11px] font-semibold text-[#555751]">시작가 {formatWon(lot.auction.startPrice)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
