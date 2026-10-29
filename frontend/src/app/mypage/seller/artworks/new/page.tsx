'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ArtworkRegisterForm from '@/components/ArtworkRegisterForm';
import { useAuth } from '@/lib/auth';

export default function ArtworkRegisterPage() {
  const { member, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white px-5 pb-10 pt-6 text-[#171717]">
      <Link
        href="/mypage/seller"
        className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-[#73756f]"
      >
        <span aria-hidden="true">‹</span> 판매자 프로필
      </Link>
      <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.04em]">작품 등록</h1>

      {!member || !accessToken ? (
        <section className="mt-8" aria-labelledby="artwork-login-heading">
          <h2 id="artwork-login-heading" className="text-[18px] font-extrabold">
            로그인이 필요해요
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#73756f]">
            판매자 계정으로 로그인하면 경매에 올릴 작품을 등록할 수 있어요.
          </p>
          <Link
            href="/login"
            className="mt-8 flex h-12 w-full items-center justify-center rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold"
          >
            로그인
          </Link>
        </section>
      ) : member.role !== 'CONSIGNOR' ? (
        <p role="alert" className="mt-8 rounded-[14px] bg-[#f7f8f4] p-5 text-[14px]">
          판매자만 이용할 수 있는 화면입니다.
        </p>
      ) : (
        <ArtworkRegisterForm key={member.id} memberId={member.id} />
      )}
    </div>
  );
}
