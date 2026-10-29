'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { member, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  if (member && accessToken && member.role === 'ADMIN') {
    return <div key={`${member.id}:${accessToken}`}>{children}</div>;
  }
  return (
    <div className="min-h-screen bg-white px-5 pb-10 pt-6 text-[#171717]">
      <Link
        href="/mypage"
        className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[#73756f]"
      >
        ‹ 마이페이지
      </Link>
      <h1 className="mt-3 text-[24px] font-extrabold">작품 심사 관리</h1>
      <h2 className="mt-8 text-[18px] font-extrabold">
        {!member || !accessToken ? '로그인이 필요해요' : '관리자만 이용할 수 있어요'}
      </h2>
      <p className="mt-2 text-[13px] leading-6 text-[#73756f]">
        관리자 계정으로 로그인하면 심사 대기 작품을 확인하고 승인하거나 반려할 수 있어요.
      </p>
      <Link
        href="/login"
        className="mt-8 flex h-12 w-full items-center justify-center rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold"
      >
        {!member || !accessToken ? '로그인' : '다른 계정으로 로그인'}
      </Link>
    </div>
  );
}
