'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { errorMessage, fetchMember, updateMember } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const inputClass =
  'mt-2 h-12 w-full rounded-[8px] border border-[#dfe0da] bg-white px-3 text-[14px] outline-none focus:border-[#171717] disabled:bg-[#f7f8f4] disabled:text-[#73756f]';
const labelClass = 'block text-[13px] font-semibold';

export default function MemberProfileForm({
  memberId,
  accessToken,
}: {
  memberId: number;
  accessToken: string;
}) {
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [email, setEmail] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const requestPending = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoaded(false);
    setError(null);
    setNeedsLogin(false);
    setSaved(false);
    setNameError(null);

    const isCurrentSession = () => {
      const current = useAuth.getState();
      return active && current.accessToken === accessToken && current.member?.id === memberId;
    };

    fetchMember(memberId)
      .then((latest) => {
        if (!isCurrentSession()) return;
        setName(latest.name);
        setSavedName(latest.name);
        setEmail(latest.email);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        if (!isCurrentSession()) return;
        const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
        setNeedsLogin(status === 401);
        setError(
          status === 401
            ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
            : status === 403
              ? '본인 정보만 확인할 수 있습니다.'
              : errorMessage(cause, '회원정보를 불러오지 못했습니다. 다시 시도해 주세요.'),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [memberId, accessToken, loadAttempt]);

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loaded || saving || needsLogin || requestPending.current) return;
    const trimmedName = name.trim();
    setSaved(false);
    setError(null);
    setNameError(null);
    if (!trimmedName || trimmedName.length > 50) {
      setNameError('이름은 앞뒤 공백을 제외하고 1~50자로 입력해 주세요.');
      return;
    }

    const isCurrentSession = () => {
      const current = useAuth.getState();
      return current.accessToken === accessToken && current.member?.id === memberId;
    };
    if (!isCurrentSession()) return;
    requestPending.current = true;
    setSaving(true);
    try {
      const updated = await updateMember(memberId, { name: trimmedName });
      if (!isCurrentSession()) return;
      useAuth.getState().setAuth(accessToken, updated);
      setName(updated.name);
      setSavedName(updated.name);
      setSaved(true);
      setEditingName(false);
    } catch (cause) {
      if (!isCurrentSession()) return;
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setNeedsLogin(status === 401);
      setError(
        status === 401
          ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
          : status === 403
            ? '본인 정보만 수정할 수 있습니다.'
            : errorMessage(cause, '이름을 저장하지 못했습니다. 다시 시도해 주세요.'),
      );
    } finally {
      requestPending.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="mt-8">
      {loading && (
        <p role="status" className="rounded-[12px] bg-[#f7f8f4] p-4 text-[13px] text-[#73756f]">
          회원정보를 불러오는 중...
        </p>
      )}
      {!loaded && !loading && (
        <div className="rounded-[12px] border border-[#dfe0da] p-4">
          {error && (
            <p role="alert" className="text-[13px] text-[#c13b32]">
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
            <button
              type="button"
              onClick={() => setLoadAttempt((value) => value + 1)}
              className="mt-3 min-h-11 text-[13px] font-bold underline"
            >
              다시 불러오기
            </button>
          )}
        </div>
      )}

      {loaded && (
        <section aria-labelledby="profile-name-heading">
          <h2 id="profile-name-heading" className="text-[17px] font-bold">
            기본 정보
          </h2>
          {!editingName ? (
            <div className="mt-5">
              <p className={labelClass}>이름</p>
              <div className="mt-2 flex min-h-12 items-center justify-between gap-4">
                <p className="min-w-0 break-words text-[14px]">{savedName}</p>
                <button
                  type="button"
                  onClick={() => {
                    setName(savedName);
                    setNameError(null);
                    setSaved(false);
                    setEditingName(true);
                  }}
                  className="h-10 shrink-0 rounded-[8px] border border-[#dfe0da] px-4 text-[13px] font-bold"
                >
                  수정
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={saveName} aria-label="이름 수정" aria-busy={saving} className="mt-5">
              <label htmlFor="member-name" className={labelClass}>
                이름
              </label>
              <input
                id="member-name"
                name="name"
                autoComplete="name"
                required
                maxLength={50}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError(null);
                  setSaved(false);
                }}
                disabled={saving}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? 'member-name-error' : undefined}
                className={inputClass}
              />
              {nameError && (
                <p id="member-name-error" role="alert" className="mt-2 text-[12px] text-[#c13b32]">
                  {nameError}
                </p>
              )}
              {error && (
                <p role="alert" className="mt-3 text-[13px] text-[#c13b32]">
                  {error}
                </p>
              )}
              {needsLogin && (
                <Link href="/login" className="mt-2 inline-block text-[13px] underline">
                  다시 로그인
                </Link>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setName(savedName);
                    setNameError(null);
                    setError(null);
                    setSaved(false);
                    setEditingName(false);
                  }}
                  className="h-12 flex-1 rounded-[8px] border border-[#dfe0da] text-[13px] font-bold disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving || needsLogin}
                  className="h-12 flex-1 rounded-[8px] bg-[#a8ff00] text-[13px] font-bold disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          )}
          {saved && (
            <p role="status" className="mt-3 text-[13px] text-[#437020]">
              이름을 저장했습니다.
            </p>
          )}
          <div role="group" aria-label="연락처 및 배송지 입력" className="mt-5 space-y-5">
            <div>
              <label htmlFor="member-email" className={labelClass}>
                이메일
              </label>
              <input
                id="member-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                readOnly
                maxLength={254}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="member-phone" className={labelClass}>
                휴대폰 번호
              </label>
              <input
                id="member-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="010-0000-0000"
                disabled
                maxLength={30}
                className={inputClass}
              />
            </div>
            <fieldset className="space-y-3">
              <legend className="mb-1 text-[13px] font-semibold">배송지</legend>
              <div>
                <label htmlFor="member-postal-code" className="text-[12px] text-[#73756f]">
                  우편번호
                </label>
                <input
                  id="member-postal-code"
                  name="postalCode"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  placeholder="우편번호 입력"
                  disabled
                  maxLength={10}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="member-address" className="text-[12px] text-[#73756f]">
                  기본 주소
                </label>
                <input
                  id="member-address"
                  name="address"
                  autoComplete="address-line1"
                  placeholder="도로명 또는 지번 주소"
                  disabled
                  maxLength={200}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="member-address-detail" className="text-[12px] text-[#73756f]">
                  상세 주소
                </label>
                <input
                  id="member-address-detail"
                  name="addressDetail"
                  autoComplete="address-line2"
                  placeholder="동·호수 등 상세 주소"
                  disabled
                  maxLength={200}
                  className={inputClass}
                />
              </div>
            </fieldset>
            <button
              type="button"
              disabled
              className="h-12 w-full rounded-[8px] bg-[#eff0eb] text-[13px] font-bold text-[#73756f] disabled:cursor-not-allowed"
            >
              연락처 및 배송지 저장 준비 중
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
