import { fetchArtworkPage } from '@/lib/api';
import type { Artwork, ArtworkStatus } from '@/types';

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
