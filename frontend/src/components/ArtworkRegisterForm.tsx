'use client';

// 판매자가 경매에 올릴 작품을 새로 등록하는 폼.
// 등록 흐름은 두 단계로 나뉩니다.
//  1) 작가를 고르거나(또는 새로 등록하고) 작품 정보를 입력해서 "작품 등록"
//     → 저장 직후 상태는 PENDING_REVIEW. 어드민 심사를 통과해야 경매 목록에 공개됩니다.
//  2) 작품이 생성된 뒤에만 사진/영상을 업로드할 수 있습니다
//     (업로드 API가 artworkId를 요구하기 때문 — 그래서 1단계가 끝나야 2단계가 나타남).
import axios from 'axios';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import ArtistPicker from '@/components/ArtistPicker';
import { createArtwork, errorMessage, uploadArtworkMedia } from '@/lib/api';
import { CATEGORY_LABELS } from '@/lib/categories';
import type { ArtworkCategory, ArtworkDetail, PresignedUploadResponse } from '@/types';

const emptyFields = {
  title: '',
  description: '',
  category: '' as ArtworkCategory | '',
  medium: '',
  widthCm: '',
  heightCm: '',
  depthCm: '',
  productionYear: '',
  startPrice: '',
  estimatedPrice: '',
  certificateUrl: '',
  imageUrl: '',
};

const inputClass =
  'mt-1 h-12 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717] disabled:bg-[#f7f8f4] disabled:text-[#73756f]';

const isHttpUrl = (value: string) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// 가로/세로/깊이(widthCm·heightCm·depthCm)처럼 소수점이 있을 수 있는 선택값용.
// 비워두면 null(선택 안 함), 0 이하거나 숫자가 아니면 undefined로 "잘못된 값"을 알려준다.
function parseOptionalPositiveNumber(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

// estimatedPrice(추정가)처럼 정수만 받는 선택값용. 백엔드가 Long 타입이라 소수점은 거절됩니다.
function parseOptionalPositiveInteger(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

export default function ArtworkRegisterForm({ memberId }: { memberId: number }) {
  const [artistId, setArtistId] = useState<number | null>(null);
  const [artistName, setArtistName] = useState<string | null>(null);

  const [fields, setFields] = useState(emptyFields);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestPending = useRef(false);

  const [createdArtwork, setCreatedArtwork] = useState<ArtworkDetail | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<PresignedUploadResponse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateField = <K extends keyof typeof emptyFields>(key: K, value: (typeof emptyFields)[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || requestPending.current || createdArtwork) return;

    if (!artistId) {
      setFieldError('작가를 선택하거나 새로 등록해 주세요.');
      return;
    }
    const title = fields.title.trim();
    const description = fields.description.trim();
    const medium = fields.medium.trim();
    const certificateUrl = fields.certificateUrl.trim();
    const imageUrl = fields.imageUrl.trim();

    if (!title || title.length > 100) {
      setFieldError('작품명은 1~100자로 입력해 주세요.');
      return;
    }
    if (!fields.category) {
      setFieldError('카테고리를 선택해 주세요.');
      return;
    }
    if (description.length > 2000 || medium.length > 100 || certificateUrl.length > 500 || imageUrl.length > 500) {
      setFieldError('입력한 글자 수가 너무 많습니다. 각 항목의 최대 글자 수를 확인해 주세요.');
      return;
    }
    if (!isHttpUrl(certificateUrl) || !isHttpUrl(imageUrl)) {
      setFieldError('URL은 http:// 또는 https://로 시작해야 합니다.');
      return;
    }

    const startPrice = Number(fields.startPrice);
    if (!fields.startPrice.trim() || !Number.isInteger(startPrice) || startPrice <= 0) {
      setFieldError('시작가는 0보다 큰 정수(원 단위)로 입력해 주세요.');
      return;
    }

    const estimatedPrice = parseOptionalPositiveInteger(fields.estimatedPrice);
    const widthCm = parseOptionalPositiveNumber(fields.widthCm);
    const heightCm = parseOptionalPositiveNumber(fields.heightCm);
    const depthCm = parseOptionalPositiveNumber(fields.depthCm);
    if (estimatedPrice === undefined || widthCm === undefined || heightCm === undefined || depthCm === undefined) {
      setFieldError('추정가·가로·세로·깊이는 비워두거나 0보다 큰 숫자로 입력해 주세요. (추정가는 정수만 가능)');
      return;
    }

    let productionYear: number | null = null;
    if (fields.productionYear.trim()) {
      const parsedYear = Number(fields.productionYear);
      if (!Number.isInteger(parsedYear) || parsedYear < 1000 || parsedYear > 9999) {
        setFieldError('제작연도는 1000~9999 사이 숫자로 입력해 주세요.');
        return;
      }
      productionYear = parsedYear;
    }

    setFieldError(null);
    setSubmitError(null);
    requestPending.current = true;
    setSubmitting(true);
    try {
      const created = await createArtwork({
        consignorId: memberId,
        artistId,
        title,
        description,
        category: fields.category as ArtworkCategory,
        medium,
        widthCm,
        heightCm,
        depthCm,
        productionYear,
        startPrice,
        estimatedPrice,
        certificateUrl,
        imageUrl,
      });
      setCreatedArtwork(created);
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setSubmitError(
        status === 401
          ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
          : status === 404
            ? '선택한 작가를 찾을 수 없습니다. 작가를 다시 선택해 주세요.'
            : errorMessage(cause, '작품 등록에 실패했습니다. 다시 시도해 주세요.'),
      );
    } finally {
      requestPending.current = false;
      setSubmitting(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // 같은 파일을 다시 선택해도 onChange가 또 발생하도록 리셋
    if (!file || !createdArtwork) return;

    setUploadError(null);
    setUploading(true);
    try {
      const presigned = await uploadArtworkMedia(createdArtwork.id, file);
      setUploadedMedia((prev) => [...prev, presigned]);
    } catch (cause) {
      setUploadError(errorMessage(cause, '파일 업로드에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setUploading(false);
    }
  };

  if (createdArtwork) {
    return (
      <section className="mt-8 space-y-5" aria-labelledby="artwork-done-heading">
        <h2 id="artwork-done-heading" className="text-[17px] font-bold">
          &apos;{createdArtwork.title}&apos; 등록 완료
        </h2>
        <p className="rounded-[12px] bg-[#f7f8f4] p-4 text-[13px] leading-6 text-[#73756f]">
          작품이 등록되었습니다. 지금은 <b>심사 대기(PENDING_REVIEW)</b> 상태라 어드민 승인이 끝나야
          경매 목록에 공개됩니다. 사진이나 영상을 추가로 올려두면 심사와 전시에 도움이 됩니다.
        </p>

        <div>
          <label htmlFor="artwork-media" className="block text-[13px] font-semibold">
            사진 / 영상 업로드 (선택)
          </label>
          <input
            id="artwork-media"
            type="file"
            accept="image/*,video/*"
            disabled={uploading}
            onChange={handleFileChange}
            className="mt-2 block w-full text-[13px]"
          />
          {uploading && <p className="mt-2 text-[12px] text-[#73756f]">업로드 중...</p>}
          {uploadError && <p className="mt-2 text-[12px] text-[#c13b32]">{uploadError}</p>}
          {uploadedMedia.length > 0 && (
            <ul className="mt-2 space-y-1 text-[12px] text-[#437020]">
              {uploadedMedia.map((media) => (
                <li key={media.objectKey}>{media.mediaType} 업로드 완료</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href="/mypage/seller"
            className="flex h-12 flex-1 items-center justify-center rounded-[8px] border border-[#dfe0da] text-[13px] font-bold"
          >
            마이페이지로
          </Link>
          <Link
            href={`/artworks/${createdArtwork.id}`}
            className="flex h-12 flex-1 items-center justify-center rounded-[8px] bg-[#a8ff00] text-[13px] font-bold"
          >
            등록한 작품 보기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} aria-label="작품 등록" aria-busy={submitting} className="mt-8 space-y-5">
      <div>
        <label className="block text-[13px] font-semibold">작가 (필수)</label>
        <ArtistPicker
          selectedArtistId={artistId}
          selectedArtistName={artistName}
          onSelect={(id, name) => {
            setArtistId(id);
            setArtistName(name);
            setFieldError(null);
          }}
          onClear={() => {
            setArtistId(null);
            setArtistName(null);
          }}
          disabled={submitting}
        />
      </div>

      <fieldset disabled={submitting} className="space-y-5">
        <div>
          <label htmlFor="artwork-title" className="block text-[13px] font-semibold">
            작품명 (필수)
          </label>
          <input
            id="artwork-title"
            maxLength={100}
            value={fields.title}
            onChange={(event) => updateField('title', event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="artwork-category" className="block text-[13px] font-semibold">
            카테고리 (필수)
          </label>
          <select
            id="artwork-category"
            value={fields.category}
            onChange={(event) => updateField('category', event.target.value as ArtworkCategory)}
            className={inputClass}
          >
            <option value="">선택해 주세요</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="artwork-description" className="block text-[13px] font-semibold">
            작품 설명
          </label>
          <textarea
            id="artwork-description"
            rows={5}
            maxLength={2000}
            value={fields.description}
            onChange={(event) => updateField('description', event.target.value)}
            className="mt-1 w-full resize-y rounded-[8px] border border-[#dfe0da] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#171717]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="artwork-medium" className="block text-[13px] font-semibold">
              재료/기법
            </label>
            <input
              id="artwork-medium"
              maxLength={100}
              placeholder="예: 캔버스에 유채"
              value={fields.medium}
              onChange={(event) => updateField('medium', event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="artwork-year" className="block text-[13px] font-semibold">
              제작연도
            </label>
            <input
              id="artwork-year"
              type="number"
              placeholder="예: 2024"
              value={fields.productionYear}
              onChange={(event) => updateField('productionYear', event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="artwork-width" className="block text-[13px] font-semibold">
              가로(cm)
            </label>
            <input
              id="artwork-width"
              type="number"
              step="0.1"
              value={fields.widthCm}
              onChange={(event) => updateField('widthCm', event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="artwork-height" className="block text-[13px] font-semibold">
              세로(cm)
            </label>
            <input
              id="artwork-height"
              type="number"
              step="0.1"
              value={fields.heightCm}
              onChange={(event) => updateField('heightCm', event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="artwork-depth" className="block text-[13px] font-semibold">
              깊이(cm)
            </label>
            <input
              id="artwork-depth"
              type="number"
              step="0.1"
              value={fields.depthCm}
              onChange={(event) => updateField('depthCm', event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="artwork-start-price" className="block text-[13px] font-semibold">
              시작가(원) (필수)
            </label>
            <input
              id="artwork-start-price"
              type="number"
              step="1"
              value={fields.startPrice}
              onChange={(event) => updateField('startPrice', event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="artwork-estimated-price" className="block text-[13px] font-semibold">
              추정가(원)
            </label>
            <input
              id="artwork-estimated-price"
              type="number"
              step="1"
              value={fields.estimatedPrice}
              onChange={(event) => updateField('estimatedPrice', event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="artwork-certificate-url" className="block text-[13px] font-semibold">
            보증서 URL
          </label>
          <input
            id="artwork-certificate-url"
            type="text"
            maxLength={500}
            placeholder="https://example.com/certificate.pdf"
            value={fields.certificateUrl}
            onChange={(event) => updateField('certificateUrl', event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="artwork-image-url" className="block text-[13px] font-semibold">
            대표 이미지 URL
          </label>
          <input
            id="artwork-image-url"
            type="text"
            maxLength={500}
            placeholder="https://example.com/artwork.jpg"
            value={fields.imageUrl}
            onChange={(event) => updateField('imageUrl', event.target.value)}
            className={inputClass}
          />
          <p className="mt-2 text-[12px] text-[#73756f]">
            외부 이미지 주소를 바로 입력하거나, 등록 완료 후 아래 업로드 기능으로 사진/영상 파일을 올릴 수 있습니다.
          </p>
        </div>
      </fieldset>

      {fieldError && (
        <p role="alert" className="text-[13px] text-[#c13b32]">
          {fieldError}
        </p>
      )}
      {submitError && (
        <p role="alert" className="text-[13px] text-[#c13b32]">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
      >
        {submitting ? '등록 중...' : '작품 등록'}
      </button>
    </form>
  );
}
