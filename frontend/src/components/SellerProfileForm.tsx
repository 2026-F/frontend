'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  errorMessage,
  fetchSellerProfile,
  registerSellerProfile,
  updateSellerProfile,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { SellerProfile, SellerProfileRegisterRequest } from '@/types';

const emptyForm: SellerProfileRegisterRequest = {
  shopName: '',
  introduction: '',
  profileImageUrl: '',
};
const fieldsOf = (profile: SellerProfile): SellerProfileRegisterRequest => ({
  shopName: profile.shopName,
  introduction: profile.introduction ?? '',
  profileImageUrl: profile.profileImageUrl ?? '',
});
const inputClass =
  'mt-2 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717] disabled:bg-[#f7f8f4] disabled:text-[#73756f]';

export default function SellerProfileForm({
  memberId,
  accessToken,
}: {
  memberId: number;
  accessToken: string;
}) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [fields, setFields] = useState(emptyForm);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);
  const alive = useRef(false);
  const requestPending = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const isCurrentSession = () => {
    const current = useAuth.getState();
    return (
      alive.current &&
      current.accessToken === accessToken &&
      current.member?.id === memberId &&
      current.member.role === 'CONSIGNOR'
    );
  };

  useEffect(() => {
    let active = true;
    const current = () => {
      const auth = useAuth.getState();
      return (
        active &&
        auth.accessToken === accessToken &&
        auth.member?.id === memberId &&
        auth.member.role === 'CONSIGNOR'
      );
    };
    setLoading(true);
    setError(null);
    setSaved(false);
    fetchSellerProfile(memberId)
      .then((latest) => {
        if (!current()) return;
        setProfile(latest);
        setFields(fieldsOf(latest));
        setLoaded(true);
        setConflict(false);
        setFieldError(null);
      })
      .catch((cause: unknown) => {
        if (!current()) return;
        const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
        const code = axios.isAxiosError(cause) ? cause.response?.data?.code : undefined;
        if (status === 404 && code === 'SELLER_PROFILE_NOT_FOUND') {
          setProfile(null);
          setFields(emptyForm);
          setLoaded(true);
          setConflict(false);
          setFieldError(null);
          return;
        }
        setNeedsLogin(status === 401);
        setError(
          status === 401
            ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
            : status === 403
              ? '판매자 프로필을 확인할 권한이 없습니다.'
              : errorMessage(cause, '판매자 프로필을 불러오지 못했습니다. 다시 시도해 주세요.'),
        );
      })
      .finally(() => {
        if (current()) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [memberId, accessToken, loadAttempt]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !loaded ||
      loading ||
      requestPending.current ||
      needsLogin ||
      conflict ||
      !isCurrentSession()
    )
      return;
    const request = {
      ...fields,
      shopName: fields.shopName.trim(),
      profileImageUrl: fields.profileImageUrl.trim(),
    };
    setFieldError(null);
    setError(null);
    setSaved(false);
    if (
      !request.shopName ||
      request.shopName.length > 50 ||
      request.introduction.length > 1000 ||
      request.profileImageUrl.length > 500
    ) {
      setFieldError(
        '상호명은 앞뒤 공백을 제외하고 1~50자, 소개는 1000자, 이미지 URL은 500자 이내로 입력해 주세요.',
      );
      return;
    }
    if (request.profileImageUrl) {
      try {
        const url = new URL(request.profileImageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
      } catch {
        setFieldError(
          '프로필 이미지 URL은 http:// 또는 https://로 시작하는 올바른 주소를 입력해 주세요.',
        );
        return;
      }
    }
    requestPending.current = true;
    setSaving(true);
    try {
      const updated = profile
        ? await updateSellerProfile(memberId, request)
        : await registerSellerProfile(request);
      if (!isCurrentSession()) return;
      setProfile(updated);
      setFields(fieldsOf(updated));
      setSaved(true);
    } catch (cause) {
      if (!isCurrentSession()) return;
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      const code = axios.isAxiosError(cause) ? cause.response?.data?.code : undefined;
      setNeedsLogin(status === 401);
      const duplicate = status === 409 && code === 'SELLER_PROFILE_ALREADY_EXISTS';
      setConflict(duplicate);
      setError(
        status === 401
          ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
          : status === 403
            ? '판매자 본인의 프로필만 등록하거나 수정할 수 있습니다.'
            : duplicate
              ? '이미 등록된 프로필이 있습니다. 기존 프로필을 다시 불러와 주세요.'
              : errorMessage(cause, '판매자 프로필을 저장하지 못했습니다. 다시 시도해 주세요.'),
      );
    } finally {
      requestPending.current = false;
      if (isCurrentSession()) setSaving(false);
    }
  };

  const updateField = (key: keyof SellerProfileRegisterRequest, value: string) => {
    setFields((previous) => ({ ...previous, [key]: value }));
    setFieldError(null);
    setSaved(false);
  };

  return (
    <section className="mt-8" aria-labelledby="seller-form-heading">
      {loading && (
        <p role="status" className="rounded-[12px] bg-[#f7f8f4] p-4 text-[13px] text-[#73756f]">
          판매자 프로필을 불러오는 중...
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-[#c13b32]">
          {error}
        </p>
      )}
      {needsLogin ? (
        <Link
          href="/login"
          className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold underline"
        >
          다시 로그인
        </Link>
      ) : (
        !loading &&
        (!loaded || conflict) && (
          <button
            type="button"
            disabled={saving}
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="mt-3 min-h-11 text-[13px] font-bold underline disabled:opacity-50"
          >
            {conflict ? '기존 프로필 다시 불러오기' : '다시 불러오기'}
          </button>
        )
      )}
      {loaded && !loading && (
        <form onSubmit={save} aria-label="판매자 프로필" aria-busy={saving} className="space-y-5">
          <h2 id="seller-form-heading" className="text-[17px] font-bold">
            {profile ? '프로필 수정' : '프로필 등록'}
          </h2>
          <fieldset disabled={saving || needsLogin} className="space-y-5">
            <div>
              <label htmlFor="seller-shop-name" className="block text-[13px] font-semibold">
                상호명 (필수)
              </label>
              <input
                id="seller-shop-name"
                name="shopName"
                required
                maxLength={50}
                autoComplete="organization"
                value={fields.shopName}
                onChange={(event) => updateField('shopName', event.target.value)}
                className={`${inputClass} h-12`}
              />
            </div>
            <div>
              <label htmlFor="seller-introduction" className="block text-[13px] font-semibold">
                소개
              </label>
              <textarea
                id="seller-introduction"
                name="introduction"
                maxLength={1000}
                rows={6}
                value={fields.introduction}
                onChange={(event) => updateField('introduction', event.target.value)}
                className={`${inputClass} resize-y py-3`}
              />
              <p className="mt-1 text-right text-[12px] text-[#73756f]">
                {fields.introduction.length}/1000
              </p>
            </div>
            <div>
              <label htmlFor="seller-image-url" className="block text-[13px] font-semibold">
                프로필 이미지 URL
              </label>
              <input
                id="seller-image-url"
                name="profileImageUrl"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={500}
                placeholder="https://example.com/profile.jpg"
                value={fields.profileImageUrl}
                onChange={(event) => updateField('profileImageUrl', event.target.value)}
                className={`${inputClass} h-12`}
              />
              <p className="mt-2 text-[12px] text-[#73756f]">
                이미지 주소를 입력해 주세요. 파일 업로드는 지원하지 않습니다.
              </p>
            </div>
          </fieldset>
          {fieldError && (
            <p role="alert" className="text-[13px] text-[#c13b32]">
              {fieldError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || needsLogin}
              onClick={() => {
                setFields(profile ? fieldsOf(profile) : emptyForm);
                setFieldError(null);
                setSaved(false);
                if (!conflict) setError(null);
              }}
              className="h-12 flex-1 rounded-[8px] border border-[#dfe0da] text-[13px] font-bold disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving || needsLogin || conflict}
              className="h-12 flex-1 rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
            >
              {saving ? '저장 중...' : profile ? '저장' : '등록'}
            </button>
          </div>
          {saved && (
            <p role="status" className="text-[13px] text-[#437020]">
              판매자 프로필을 저장했습니다.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
