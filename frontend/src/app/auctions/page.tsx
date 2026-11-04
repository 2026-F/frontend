import { getLots } from '@/lib/lots';
import { pageParams } from '@/lib/catalogDisplay';
import { requestFailure } from '@/lib/requestFailure';
import AuctionListClient from '@/components/AuctionListClient';
import PageNavigation from '@/components/PageNavigation';
import DataNotice from '@/components/DataNotice';
export const dynamic = 'force-dynamic';
export default async function AuctionsPage({
  searchParams,
}: {
  searchParams?: { page?: string; size?: string };
}) {
  let page;
  try {
    page = await getLots(pageParams(searchParams));
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
      {page.content.some((item) => item.auctionError) && (
        <DataNotice message="일부 경매 정보를 불러오지 못했습니다. 다시 시도해 주세요." />
      )}
      <AuctionListClient lots={page.content} />
      <PageNavigation page={page} path="/auctions" />
    </div>
  );
}
