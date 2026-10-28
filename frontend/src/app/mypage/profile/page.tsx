'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MemberProfileForm from '@/components/MemberProfileForm';
import { useAuth } from '@/lib/auth';

export default function MemberProfilePage() {
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
      <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.04em]">회원정보 수정</h1>

      {member && accessToken ? (
        <MemberProfileForm key={member.id} memberId={member.id} accessToken={accessToken} />
      ) : (
        <section className="mt-8 rounded-[14px] bg-[#f7f8f4] p-5">
          <h2 className="text-[16px] font-bold">로그인이 필요해요</h2>
          <p className="mt-2 text-[13px] leading-5 text-[#73756f]">
            회원정보를 수정하려면 로그인해 주세요.
          </p>
          <Link
            href="/login"
            className="mt-5 flex h-12 items-center justify-center rounded-[8px] bg-[#a8ff00] text-[14px] font-bold"
          >
            로그인
          </Link>
        </section>
      )}
    </div>
  );
}
