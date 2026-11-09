import { getLots } from '@/lib/lots';
import { pageParams } from '@/lib/catalogDisplay';
import { requestFailure } from '@/lib/requestFailure';
import AuctionListClient from '@/components/AuctionListClient';
import DataNotice from '@/components/DataNotice';
export const dynamic = 'force-dynamic';
export default async function AuctionsPage({
  searchParams,
}: {
  searchParams?: { page?: string; size?: string };
}) {
  const query = pageParams(searchParams);
  let page;
  try {
    page = await getLots(query);
  } catch (error) {
    return (
      <div className="container-page py-5">
        <h1>WEEKLY AUCTION</h1>
        <DataNotice message={requestFailure(error)} />
      </div>
    );
  }
  return (
    <div className="container-page flex flex-col gap-6 py-5">
      <div>
        <h1 className="text-[25px] font-black">WEEKLY AUCTION</h1>
        <p className="mt-1 text-sm">진행 중인 경매와 예정 작품을 확인하세요.</p>
      </div>
      <AuctionListClient key={`${query.page}-${query.size}`} initialPage={page} />
    </div>
  );
}
