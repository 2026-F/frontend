'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SellerProfileForm from '@/components/SellerProfileForm';
import { useAuth } from '@/lib/auth';

export default function SellerProfilePage() {
  const { member, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white px-5 pb-10 pt-6 text-[#171717]">
      <Link
        href="/mypage"
        className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-[#73756f]"
      >
        <span aria-hidden="true">‹</span> 마이페이지
      </Link>
      <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.04em]">판매자 프로필 관리</h1>
      {!member || !accessToken ? (
        <section className="mt-8" aria-labelledby="seller-login-heading">
          <h2 id="seller-login-heading" className="text-[18px] font-extrabold">
            로그인이 필요해요
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#73756f]">
            판매자 계정으로 로그인하면 프로필을 등록하고 수정할 수 있어요.
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
        <SellerProfileForm
          key={`${member.id}:${accessToken}`}
          memberId={member.id}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
