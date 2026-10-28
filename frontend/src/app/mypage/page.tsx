"use client";
// ↑ 원래는 서버 컴포넌트였지만, 로그인 정보가 브라우저(localStorage)에 있어서
//   그걸 읽으려면 클라이언트 컴포넌트로 바꿔야 함 ("use client"는 항상 파일 맨 첫 줄)

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STATS = [
  { label: "입찰", value: 5 },
  { label: "컬렉션", value: 1 },
  { label: "관심", value: 24 },
];

const MENU = ["주문 및 배송 현황", "결제 대기", "환경 설정"];
const RECENT_COLORS = ["#f4cee0", "#d8e2ff", "#d9e9d4"];

export default function MyPage() {
  const router = useRouter();
  // 전역 저장소에서 로그인한 회원 정보와 로그아웃 함수를 꺼냄
  const { member, clear } = useAuth();

  // ── 왜 ready가 필요한가? ──
  // Next.js는 페이지를 먼저 서버에서 HTML로 그리고, 브라우저에서 그 위에 React를 붙임.
  // 서버에는 localStorage가 없어서 서버 화면은 항상 "로그인 안 됨"으로 그려지는데,
  // 브라우저에서는 저장된 로그인 정보가 있어서 "로그인 됨"으로 그리려 함.
  // 두 화면이 다르면 Hydration 에러가 나기 때문에,
  // 브라우저에 화면이 붙은 뒤(useEffect 실행 후)에만 실제 내용을 그리도록 함
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []); // [] : 처음 한 번만 실행

  const handleLogout = async () => {
    // 서버에 로그아웃 알림. 실패해도(서버 꺼짐 등) 로그아웃은 진행되도록 에러는 무시
    await logout().catch(() => {});
    // 저장된 토큰과 회원 정보 삭제 → 진짜 로그아웃은 이 부분
    clear();
    router.push("/login");
  };

  // 아직 브라우저 준비 전이면 아무것도 안 그림 (아주 잠깐이라 거의 안 보임)
  if (!ready) return null;

  // 로그인 안 한 상태면 마이페이지 대신 로그인 안내 화면
  if (!member) {
    return (
      <div className="px-5 pb-12 pt-16 text-center text-[#171717]">
        <p className="text-[18px] font-extrabold">로그인이 필요해요</p>
        <p className="mt-2 text-[13px] text-[#73756f]">로그인하고 입찰 내역과 컬렉션을 확인하세요.</p>
        <Link
          href="/login"
          className="mx-auto mt-6 flex h-12 w-full items-center justify-center rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold"
        >
          로그인
        </Link>
        <Link href="/signup" className="mt-4 inline-block text-[13px] font-semibold text-[#73756f] underline">
          회원가입
        </Link>
      </div>
    );
  }
  // 여기부터 아래(기존 return)는 로그인한 상태에서만 실행됨 → member는 null이 아님

  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <section className="relative overflow-hidden rounded-[18px] bg-[#1b1d19] p-5 text-white">
        <div
          className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full border-[24px] border-white/5"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#b8f53d] text-[21px] font-black text-[#171717]">
            {/* 이름 첫 글자를 동그라미 아바타에 표시. 이름이 비어 있으면 "?" */}
            {member.name?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            {/* 하드코딩된 "김그림 님" 대신 실제 로그인한 회원 정보 */}
            <p className="text-[18px] font-extrabold tracking-[-0.04em]">{member.name} 님</p>
            <p className="mt-1 text-xs text-[#c5c8bf]">{member.email}</p>
          </div>
        </div>
        <Link
          href="/mypage/profile"
          className="relative mt-6 flex h-11 w-full items-center justify-center rounded-[10px] border border-white/30 text-[13px] font-bold transition-colors hover:bg-white/10"
        >
          회원정보 관리
        </Link>
      </section>

      <section
        aria-label="나의 경매 현황"
        className="mt-9 grid grid-cols-3 rounded-[18px] bg-[#f7f8f4] py-5 text-center"
      >
        {STATS.map((stat) => (
          <button key={stat.label} type="button" disabled aria-label={`${stat.label} ${stat.value}건, 상세 화면 준비 중`} className="flex flex-col items-center justify-center text-center disabled:cursor-default">
            <p className="text-[13px] font-semibold text-[#73756f]">{stat.label}</p>
            <p className="mt-3 text-[25px] font-extrabold leading-none tracking-[-0.05em]">
              {stat.value}
            </p>
          </button>
        ))}
      </section>

      <nav aria-label="마이페이지 메뉴" className="mt-7">
        {MENU.map((label, index) => (
          <Link
            key={label}
            href="#"
            className={`flex min-h-[70px] items-center justify-between text-[16px] font-bold ${index < MENU.length - 1 ? "border-b border-[#dedfd9]" : ""}`}
          >
            {label}
            <span className="text-[25px] font-normal leading-none" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </nav>

      <section className="mt-9">
        <div className="flex items-end justify-between">
          <h2 className="text-[21px] font-extrabold tracking-[-0.045em]">최근 본 작품</h2>
          <Link
            href="/auctions"
            className="pb-0.5 text-xs font-semibold text-[#666862] underline decoration-[#b7b9b2] underline-offset-4"
          >
            작품 둘러보기
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {RECENT_COLORS.map((color, index) => (
            <div
              key={color}
              className="aspect-[4/5] overflow-hidden rounded-[12px]"
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">최근 본 작품 자리 {index + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-9 w-full rounded-[10px] border border-[#d9dcd2] px-4 py-3 text-[13px] font-semibold text-[#73756f]"
      >
        로그아웃
      </button>
    </div>
  );
}
