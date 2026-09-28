import { getLots } from "@/lib/lots";
import AuctionListClient from "@/components/AuctionListClient";

export default async function AuctionsPage() {
  const lots = await getLots();

  return (
    <div className="container-page flex flex-col gap-6 py-6">
      <div>
        <p className="eyebrow">Auctions</p>
        <h1 className="font-display text-2xl font-semibold text-cream">경매 목록</h1>
      </div>
      <AuctionListClient lots={lots} />
    </div>
  );
}
