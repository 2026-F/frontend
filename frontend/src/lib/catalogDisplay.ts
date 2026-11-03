import type { Artwork, Auction, CatalogItem } from '@/types';

export function priceOf(artwork: Pick<Artwork, 'startPrice'>, auction: Auction | null) {
  if (!auction) return { label: '시작가', value: artwork.startPrice };
  if (auction.status === 'CLOSED') return { label: '최종 표시가', value: auction.currentPrice };
  if (auction.status === 'ONGOING' || auction.status === 'EXTENDED')
    return { label: '현재가', value: auction.currentPrice };
  return { label: '시작가', value: auction.startPrice };
}

export function itemHref(item: CatalogItem) {
  return item.auction ? `/auctions/${item.auction.id}` : `/artworks/${item.artwork.id}`;
}

export function pageParams(params?: { page?: string; size?: string }) {
  const page = Number(params?.page ?? 0);
  const size = Number(params?.size ?? 20);
  return {
    page: Number.isSafeInteger(page) && page >= 0 ? page : 0,
    size: Number.isSafeInteger(size) && size > 0 ? Math.min(size, 100) : 20,
  };
}
