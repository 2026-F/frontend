import Link from "next/link";
import { getLots } from "@/lib/lots";
import { MOCK_LOTS } from "@/lib/mock";
import { formatWon } from "@/lib/format";

export default async function LivePage() {
  const lots = await getLots();
  const showcase = lots.length ? lots : MOCK_LOTS;
  const featured = showcase[0] ?? MOCK_LOTS[0];

  return (
    <div className="min-h-screen bg-white px-[18px] py-5 text-[#171717]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[25px] font-black tracking-[-0.05em]">LIVE</h1>
          <p className="mt-1 text-[13px] font-semibold">지금 진행 중인 경매를 만나보세요.</p>
        </div>
        <span className="rounded-full bg-[#fff0ef] px-2.5 py-1 text-[10px] font-bold text-[#ff4038]">ON AIR</span>
      </div>

      <Link href={`/auctions/${featured.auction.id}/watch`} className="mt-5 block overflow-hidden rounded-[12px] bg-[#e5e5e5]">
        <div className="flex h-10 items-center gap-2 bg-[#d5d5d5] px-3 text-[10px] text-[#5f605b]">
          <span className="rounded bg-[#ff4038] px-2 py-1 font-extrabold text-white">LIVE</span>
          {Math.max(featured.viewerCount, 128)}명 시청 중
        </div>
        <div className="relative h-[330px]">
          {featured.artwork.imageUrl && <img src={featured.artwork.imageUrl} alt={featured.artwork.title} className="h-full w-full object-cover" />}
          <div className="absolute inset-x-3 bottom-3 rounded-[8px] bg-white p-3">
            <p className="text-[14px] font-extrabold">{featured.artwork.title}</p>
            <p className="mt-1 text-[10px] text-[#74756f]">{featured.artistName}</p>
            <p className="mt-1 text-[17px] font-black text-[#ff4038]">{formatWon(featured.auction.currentPrice)}~</p>
          </div>
        </div>
        <div className="bg-[#ff3832] px-4 py-3 text-white">
          <p className="text-[16px] font-extrabold">2026 K-루키 컬렉션</p>
          <p className="mt-1 text-[10px]">현재 Lot 03/12 · 지금 입찰 가능</p>
        </div>
      </Link>

      <h2 className="mt-8 text-[19px] font-extrabold">곧 시작하는 라이브</h2>
      <div className="mt-3 space-y-3">
        {showcase.slice(1, 4).map((lot, index) => (
          <Link key={lot.artwork.id} href={`/auctions/${lot.auction.id}/watch`} className="flex h-[88px] items-center gap-3 rounded-[9px] bg-[#f3f3f3] p-2">
            <div className="h-[72px] w-[78px] overflow-hidden rounded-[5px] bg-[#dcdcdc]">
              {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div>
              <p className="text-[12px] font-extrabold">{lot.artwork.title}</p>
              <p className="mt-1 text-[10px] text-[#777873]">{index + 1}시간 후 시작</p>
              <p className="mt-2 text-[10px] font-semibold">알림 받기</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
