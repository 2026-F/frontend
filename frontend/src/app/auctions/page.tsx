import { getLots } from "@/lib/lots";
import AuctionListClient from "@/components/AuctionListClient";

// 작품 등록/승인/경매 상태가 실시간으로 바뀌는 페이지라, 빌드 시점 정적 캐싱 없이
// 요청마다 백엔드에서 새로 가져오게 한다 (app/page.tsx 홈과 동일한 패턴).
export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const lots = await getLots();

  return (
    <div className="container-page flex flex-col gap-6 py-5">
      <div>
        <h1 className="text-[25px] font-black tracking-[-0.05em] text-[#171717]">WEEKLY AUCTION</h1>
        <p className="mt-1 text-[13px] font-semibold text-[#171717]">
          진행 중인 경매와 예정 작품을 확인하세요.
        </p>
      </div>
      <AuctionListClient lots={lots} />
    </div>
  );
}
