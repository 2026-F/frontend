import { fetchArtworkPage, fetchAuction } from '@/lib/api';
import type { Artwork, ArtworkStatus, Auction } from '@/types';

type AuctionLookup =
  | { auctionStatus: 'none' | 'failed'; auction: null }
  | { auctionStatus: 'loaded'; auction: Auction };

export type AdminRow = { artwork: Artwork } & AuctionLookup;

export async function fetchAdminRow(artwork: Artwork, signal?: AbortSignal): Promise<AdminRow> {
  if (artwork.auctionId == null) return { artwork, auctionStatus: 'none', auction: null };

  try {
    const auction = await fetchAuction(artwork.auctionId, signal);
    if (auction.id === artwork.auctionId && auction.artworkId === artwork.id) {
      return { artwork, auctionStatus: 'loaded', auction };
    }
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  return { artwork, auctionStatus: 'failed', auction: null };
}

export async function fetchAllArtworksByStatus(status: ArtworkStatus, signal: AbortSignal): Promise<Artwork[]> {
  const query = { status, size: 100, sort: 'latest' } as const;
  const first = await fetchArtworkPage({ ...query, page: 0 }, signal);
  const artworks = [...first.content];

  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await fetchArtworkPage({ ...query, page }, signal);
    artworks.push(...next.content);
  }

  return artworks;
}
