import Link from "next/link";
import { getLots } from "@/lib/lots";
import { MOCK_LOTS } from "@/lib/mock";
import { formatWon } from "@/lib/format";
import type { Lot } from "@/types";

const CATEGORY_TABS = ["회화", "조각", "공예", "사진"];
const PLACEHOLDERS = ["bg-[#f4cee0]", "bg-[#d8e2ff]", "bg-[#d9e9d4]"];

function withShowcaseLots(lots: Lot[]) {
  const seen = new Set(lots.map((lot) => lot.artwork.id));
  return [...lots, ...MOCK_LOTS.filter((lot) => !seen.has(lot.artwork.id))].slice(0, 6);
}

function SectionHeader({ title, href = "/auctions" }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[21px] font-extrabold tracking-[-0.04em] text-[#171717]">{title}</h2>
      <Link href={href} className="text-[11px] font-medium text-[#8b8c87]">더 보기 ›</Link>
    </div>
  );
}

function ArtworkTile({ lot, index }: { lot: Lot; index: number }) {
  const image = lot.artwork.imageUrl ?? lot.images[0];
  return (
    <Link href={`/artworks/${lot.artwork.id}?auctionId=${lot.auction.id}`} className="w-[150px] shrink-0">
      <div className={`h-[150px] overflow-hidden rounded-[6px] ${PLACEHOLDERS[index % PLACEHOLDERS.length]}`}>
        {image && <img src={image} alt={lot.artwork.title} className="h-full w-full object-cover" />}
      </div>
      <h3 className="mt-2 truncate text-[13px] font-bold tracking-[-0.03em]">{lot.artwork.title}</h3>
      <p className="mt-0.5 truncate text-[10px] text-[#777873]">{lot.artistName}, 2026</p>
      <p className="mt-1 text-[12px] font-bold">현재가 {formatWon(lot.auction.currentPrice)}</p>
    </Link>
  );
}

function WeeklyAuctionCard({ lot }: { lot: Lot }) {
  return (
    <Link href={`/artworks/${lot.artwork.id}?auctionId=${lot.auction.id}`} className="mt-2.5 flex h-[88px] items-center gap-3 rounded-[9px] bg-[#f3f3f3] p-2">
      <div className="h-[72px] w-[78px] shrink-0 overflow-hidden rounded-[5px] bg-[linear-gradient(135deg,#c9ff55,#eaff83)]">
        {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-extrabold">2026 가을 온라인 경매</p>
        <p className="mt-2 text-[10px] text-[#74756f]">진행 중 · 24개 작품</p>
        <p className="mt-2 text-[10px] font-semibold">경매 목록 보기</p>
      </div>
    </Link>
  );
}

function LiveShowcase({ lot }: { lot: Lot }) {
  return (
    <section className="px-[18px] pb-10 pt-5">
      <SectionHeader title="LIVE" href="/live" />
      <p className="mt-2 text-[16px] font-bold tracking-[-0.03em]">지금 놓치지 마세요!</p>
      <div className="mt-3 flex gap-3">
        <Link href={`/auctions/${lot.auction.id}/watch`} className="relative h-[430px] min-w-0 flex-1 overflow-hidden rounded-[10px] bg-[#e5e5e5]">
          <div className="flex h-9 items-center gap-2 bg-[#d6d6d6] px-3 text-[10px] text-[#62635f]">
            <span className="rounded bg-[#ff4038] px-2 py-1 text-[12px] font-extrabold text-white">LIVE</span>
            {Math.max(lot.viewerCount, 128)}명 시청
          </div>
          {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt={lot.artwork.title} className="h-[325px] w-full object-cover opacity-90" />}
          <div className="absolute inset-x-3 bottom-[74px] flex items-center gap-2 rounded-[7px] bg-white p-2">
            <div className="h-12 w-14 shrink-0 bg-[#d9d9d9]" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold">{lot.artwork.title}</p>
              <p className="text-[9px] text-[#777873]">{lot.artistName}, 2026</p>
              <p className="text-[14px] font-extrabold text-[#ff4038]">{formatWon(lot.auction.currentPrice)}~</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[66px] bg-[#ff3832] px-3 py-2.5 text-white">
            <p className="text-[15px] font-extrabold">2026 K-루키 컬렉션</p>
            <p className="mt-1 text-[10px]">현재 Lot 03/12 · 지금 입찰 가능</p>
          </div>
        </Link>
        <div className="flex w-[80px] shrink-0 flex-col gap-3">
          {["LIVE", "LIVE", "예정"].map((label, index) => (
            <Link key={`${label}-${index}`} href="/live" className={`flex h-[101px] items-end rounded-[9px] bg-[#dddddd] p-3 text-[10px] font-bold ${index === 0 ? "border-[3px] border-[#ff4038] text-[#ff4038]" : "text-[#555651]"}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      <h3 className="mt-6 text-[18px] font-extrabold">곧 시작하는 라이브</h3>
    </section>
  );
}

export default async function HomePage() {
  const lots = withShowcaseLots(await getLots());
  const weeklyLot = lots[0] ?? MOCK_LOTS[0];

  return (
    <div className="bg-white text-[#171717]">
      <section className="px-[18px] pt-5">
        <Link href="/auctions" className="flex h-[144px] flex-col justify-center rounded-[10px] bg-[#a8ff00] px-5">
          <p className="text-[11px] font-medium text-[#5d8e00]">새로운 컬렉터를 위한 첫 경매</p>
          <p className="mt-2 text-[22px] font-black tracking-[-0.04em]">WEEKLY AUCTION</p>
        </Link>

        <div className="mt-3 grid grid-cols-4 gap-3">
          {CATEGORY_TABS.map((category) => (
            <Link key={category} href={`/auctions?category=${encodeURIComponent(category)}`} className="flex h-[43px] items-center justify-center rounded-full bg-[#f3f3f3] text-[12px] font-medium text-[#454641]">
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <div className="px-[18px]"><SectionHeader title="김그림 님을 위한 추상화 컬렉션" /></div>
        <div className="scrollbar-hide mt-3 flex gap-4 overflow-x-auto px-[18px] pb-1">
          {lots.slice(0, 4).map((lot, index) => <ArtworkTile key={lot.artwork.id} lot={lot} index={index} />)}
        </div>
      </section>

      <section className="px-[18px] pt-8">
        <SectionHeader title="WEEKLY AUCTION" />
        <p className="mt-1 text-[11px] font-semibold text-[#ff5a64]">06일 23:59 후 종료</p>
        <WeeklyAuctionCard lot={weeklyLot} />
      </section>

      <LiveShowcase lot={weeklyLot} />
    </div>
  );
}
