import Link from "next/link";
import { getLots } from "@/lib/lots";
import { MOCK_LOTS } from "@/lib/mock";
import { formatWon } from "@/lib/format";
import NotifyButton from "@/components/NotifyButton";

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
      </div>

      <Link href={`/auctions/${featured.auction.id}/watch`} className="mt-5 block overflow-hidden rounded-[12px] bg-[#e8e9e4]">
        <div className="flex h-10 items-center gap-2 bg-[#171717] px-3 text-[10px] text-[#d7d9d2]">
          <span className="rounded bg-[#ff4038] px-2 py-1 font-extrabold text-white">LIVE</span>
          {Math.max(featured.viewerCount, 128)}명 시청 중
        </div>
        <div className="relative h-[330px]">
          {featured.artwork.imageUrl && <img src={featured.artwork.imageUrl} alt={featured.artwork.title} className="h-full w-full object-cover" />}
          <div className="absolute inset-x-3 bottom-3 rounded-[8px] bg-[#f7f8f4] p-3">
            <p className="text-[14px] font-extrabold">{featured.artwork.title}</p>
            <p className="mt-1 text-[10px] text-[#73756f]">{featured.artistName}</p>
            <p className="mt-1 text-[17px] font-black text-[#171717]">{formatWon(featured.auction.currentPrice)}~</p>
          </div>
        </div>
        <div className="bg-[#171717] px-4 py-3 text-white">
          <p className="text-[16px] font-extrabold text-[#b8f53d]">2026 K-루키 컬렉션</p>
          <p className="mt-1 text-[10px]">현재 Lot 03/12 · 지금 입찰 가능</p>
        </div>
      </Link>

      <h2 className="mt-8 text-[19px] font-extrabold">곧 시작하는 라이브</h2>
      <div className="mt-3 space-y-3">
        {showcase.slice(1, 4).map((lot, index) => (
          <div key={lot.artwork.id} className="flex h-[88px] items-center gap-3 rounded-[9px] bg-[#f7f8f4] p-2">
            <Link href={`/auctions/${lot.auction.id}/watch`} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-[72px] w-[78px] shrink-0 overflow-hidden rounded-[5px] bg-[#e8e9e4]">
                {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-extrabold">{lot.artwork.title}</p>
                <p className="mt-1 text-[10px] text-[#73756f]">{index + 1}시간 후 시작</p>
              </div>
            </Link>
            <NotifyButton artworkTitle={lot.artwork.title} />
          </div>
        ))}
      </div>
    </div>
  );
}
