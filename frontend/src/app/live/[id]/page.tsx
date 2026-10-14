import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_LIVE_EVENT, MOCK_LIVE_LOTS } from "@/lib/mock";
import { formatWon } from "@/lib/format";

export default async function LiveEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (Number(id) !== MOCK_LIVE_EVENT.id) notFound();

  const lots = MOCK_LIVE_EVENT.lotIds
    .map((lotId) => MOCK_LIVE_LOTS.find((lot) => lot.artwork.id === lotId))
    .filter((lot): lot is (typeof MOCK_LIVE_LOTS)[number] => Boolean(lot));
  const currentIndex = lots.findIndex((lot) => lot.artwork.id === MOCK_LIVE_EVENT.currentLotId);
  const current = lots[currentIndex];

  return (
    <div className="bg-white px-5 pb-10 pt-5 text-[#171717]">
      <Link href="/live" className="text-xs font-semibold text-[#73756f]">← 라이브 경매</Link>
      <div className="mt-5 flex items-center gap-2">
        <span className="rounded-full bg-[#ff483f] px-3 py-1 text-[11px] font-extrabold text-white">LIVE</span>
        <span className="text-xs text-[#73756f]">{MOCK_LIVE_EVENT.viewerCount}명 시청 중</span>
      </div>
      <h1 className="mt-3 text-[25px] font-black tracking-[-0.05em]">{MOCK_LIVE_EVENT.title}</h1>
      <p className="mt-1 text-[13px] text-[#73756f]">{lots.length}점의 작품이 차례로 진행됩니다.</p>

      {current && (
        <div className="mt-6 overflow-hidden rounded-[16px] bg-[#171717] text-white">
          <div className="h-[280px] bg-[#e8e9e4]">
            {current.artwork.imageUrl && <img src={current.artwork.imageUrl} alt={current.artwork.title} className="h-full w-full object-cover" />}
          </div>
          <div className="p-5">
            <p className="text-xs font-bold text-[#b8f53d]">지금 진행 중 · Lot {currentIndex + 1}/{lots.length}</p>
            <h2 className="mt-2 text-[19px] font-extrabold">{current.artwork.title}</h2>
            <p className="mt-1 text-xs text-white/70">{current.artistName}</p>
            <p className="mt-3 text-sm font-bold">현재가 {formatWon(current.auction.currentPrice)}</p>
            <Link href={`/auctions/${current.auction.id}`} className="mt-4 block rounded-full bg-[#b8f53d] py-3 text-center text-sm font-extrabold text-[#171717]">현재 작품 입찰 보기 ↗</Link>
          </div>
        </div>
      )}

      <h2 className="mt-8 text-[19px] font-extrabold">이번 방송의 작품</h2>
      <ol className="mt-4 space-y-3">
        {lots.map((lot, index) => {
          const isCurrent = index === currentIndex;
          const label = index < currentIndex ? "진행 완료" : isCurrent ? "진행 중" : "다음 작품";
          return (
            <li key={lot.artwork.id} className={`flex gap-3 rounded-[12px] border p-2 ${isCurrent ? "border-[#171717] bg-[#171717] text-white" : "border-[#ebede7] bg-white text-[#171717]"}`}>
              <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[8px] bg-[#e8e9e4]">
                {lot.artwork.imageUrl && <img src={lot.artwork.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1 py-1">
                <p className={`text-[11px] font-bold ${isCurrent ? "text-[#b8f53d]" : "text-[#73756f]"}`}>Lot {String(index + 1).padStart(2, "0")} · {label}</p>
                <p className="mt-1 truncate text-[13px] font-bold">{lot.artwork.title}</p>
                <p className={`mt-1 text-[11px] ${isCurrent ? "text-white/70" : "text-[#73756f]"}`}>{lot.artistName}</p>
                {isCurrent && <Link href={`/auctions/${lot.auction.id}`} className="mt-1 inline-block text-[11px] font-bold text-[#b8f53d] underline underline-offset-2">입찰 보기</Link>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
