'use client';

import { useId, useState } from 'react';
import { createAuction, errorMessage } from '@/lib/api';
import type { Auction } from '@/types';

// <input type="datetime-local">가 쓰는 "YYYY-MM-DDTHH:mm" 형식으로 바꿔준다 (기본값 채우기용).
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// datetime-local 입력값(초가 없음)을 백엔드가 받는 LocalDateTime 형식으로 보정한다.
// 주의: 서버가 UTC로 돌고 있으면 여기서 입력한 "내 지역 시각" 그대로 저장되기 때문에
// 실제로는 9시간 차이가 날 수 있다 — 화면에서 시간이 이상하게 보이면 9시간을 앞/뒤로 조정해보자.
function toBackendDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

export default function AdminAuctionCreateForm({
  artworkId,
  artworkStartPrice,
  open,
  busy,
  onCancel,
  onBusyChange,
  onError,
  onCreated,
}: {
  artworkId: number;
  artworkStartPrice: number | null | undefined;
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string | null) => void;
  onCreated: (auction: Auction) => void;
}) {
  const fieldId = useId();
  const now = new Date();
  const [startPrice, setStartPrice] = useState(String(artworkStartPrice ?? ''));
  const [minBidUnit, setMinBidUnit] = useState(() =>
    String(Math.max(10_000, Math.round((artworkStartPrice ?? 0) * 0.02))),
  );
  const [previewStart, setPreviewStart] = useState(() => toLocalInputValue(new Date(now.getTime() - 60_000)));
  const [previewEnd, setPreviewEnd] = useState(() => toLocalInputValue(new Date(now.getTime() + 60_000)));
  const [auctionEndAt, setAuctionEndAt] = useState(() => toLocalInputValue(new Date(now.getTime() + 24 * 60 * 60_000)));

  const handleCreateAuction = async () => {
    const parsedStartPrice = Number(startPrice);
    const parsedMinBidUnit = Number(minBidUnit);
    if (!Number.isInteger(parsedStartPrice) || parsedStartPrice <= 0) {
      onError('시작가는 0보다 큰 정수로 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(parsedMinBidUnit) || parsedMinBidUnit <= 0) {
      onError('최소 입찰 단위는 0보다 큰 정수로 입력해 주세요.');
      return;
    }
    if (!previewStart || !previewEnd || !auctionEndAt) {
      onError('프리뷰 시작/종료, 경매 마감 시각을 모두 입력해 주세요.');
      return;
    }
    if (!(previewStart < previewEnd)) {
      onError('프리뷰 시작 시각은 프리뷰 종료 시각보다 빨라야 합니다.');
      return;
    }
    if (auctionEndAt < previewEnd) {
      onError('경매 마감 시각은 프리뷰 종료 시각보다 빠를 수 없습니다.');
      return;
    }

    onError(null);
    onBusyChange(true);
    try {
      const created = await createAuction({
        artworkId,
        startPrice: parsedStartPrice,
        minBidUnit: parsedMinBidUnit,
        previewStart: toBackendDateTime(previewStart),
        previewEnd: toBackendDateTime(previewEnd),
        auctionEndAt: toBackendDateTime(auctionEndAt),
      });
      onCreated(created);
    } catch (cause) {
      onError(errorMessage(cause, '경매 생성에 실패했습니다.'));
    } finally {
      onBusyChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="space-y-3 rounded-[10px] bg-[#f7f8f4] p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${fieldId}-startPrice`} className="block text-[12px] font-semibold">
            시작가(원)
          </label>
          <input
            type="number"
            step="1"
            disabled={busy}
            id={`${fieldId}-startPrice`}
            value={startPrice}
            onChange={(event) => setStartPrice(event.target.value)}
            className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
          />
        </div>
        <div>
          <label htmlFor={`${fieldId}-minBidUnit`} className="block text-[12px] font-semibold">
            최소 입찰 단위
          </label>
          <input
            type="number"
            step="1"
            disabled={busy}
            id={`${fieldId}-minBidUnit`}
            value={minBidUnit}
            onChange={(event) => setMinBidUnit(event.target.value)}
            className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${fieldId}-previewStart`} className="block text-[12px] font-semibold">
          프리뷰 시작
        </label>
        <input
          type="datetime-local"
          disabled={busy}
          id={`${fieldId}-previewStart`}
          value={previewStart}
          onChange={(event) => setPreviewStart(event.target.value)}
          className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
        />
      </div>
      <div>
        <label htmlFor={`${fieldId}-previewEnd`} className="block text-[12px] font-semibold">
          프리뷰 종료 (경매 시작)
        </label>
        <input
          type="datetime-local"
          disabled={busy}
          id={`${fieldId}-previewEnd`}
          value={previewEnd}
          onChange={(event) => setPreviewEnd(event.target.value)}
          className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
        />
      </div>
      <div>
        <label htmlFor={`${fieldId}-auctionEndAt`} className="block text-[12px] font-semibold">
          경매 마감
        </label>
        <input
          type="datetime-local"
          disabled={busy}
          id={`${fieldId}-auctionEndAt`}
          value={auctionEndAt}
          onChange={(event) => setAuctionEndAt(event.target.value)}
          className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
        />
      </div>
      <p className="text-[11px] leading-5 text-[#73756f]">
        서버가 UTC로 동작 중이면 실제로는 9시간 차이가 날 수 있어요. 경매를 만든 뒤 바로 아래 상태를
        &ldquo;진행 중&rdquo;으로 바꾸면 시간과 무관하게 즉시 입찰이 가능해집니다.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="h-10 flex-1 rounded-[8px] border border-[#dfe0da] bg-white text-[13px] font-bold disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleCreateAuction}
          className="h-10 flex-1 rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
        >
          {busy ? '생성 중...' : '경매 생성'}
        </button>
      </div>
    </div>
  );
}
