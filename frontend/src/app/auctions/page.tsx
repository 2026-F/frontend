import { getLots } from "@/lib/lots";
import AuctionListClient from "@/components/AuctionListClient";

export default async function AuctionsPage() {
  const lots = await getLots();

  return (
    <div className="container-page flex flex-col gap-6 py-5">
      <div>
        <h1 className="text-[25px] font-black tracking-[-0.05em] text-[#171717]">AUCTION</h1>
        <p className="mt-1 text-[13px] font-semibold text-[#171717]">
          진행 중인 경매와 예정 작품을 확인하세요.
        </p>
      </div>
      <AuctionListClient lots={lots} />
    </div>
  );
}
