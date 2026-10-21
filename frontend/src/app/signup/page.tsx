"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage, login, signUp } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// 주소: /signup
export default function SignUpPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 백엔드 SignUpRequest는 비밀번호를 8~64자로 검사하는데,
    // 검사에 걸리면 친절한 메시지 대신 500 에러가 와버림.
    // 그래서 요청 보내기 전에 프론트에서 먼저 같은 규칙으로 검사
    if (password.length < 8 || password.length > 64) {
      setError("비밀번호는 8~64자로 입력해 주세요.");
      return; // 요청을 보내지 않고 여기서 끝
    }

    setLoading(true);
    try {
      // 1) 회원가입 → 가입된 회원 정보(이름 포함)를 돌려받음
      const member = await signUp(email, password, name);

      // 2) 회원가입 API는 토큰을 안 주니까, 방금 입력한 정보로 바로 로그인
      //    → 사용자가 가입 후 로그인 화면에서 또 입력할 필요가 없음
      const { accessToken } = await login(email, password);

      // 3) 이름은 1)에서 이미 받았으니 회원 조회 없이 바로 로그인 상태 저장
      setAuth(accessToken, member);

      router.push("/mypage");
    } catch (err) {
      // 이미 가입된 이메일이면 "이미 가입된 이메일입니다: ..." 문구가 그대로 표시됨
      setError(errorMessage(err, "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setLoading(false);
    }
  };

  // 입력창 세 개가 같은 스타일이라 변수로 빼서 재사용
  const inputClass =
    "h-12 rounded-[8px] border border-[#dfe0da] px-4 text-[14px] outline-none focus:border-[#111111]";

  return (
    <div className="px-5 pb-12 pt-10 text-[#171717]">
      <h1 className="text-[24px] font-extrabold tracking-[-0.04em]">회원가입</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        {/* 백엔드에서 name, email, password 모두 @NotBlank(필수)라 전부 required */}
        <input required placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          placeholder="비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        {error && <p className="text-[12px] text-[#ff4e44]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold disabled:opacity-50"
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#73756f]">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-[#111111] underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
