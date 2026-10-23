"use client"; // 입력값 상태(useState), 클릭 이벤트, 페이지 이동을 쓰니까 클라이언트 컴포넌트

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage, fetchMember, login } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// Next.js App Router 규칙: src/app/login/page.tsx → 주소 /login
export default function LoginPage() {
  const router = useRouter(); // 로그인 성공 후 다른 페이지로 보낼 때 사용
  const setAuth = useAuth((s) => s.setAuth); // 전역 저장소의 "로그인 처리" 함수만 꺼내옴

  // 입력창 값과 화면 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // 에러 문구 (없으면 null → 안 보임)
  const [loading, setLoading] = useState(false); // 요청 중이면 버튼 비활성화 (중복 클릭 방지)

  const handleSubmit = async (e: React.FormEvent) => {
    // form은 기본적으로 제출 시 페이지를 새로고침함 → 그걸 막고 우리가 직접 처리
    e.preventDefault();
    setError(null); // 이전 에러 문구 지우기
    setLoading(true);

    try {
      // 1) 로그인 요청 → 토큰과 회원 번호를 받음
      const { accessToken, memberId } = await login(email, password);

      // 2) 다음 요청(회원 조회)에도 토큰이 붙도록 먼저 저장
      //    (지금 회원 조회 API는 토큰 없이도 되지만, 나중에 막힐 수 있어서 미리 대비)
      localStorage.setItem("accessToken", accessToken);

      // 3) 로그인 응답엔 이름이 없어서 회원 정보를 한 번 더 조회
      //    혹시 이 조회가 실패해도 로그인 자체는 성공했으니,
      //    이메일 앞부분을 임시 이름으로 써서 로그인은 계속 진행
      const member = await fetchMember(memberId).catch(() => ({
        id: memberId,
        email,
        name: email.split("@")[0],
        role: "BIDDER" as const, // as const: "BIDDER"를 그냥 string이 아닌 정확한 값으로 타입 지정
      }));

      // 4) 전역 저장소에 로그인 상태 저장 → 마이페이지 등 다른 화면에서 바로 쓸 수 있음
      setAuth(accessToken, member);

      // 5) 마이페이지로 이동
      router.push("/mypage");
    } catch (err) {
      // 로그인 실패(비밀번호 틀림 등) 또는 서버 꺼짐 → 메시지 표시
      setError(errorMessage(err, "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      // 성공이든 실패든 끝나면 버튼 다시 활성화
      setLoading(false);
    }
  };

  return (
    <div className="px-5 pb-12 pt-10 text-[#171717]">
      <h1 className="text-[24px] font-extrabold tracking-[-0.04em]">로그인</h1>
      <p className="mt-2 text-[13px] text-[#73756f]">입찰하려면 로그인이 필요해요.</p>

      {/* onSubmit: 버튼 클릭이나 입력창에서 Enter를 눌러도 handleSubmit 실행 */}
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        {/* type="email" + required: 브라우저가 빈 값이나 이메일 형식 오류를 먼저 막아줌
            (백엔드는 형식 오류를 500으로 보내서, 프론트에서 걸러주는 게 중요) */}
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // 입력할 때마다 상태 업데이트
          className="h-12 rounded-[8px] border border-[#dfe0da] px-4 text-[14px] outline-none focus:border-[#111111]"
        />
        {/* type="password": 입력한 글자를 ●●● 로 가려줌 */}
        <input
          type="password"
          required
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-[8px] border border-[#dfe0da] px-4 text-[14px] outline-none focus:border-[#111111]"
        />

        {/* 에러가 있을 때만 빨간 글씨로 표시 */}
        {error && <p className="text-[12px] text-[#ff4e44]">{error}</p>}

        {/* 요청 중에는 disabled로 막고 문구도 바꿔서 진행 중인 걸 알려줌 */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#73756f]">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-bold text-[#111111] underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
