'use client';

import axios from 'axios';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, fetchArtworkDetail, reviewArtwork } from '@/lib/api';
import { artworkStatusLabel, isAdminSession, reviewPage, safeHttpUrl } from '@/lib/admin-review';
import { useAuth } from '@/lib/auth';
import { formatWon } from '@/lib/format';
import ReviewArtworkImage from '@/components/ReviewArtworkImage';
import type { ArtworkCategory, ArtworkDetail } from '@/types';

const categories: Record<ArtworkCategory, string> = {
  PAINTING: '회화',
  DRAWING: '드로잉',
  PRINT: '판화',
  PHOTOGRAPHY: '사진',
  SCULPTURE: '조각',
  CRAFT: '공예',
  MIXED_MEDIA: '혼합 매체',
  DIGITAL: '디지털',
  OTHER: '기타',
};
const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '미등록' : date.toLocaleString('ko-KR');
};

export default function AdminArtworkDetail({
  artworkId,
  originPage,
}: {
  artworkId: number;
  originPage: string | null;
}) {
  const { member, accessToken } = useAuth();
  const memberId = member?.id;
  const page = reviewPage(originPage);
  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [denied, setDenied] = useState(false);
  const [requiresSync, setRequiresSync] = useState(false);
  const [confirmation, setConfirmation] = useState<'approve' | 'reject' | null>(null);
  const mounted = useRef(false);
  const readSequence = useRef(0);
  const writePending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const current = useCallback(
    () => mounted.current && isAdminSession(memberId, accessToken),
    [memberId, accessToken],
  );

  const load = useCallback(async () => {
    const sequence = ++readSequence.current;
    if (!Number.isSafeInteger(artworkId) || artworkId <= 0) {
      setMissing(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const latest = await fetchArtworkDetail(artworkId);
      if (!current() || sequence !== readSequence.current) return;
      setArtwork(latest);
      setMissing(false);
      setDenied(false);
      setRequiresSync(false);
    } catch (cause) {
      if (!current() || sequence !== readSequence.current) return;
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setMissing(status === 404);
      setDenied(status === 401 || status === 403);
      setRequiresSync(true);
      setError(
        status === 404
          ? '작품을 찾을 수 없습니다.'
          : status === 401 || status === 403
            ? '조회 권한이 없거나 재로그인이 필요합니다.'
            : errorMessage(cause, '작품 정보를 불러오지 못했습니다. 다시 시도해 주세요.'),
      );
    } finally {
      if (current() && sequence === readSequence.current) setLoading(false);
    }
  }, [artworkId, current]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      readSequence.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!confirmation || !dialog.current) return;
    const element = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    cancelButton.current?.focus();
    return () => {
      element.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [confirmation]);

  const submit = async () => {
    if (
      !confirmation ||
      !artwork ||
      artwork.status !== 'PENDING_REVIEW' ||
      loading ||
      denied ||
      requiresSync ||
      writePending.current ||
      !accessToken ||
      !current()
    )
      return;
    const action = confirmation;
    writePending.current = true;
    setSaving(true);
    setError(null);
    setNotice(null);
    setRequiresSync(true);
    try {
      await reviewArtwork(artworkId, action, accessToken);
      if (!current()) return;
      setConfirmation(null);
      setNotice(
        action === 'approve'
          ? '작품을 승인했습니다. 최신 상태를 확인합니다.'
          : '작품을 반려했습니다. 최신 상태를 확인합니다.',
      );
      await load();
    } catch (cause) {
      if (!current()) return;
      setConfirmation(null);
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      if (status === 409) {
        setNotice('이미 처리되었거나 현재 상태에서는 심사할 수 없습니다. 최신 상태를 확인합니다.');
        await load();
      } else {
        setDenied(status === 401 || status === 403);
        setError(
          status === 401 || status === 403
            ? '처리 권한이 없거나 재로그인이 필요합니다.'
            : !axios.isAxiosError(cause) || !cause.response
              ? '처리 결과를 확인하지 못했습니다. 다시 제출하기 전에 최신 상태를 확인해 주세요.'
              : errorMessage(cause, '작품을 처리하지 못했습니다. 최신 상태를 확인해 주세요.'),
        );
      }
    } finally {
      writePending.current = false;
      if (current()) setSaving(false);
    }
  };

  const photos =
    artwork?.media
      .filter((item) => item.mediaType === 'PHOTO' && safeHttpUrl(item.url))
      .sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const primaryImage = safeHttpUrl(artwork?.imageUrl) ?? photos[0]?.url ?? null;
  const extraPhotos = photos.filter((item) => item.url !== primaryImage);
  const attachments =
    artwork?.media.filter(
      (item) => item.mediaType !== 'PHOTO' && safeHttpUrl(item.url || item.sourceUrl),
    ) ?? [];
  const certificate = safeHttpUrl(artwork?.certificateUrl);
  const disabled =
    loading || saving || denied || missing || requiresSync || artwork?.status !== 'PENDING_REVIEW';

  return (
    <div className="min-h-screen bg-white px-5 pb-10 pt-6 text-[#171717]">
      <Link
        href={`/admin/artworks?page=${page}`}
        className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[#73756f]"
      >
        ‹ 심사 대기 목록
      </Link>
      <h1 className="mt-3 text-[24px] font-extrabold">작품 심사 상세</h1>
      {notice && (
        <p
          role="status"
          className="mt-5 rounded-[10px] bg-[#f0f8e4] p-4 text-[13px] text-[#437020]"
        >
          {notice}
        </p>
      )}
      {loading && (
        <p role="status" className="mt-5 text-[13px] text-[#73756f]">
          작품 정보를 불러오는 중...
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 text-[13px] text-[#c13b32]">
          {error}
        </p>
      )}
      {!loading &&
        !missing &&
        (error || requiresSync) &&
        (denied ? (
          <Link
            href="/login"
            className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold underline"
          >
            다시 로그인
          </Link>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => void load()}
            className="mt-3 min-h-11 text-[13px] font-bold underline disabled:opacity-50"
          >
            {artwork ? '최신 상태 확인' : '다시 불러오기'}
          </button>
        ))}
      {missing && !error && (
        <p role="alert" className="mt-8 text-[14px]">
          올바른 작품 주소가 아닙니다.
        </p>
      )}
      {artwork && !missing && (
        <>
          <section className="mt-6" aria-labelledby="review-artwork-title">
            <p className="text-[12px] font-bold text-[#437020]">
              {artworkStatusLabel[artwork.status]}
            </p>
            <h2 id="review-artwork-title" className="mt-2 break-words text-[21px] font-extrabold">
              {artwork.title}
            </h2>
            <p className="mt-2 text-[13px] text-[#73756f]">
              {artwork.artist?.name || '작가 미등록'}
            </p>
            <div className="mt-5 grid aspect-square place-items-center overflow-hidden rounded-[12px] bg-[#f7f8f4]">
              <ReviewArtworkImage key={primaryImage} url={primaryImage} title={artwork.title} />
            </div>
            {extraPhotos.length > 0 && (
              <ul aria-label="추가 작품 사진" className="mt-3 grid grid-cols-2 gap-3">
                {extraPhotos.map((photo) => (
                  <li
                    key={photo.id}
                    className="grid aspect-square place-items-center overflow-hidden rounded-[8px] bg-[#f7f8f4]"
                  >
                    <ReviewArtworkImage
                      key={photo.url}
                      url={photo.url}
                      title={`${artwork.title} 추가 사진`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="mt-8" aria-labelledby="review-information-heading">
            <h2 id="review-information-heading" className="text-[17px] font-bold">
              제출 정보
            </h2>
            <dl className="mt-4 divide-y divide-[#efefeb] text-[13px]">
              {[
                ['작품 ID', artwork.id],
                ['위탁자 ID', artwork.consignorId ?? '미등록'],
                ['작가', artwork.artist?.name || '미등록'],
                ['카테고리', artwork.category ? categories[artwork.category] : '미등록'],
                ['재료', artwork.medium || '미등록'],
                [
                  '크기',
                  [
                    ['가로', artwork.widthCm],
                    ['세로', artwork.heightCm],
                    ['깊이', artwork.depthCm],
                  ]
                    .filter(([, value]) => value !== null)
                    .map(([label, value]) => `${label} ${value}cm`)
                    .join(' × ') || '미등록',
                ],
                ['제작 연도', artwork.productionYear ?? '미등록'],
                ['시작가', formatWon(artwork.startPrice)],
                [
                  '추정가',
                  artwork.estimatedPrice == null ? '미등록' : formatWon(artwork.estimatedPrice),
                ],
                ['등록일', dateLabel(artwork.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 py-3">
                  <dt className="w-20 shrink-0 text-[#73756f]">{label}</dt>
                  <dd className="min-w-0 flex-1 break-words">{value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-5 text-[13px] font-bold">작품 설명</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6">
              {artwork.description || '미등록'}
            </p>
            <h3 className="mt-5 text-[13px] font-bold">보증서</h3>
            {certificate ? (
              <a
                href={certificate}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-[13px] font-bold underline"
              >
                보증서 열기 (새 창)
              </a>
            ) : (
              <p className="mt-2 text-[13px] text-[#73756f]">
                {artwork.certificateUrl ? '열 수 없는 보증서 주소입니다.' : '미등록'}
              </p>
            )}
            {attachments.length > 0 && (
              <ul className="mt-3">
                {attachments.map((item) => (
                  <li key={item.id}>
                    <a
                      href={safeHttpUrl(item.url || item.sourceUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-[13px] font-bold underline"
                    >
                      {item.mediaType === 'VIDEO' ? '영상' : '3D 파일'} 열기 (새 창)
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label="심사 처리" className="mt-8 border-t border-[#dfe0da] pt-6">
            {artwork.status !== 'PENDING_REVIEW' && (
              <p className="mb-4 text-[13px] text-[#73756f]">
                현재 {artworkStatusLabel[artwork.status]} 상태로 승인·반려할 수 없습니다.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setConfirmation('reject')}
                className="h-12 flex-1 rounded-[8px] border border-[#c13b32] text-[14px] font-bold text-[#c13b32] disabled:opacity-40"
              >
                반려
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setConfirmation('approve')}
                className="h-12 flex-1 rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold disabled:opacity-40"
              >
                승인
              </button>
            </div>
          </section>
        </>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="review-confirm-heading"
        aria-describedby="review-confirm-description"
        onCancel={(event) => {
          event.preventDefault();
          if (!saving) setConfirmation(null);
        }}
        className="fixed inset-0 m-auto w-[calc(100%-40px)] max-w-[350px] rounded-[16px] bg-white p-5 text-[#171717] shadow-xl backdrop:bg-black/40"
      >
        <h2 id="review-confirm-heading" className="text-[18px] font-extrabold">
          작품을 {confirmation === 'approve' ? '승인' : '반려'}할까요?
        </h2>
        <p className="mt-4 break-words text-[14px] font-bold">{artwork?.title}</p>
        <p id="review-confirm-description" className="mt-2 text-[13px] leading-6 text-[#73756f]">
          {confirmation === 'approve'
            ? '승인하면 프리뷰 상태로 공개됩니다. 경매가 바로 시작되지는 않습니다.'
            : '반려하면 대기 목록에서 제외됩니다. 현재 화면에서는 반려를 되돌릴 수 없습니다.'}
        </p>
        <div className="mt-6 flex gap-2">
          <button
            ref={cancelButton}
            type="button"
            disabled={saving}
            onClick={() => setConfirmation(null)}
            className="h-12 flex-1 rounded-[8px] border border-[#dfe0da] text-[13px] font-bold disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className={`h-12 flex-1 rounded-[8px] text-[13px] font-bold disabled:opacity-50 ${confirmation === 'approve' ? 'bg-[#a8ff00]' : 'bg-[#c13b32] text-white'}`}
          >
            {saving ? '처리 중...' : confirmation === 'approve' ? '승인 확정' : '반려 확정'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
