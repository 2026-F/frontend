import Link from 'next/link';
import DataNotice from '@/components/DataNotice';
export default function LivePage() {
  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <p className="text-xs font-bold text-[#637e27]">LIVE AUCTION</p>
      <h1 className="mt-2 text-[26px] font-black">라이브 경매</h1>
      <DataNotice
        message="라이브 편성 안내는 준비 중입니다. 개별 경매의 방송 정보는 해당 경매에서 확인해 주세요."
        retry={false}
      />
      <Link href="/auctions" className="btn-outline">
        경매 둘러보기
      </Link>
    </div>
  );
}
