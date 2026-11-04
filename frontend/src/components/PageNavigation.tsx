import Link from 'next/link';
import type { PageResponse } from '@/types';

export default function PageNavigation({
  page,
  path,
  category,
}: {
  page: PageResponse<unknown>;
  path: string;
  category?: string;
}) {
  if (page.totalPages === 0) return null;
  const href = (index: number) => {
    const query = new URLSearchParams({ page: String(index), size: String(page.size) });
    if (category) query.set('category', category);
    return `${path}?${query}`;
  };
  return (
    <nav
      aria-label="목록 페이지"
      className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm"
    >
      {page.page > 0 && (
        <Link className="btn-outline" href={href(page.page - 1)}>
          이전 페이지
        </Link>
      )}
      <span>
        {page.page + 1} 페이지 · 총 {page.totalPages} 페이지 / {page.totalElements}점
      </span>
      {page.page + 1 < page.totalPages && (
        <Link className="btn-outline" href={href(page.page + 1)}>
          다음 페이지
        </Link>
      )}
      {page.page >= page.totalPages && page.page > 0 && (
        <Link className="underline" href={href(0)}>
          첫 페이지로
        </Link>
      )}
    </nav>
  );
}
