'use client';

// /admin 이하 모든 페이지를 감싸는 레이아웃.
// 로그인 + role이 ADMIN인지 여기서 한 번만 확인하면 하위 페이지들은 따로 체크할 필요가 없다.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { member, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  if (!member || !accessToken) {
    return (
      <div className="min-h-screen bg-white px-5 pb-10 pt-16 text-center text-[#171717]">
        <p className="text-[18px] font-extrabold">로그인이 필요해요</p>
        <p className="mt-2 text-[13px] text-[#73756f]">관리자 계정으로 로그인해 주세요.</p>
        <Link
          href="/login"
          className="mx-auto mt-6 flex h-12 w-full items-center justify-center rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (member.role !== 'ADMIN') {
    return (
      <p role="alert" className="mt-16 px-5 text-center text-[14px] text-[#171717]">
        관리자만 이용할 수 있는 화면입니다.
      </p>
    );
  }

  return <div className="min-h-screen bg-white px-5 pb-10 pt-6 text-[#171717]">{children}</div>;
}
