import Link from "next/link";
import { MOCK_LIVE_EVENT, MOCK_LIVE_LOTS } from "@/lib/mock";

export default function LivePage() {
  const featured = MOCK_LIVE_LOTS.find((lot) => lot.artwork.id === MOCK_LIVE_EVENT.currentLotId);

  return (
    <div className="min-h-screen bg-white px-5 py-5 text-[#171717]">
      <h1 className="text-[25px] font-black tracking-[-0.05em]">LIVE</h1>
      <p className="mt-1 text-[13px] font-semibold">작품이 순서대로 진행되는 라이브 경매</p>
      {featured && (
        <Link href={`/live/${MOCK_LIVE_EVENT.id}`} className="mt-6 block overflow-hidden rounded-[18px] bg-[#171717] text-white">
          <div className="relative h-[260px] bg-[#e8e9e4]">
            {featured.artwork.imageUrl && <img src={featured.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
            <span className="absolute left-4 top-4 rounded-full bg-[#ff483f] px-3 py-1.5 text-[11px] font-extrabold">LIVE</span>
          </div>
          <div className="p-5">
            <h2 className="text-[20px] font-extrabold">{MOCK_LIVE_EVENT.title}</h2>
            <p className="mt-2 text-xs text-white/70">현재 Lot {MOCK_LIVE_EVENT.lotIds.indexOf(featured.artwork.id) + 1}/{MOCK_LIVE_EVENT.lotIds.length}</p>
            <p className="mt-4 text-xs font-bold text-[#b8f53d]">방송과 작품 목록 보기 ↗</p>
          </div>
        </Link>
      )}
    </div>
  );
}
