'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { errorMessage, fetchReviewArtworks } from '@/lib/api';
import { isAdminSession, reviewPage } from '@/lib/admin-review';
import { useAuth } from '@/lib/auth';
import { formatWon } from '@/lib/format';
import ReviewArtworkImage from '@/components/ReviewArtworkImage';
import type { Artwork, PageResponse } from '@/types';

export default function AdminArtworkList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = reviewPage(searchParams.get('page'));
  const { member, accessToken } = useAuth();
  const memberId = member?.id;
  const [result, setResult] = useState<PageResponse<Artwork> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const current = () => active && isAdminSession(memberId, accessToken);
    setLoading(true);
    setError(null);
    setResult(null);
    setDenied(false);
    fetchReviewArtworks(page)
      .then((latest) => {
        if (!current()) return;
        if (page > 0 && latest.content.length === 0) {
          router.replace(
            `/admin/artworks?page=${Math.max(0, Math.min(page - 1, latest.totalPages - 1))}`,
          );
          return;
        }
        setResult(latest);
      })
      .catch((cause: unknown) => {
        if (!current()) return;
        const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
        setDenied(status === 401 || status === 403);
        setError(
          status === 401 || status === 403
            ? '조회 권한이 없거나 재로그인이 필요합니다.'
            : errorMessage(cause, '심사 대기 작품을 불러오지 못했습니다. 다시 시도해 주세요.'),
        );
      })
      .finally(() => {
        if (current()) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, attempt, memberId, accessToken, router]);

  return (
    <div className="min-h-screen bg-white px-5 pb-10 pt-6 text-[#171717]">
      <Link
        href="/mypage"
        className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[#73756f]"
      >
        ‹ 마이페이지
      </Link>
      <h1 className="mt-3 text-[24px] font-extrabold">작품 심사 관리</h1>
      <p className="mt-2 text-[13px] text-[#73756f]">심사 대기 작품을 확인하고 검토해 주세요.</p>
      {loading && (
        <p role="status" className="mt-8 rounded-[12px] bg-[#f7f8f4] p-4 text-[13px]">
          심사 대기 작품을 불러오는 중...
        </p>
      )}
      {error && (
        <div className="mt-8">
          <p role="alert" className="text-[13px] text-[#c13b32]">
            {error}
          </p>
          {denied ? (
            <Link
              href="/login"
              className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold underline"
            >
              다시 로그인
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 min-h-11 text-[13px] font-bold underline"
            >
              다시 불러오기
            </button>
          )}
        </div>
      )}
      {!loading && result && (
        <>
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-[17px] font-bold">
              심사 대기 <span className="text-[#73756f]">{result.totalElements}건</span>
            </h2>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="min-h-11 text-[13px] font-semibold underline"
            >
              새로고침
            </button>
          </div>
          {result.content.length === 0 ? (
            <p className="mt-4 rounded-[12px] bg-[#f7f8f4] p-5 text-[14px]">
              심사 대기 작품이 없습니다.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {result.content.map((artwork) => (
                <li key={artwork.id}>
                  <Link
                    href={`/admin/artworks/${artwork.id}?page=${page}`}
                    className="flex gap-4 rounded-[12px] border border-[#dfe0da] p-3"
                  >
                    <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[#f7f8f4]">
                      <ReviewArtworkImage
                        key={artwork.imageUrl}
                        url={artwork.imageUrl}
                        title={artwork.title}
                      />
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="text-[11px] font-bold text-[#437020]">심사 대기</p>
                      <h3 className="mt-1 break-words text-[15px] font-bold">{artwork.title}</h3>
                      <p className="mt-1 break-words text-[12px] text-[#73756f]">
                        {artwork.artistName || '작가 미등록'}
                      </p>
                      <p className="mt-2 text-[13px]">{formatWon(artwork.startPrice)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {result.totalPages > 0 && (
            <nav
              aria-label="심사 목록 페이지"
              className="mt-6 flex items-center justify-between gap-2"
            >
              <button
                type="button"
                disabled={page === 0}
                onClick={() => router.push(`/admin/artworks?page=${page - 1}`)}
                className="min-h-11 rounded-[8px] border border-[#dfe0da] px-4 text-[13px] disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-[13px]">
                {page + 1} / {result.totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= result.totalPages}
                onClick={() => router.push(`/admin/artworks?page=${page + 1}`)}
                className="min-h-11 rounded-[8px] border border-[#dfe0da] px-4 text-[13px] disabled:opacity-40"
              >
                다음
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
