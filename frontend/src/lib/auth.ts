"use client"; // localStorage는 브라우저에만 있어서, 이 파일은 클라이언트에서만 쓰도록 표시

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Member } from "@/types";

// -----------------------------------------------------------------------
// 로그인 상태를 앱 전체에서 같이 쓰기 위한 전역 저장소 (zustand)
//
// 왜 필요한가?
//  로그인 페이지에서 로그인하면 마이페이지, 입찰 패널, 헤더 등 여러 화면이
//  "지금 누가 로그인했는지" 알아야 함. 페이지마다 따로 들고 있으면 안 맞으니까
//  한 군데(이 저장소)에 두고 어디서든 useAuth()로 꺼내 씀.
//
// 사용 예)
//  const member = useAuth((s) => s.member);      // 로그인한 회원 (없으면 null)
//  const setAuth = useAuth((s) => s.setAuth);    // 로그인 성공 시 호출
//  const clear = useAuth((s) => s.clear);        // 로그아웃 시 호출
// -----------------------------------------------------------------------

type AuthState = {
  accessToken: string | null; // JWT 토큰. 로그인 안 했으면 null
  member: Member | null; // 로그인한 회원 정보(이름, 이메일 등). 로그인 안 했으면 null
  setAuth: (accessToken: string, member: Member) => void; // 로그인 상태로 만들기
  clear: () => void; // 로그아웃 상태로 만들기
};

export const useAuth = create<AuthState>()(
  // persist: 저장소 내용을 localStorage에 자동 저장/복원해 줌
  // → 새로고침하거나 브라우저를 껐다 켜도 로그인이 유지됨
  persist(
    (set) => ({
      // 처음 상태: 로그인 안 됨
      accessToken: null,
      member: null,

      setAuth: (accessToken, member) => {
        // api.ts의 요청 인터셉터는 localStorage의 "accessToken" 키를 직접 읽어서
        // 모든 요청에 Authorization 헤더를 붙임. 그래서 그 키에도 따로 저장해 둠
        localStorage.setItem("accessToken", accessToken);
        // 저장소 상태 업데이트 → 이 값을 쓰는 모든 컴포넌트가 자동으로 다시 그려짐
        set({ accessToken, member });
      },

      clear: () => {
        // 인터셉터가 더 이상 토큰을 못 붙이도록 지우고
        localStorage.removeItem("accessToken");
        // 저장소도 비워서 화면들이 "로그인 안 됨" 상태로 바뀌게 함
        set({ accessToken: null, member: null });
      },
    }),
    // localStorage에 저장될 키 이름. 개발자도구 > Application > Local Storage에서 확인 가능
    { name: "artbid-auth" },
  ),
);
