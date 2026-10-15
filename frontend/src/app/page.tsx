import Link from 'next/link';
import { getLots } from '@/lib/lots';
import { MOCK_LOTS } from '@/lib/mock';
import { formatWon } from '@/lib/format';
import type { Lot } from '@/types';

const CATEGORY_TABS = ['회화', '조각', '공예', '사진'];
const PLACEHOLDERS = ['bg-[#f4cee0]', 'bg-[#d8e2ff]', 'bg-[#d9e9d4]'];

function withShowcaseLots(lots: Lot[]) {
  const seen = new Set(lots.map((lot) => lot.artwork.id));
  return [...lots, ...MOCK_LOTS.filter((lot) => !seen.has(lot.artwork.id))].slice(0, 6);
}

function SectionHeader({ title, href = '/auctions' }: { title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="min-w-0 text-[22px] font-extrabold leading-tight tracking-[-0.045em] text-[#171717]">
        {title}
      </h2>
      <Link
        href={href}
        className="shrink-0 pb-0.5 text-xs font-semibold text-[#666862] underline decoration-[#b7b9b2] underline-offset-4"
      >
        더 보기
      </Link>
    </div>
  );
}

function ArtworkTile({ lot, index }: { lot: Lot; index: number }) {
  const image = lot.artwork.imageUrl ?? lot.images[0];
  return (
    <Link
      href={`/artworks/${lot.artwork.id}?auctionId=${lot.auction.id}`}
      className="group w-[158px] shrink-0"
      aria-label={`${lot.artwork.title} 작품 보기`}
    >
      <div
        className={`aspect-[4/5] overflow-hidden rounded-[14px] ${PLACEHOLDERS[index % PLACEHOLDERS.length]}`}
      >
        {image && (
          <img
            src={image}
            alt={lot.artwork.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <p className="mt-3 truncate text-xs font-medium text-[#73756f]">{lot.artistName}, 2026</p>
      <h3 className="mt-1 truncate text-[15px] font-bold tracking-[-0.035em] text-[#171717]">
        {lot.artwork.title}
      </h3>
      <p className="mt-2 text-xs font-semibold text-[#555751]">
        현재가{' '}
        <strong className="ml-1 text-[14px] font-extrabold text-[#171717]">
          {formatWon(lot.auction.currentPrice)}
        </strong>
      </p>
    </Link>
  );
}

function WeeklyAuctionCard({ lot }: { lot: Lot }) {
  return (
    <Link
      href={`/artworks/${lot.artwork.id}?auctionId=${lot.auction.id}`}
      className="mt-4 flex min-h-[112px] items-center gap-4 rounded-[16px] border border-[#e8e9e4] bg-[#f7f8f4] p-3 transition-colors hover:bg-[#f0f2ea]"
    >
      <div className="h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[11px] bg-[linear-gradient(135deg,#c9ff55,#eaff83)]">
        {lot.artwork.imageUrl && (
          <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-extrabold tracking-[-0.03em]">
          2026 가을 온라인 경매
        </p>
        <p className="mt-2 text-xs text-[#73756f]">진행 중 · 24개 작품</p>
        <p className="mt-3 text-xs font-bold text-[#171717]">
          경매 목록 보기 <span aria-hidden="true">↗</span>
        </p>
      </div>
    </Link>
  );
}

function LiveShowcase({ lot }: { lot: Lot }) {
  return (
    <section className="px-5 pb-12 pt-5">
      <SectionHeader title="LIVE" href="/live" />
      <p className="mt-2 text-[13px] text-[#666862]">지금 놓치지 마세요!</p>
      <Link
        href={`/auctions/${lot.auction.id}/watch`}
        className="mt-5 block overflow-hidden rounded-[18px] bg-[#171717] text-white"
      >
        <div className="relative h-[280px] overflow-hidden bg-[#dcded9]">
          {lot.artwork.imageUrl && (
            <img
              src={lot.artwork.imageUrl}
              alt={lot.artwork.title}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/55 to-transparent px-4 pb-8 pt-4">
            <span className="rounded-full bg-[#ff453e] px-3 py-1 text-[11px] font-extrabold tracking-[0.08em]">
              ● LIVE
            </span>
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold">
              {Math.max(lot.viewerCount, 128)}명 시청
            </span>
          </div>
        </div>
        <div className="px-4 pb-5 pt-4">
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#baff36]">
            2026 K-루키 컬렉션
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[18px] font-extrabold tracking-[-0.04em]">
                {lot.artwork.title}
              </h3>
              <p className="mt-1 text-xs text-[#bfc1bb]">{lot.artistName}, 2026</p>
            </div>
            <span className="shrink-0 text-[15px] font-extrabold text-[#baff36]">
              {formatWon(lot.auction.currentPrice)}~
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[11px] text-[#d7d9d2]">
            <span>현재 Lot 03/12 · 지금 입찰 가능</span>
            <span className="font-bold text-white">시청하기 ↗</span>
          </div>
        </div>
      </Link>
    </section>
  );
}

export default async function HomePage() {
  const lots = withShowcaseLots(await getLots());
  const weeklyLot = lots[0] ?? MOCK_LOTS[0];

  return (
    <div className="bg-white text-[#171717]">
      <section className="px-5 pt-5">
        <Link
          href="/auctions"
          className="relative flex min-h-[176px] flex-col justify-between overflow-hidden rounded-[18px] bg-[#171717] p-5 text-white"
        >
          <div
            className="pointer-events-none absolute -right-9 -top-12 h-52 w-52 rounded-full border-[28px] border-white/10"
            aria-hidden="true"
          />
          <span className="relative self-start rounded-full border border-white/35 px-3 py-1 text-[10px] font-bold tracking-[0.08em]">
            CURATED FOR YOU
          </span>
          <div className="relative flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold">새로운 컬렉터를 위한 첫 경매</p>
              <h1 className="mt-2 text-[29px] font-bold leading-[1.05] tracking-[-0.07em]">
                WEEKLY
                <br />
                AUCTION
              </h1>
            </div>
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#b8f53d] text-xl text-[#171717]"
              aria-hidden="true"
            >
              →
            </span>
          </div>
        </Link>

        <div className="mt-5 grid grid-cols-4 gap-2" aria-label="작품 카테고리">
          {CATEGORY_TABS.map((category) => (
            <Link
              key={category}
              href={`/auctions?category=${encodeURIComponent(category)}`}
              className="flex min-h-11 items-center justify-center rounded-full border border-[#e7e9e2] bg-[#f7f8f4] px-1 text-[12px] font-semibold text-[#454641] transition-colors hover:bg-[#ebeee4]"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="pb-8 pt-9">
        <div className="px-5">
          <SectionHeader title="김그림 님을 위한 추상화 컬렉션" />
        </div>
        <div className="scrollbar-hide mt-5 flex gap-3 overflow-x-auto px-5 pb-1">
          {lots.slice(0, 4).map((lot, index) => (
            <ArtworkTile key={lot.artwork.id} lot={lot} index={index} />
          ))}
        </div>
      </section>

      <section className="px-5 pb-7">
        <SectionHeader title="WEEKLY AUCTION" />
        <p className="mt-2 text-xs font-semibold text-[#566e22]">06일 23:59 후 종료</p>
        <WeeklyAuctionCard lot={weeklyLot} />
      </section>

      <LiveShowcase lot={weeklyLot} />
    </div>
  );
}
