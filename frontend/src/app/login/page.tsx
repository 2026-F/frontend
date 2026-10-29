'use client'; // 입력값 상태(useState), 클릭 이벤트, 페이지 이동을 쓰니까 클라이언트 컴포넌트

import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { errorMessage, fetchMember, login } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { LoginResponse } from '@/types';

// Next.js App Router 규칙: src/app/login/page.tsx → 주소 /login
export default function LoginPage() {
  const router = useRouter(); // 로그인 성공 후 다른 페이지로 보낼 때 사용
  const setAuth = useAuth((s) => s.setAuth); // 전역 저장소의 "로그인 처리" 함수만 꺼내옴

  // 입력창 값과 화면 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // 에러 문구 (없으면 null → 안 보임)
  const [loading, setLoading] = useState(false); // 요청 중이면 버튼 비활성화 (중복 클릭 방지)
  const [canRetry, setCanRetry] = useState(false);
  const pending = useRef<LoginResponse | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const unsubscribe = useAuth.subscribe((state, previous) => {
      if (state.accessToken !== previous.accessToken || state.member?.id !== previous.member?.id) {
        generation.current += 1;
        pending.current = null;
        busy.current = false;
        setCanRetry(false);
        setLoading(false);
      }
    });
    return () => {
      unsubscribe();
      generation.current += 1;
      pending.current = null;
    };
  }, []);

  const resetPending = () => {
    generation.current += 1;
    pending.current = null;
    setCanRetry(false);
    setError(null);
  };

  const completeLogin = async (credentials: LoginResponse, attempt: number) => {
    try {
      const member = await fetchMember(credentials.memberId, credentials.accessToken);
      if (generation.current !== attempt) return;
      pending.current = null;
      setCanRetry(false);
      setAuth(credentials.accessToken, member);
      router.push('/mypage');
    } catch (cause) {
      if (generation.current !== attempt) return;
      if (axios.isAxiosError(cause) && cause.response?.status === 401) {
        pending.current = null;
        setCanRetry(false);
        setError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        setCanRetry(true);
        setError('로그인 인증은 완료했지만 회원정보를 불러오지 못했습니다. 다시 시도해 주세요.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // form은 기본적으로 제출 시 페이지를 새로고침함 → 그걸 막고 우리가 직접 처리
    e.preventDefault();
    if (busy.current) return;
    useAuth.getState().clear();
    resetPending();
    const attempt = generation.current;
    busy.current = true;
    setLoading(true);

    try {
      // 회원 조회 완료 전에는 토큰을 로그인 화면 메모리에만 보관한다.
      const credentials = await login(email, password);
      if (generation.current !== attempt) return;
      pending.current = credentials;
      await completeLogin(credentials, attempt);
    } catch (err) {
      // 로그인 실패(비밀번호 틀림 등) 또는 서버 꺼짐 → 메시지 표시
      if (generation.current === attempt)
        setError(errorMessage(err, '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      // 성공이든 실패든 끝나면 버튼 다시 활성화
      if (generation.current === attempt) {
        busy.current = false;
        setLoading(false);
      }
    }
  };

  const retry = async () => {
    if (busy.current || !pending.current) return;
    const attempt = generation.current;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      await completeLogin(pending.current, attempt);
    } finally {
      if (generation.current === attempt) {
        busy.current = false;
        setLoading(false);
      }
    }
  };

  return (
    <div className="px-5 pb-12 pt-10 text-[#171717]">
      <h1 className="text-[24px] font-extrabold tracking-[-0.04em]">로그인</h1>
      <p className="mt-2 text-[13px] text-[#73756f]">입찰하려면 로그인이 필요해요.</p>

      {/* onSubmit: 버튼 클릭이나 입력창에서 Enter를 눌러도 handleSubmit 실행 */}
      <form onSubmit={handleSubmit} aria-busy={loading} className="mt-8 flex flex-col gap-3">
        {/* type="email" + required: 브라우저가 빈 값이나 이메일 형식 오류를 먼저 막아줌
            (백엔드는 형식 오류를 500으로 보내서, 프론트에서 걸러주는 게 중요) */}
        <input
          type="email"
          required
          placeholder="이메일"
          aria-label="이메일"
          autoComplete="username"
          disabled={loading}
          value={email}
          onChange={(e) => {
            resetPending();
            setEmail(e.target.value);
          }}
          className="h-12 rounded-[8px] border border-[#dfe0da] px-4 text-[14px] outline-none focus:border-[#111111]"
        />
        {/* type="password": 입력한 글자를 ●●● 로 가려줌 */}
        <input
          type="password"
          required
          placeholder="비밀번호"
          aria-label="비밀번호"
          autoComplete="current-password"
          disabled={loading}
          value={password}
          onChange={(e) => {
            resetPending();
            setPassword(e.target.value);
          }}
          className="h-12 rounded-[8px] border border-[#dfe0da] px-4 text-[14px] outline-none focus:border-[#111111]"
        />

        {/* 에러가 있을 때만 빨간 글씨로 표시 */}
        {error && (
          <p role="alert" className="text-[12px] text-[#c13b32]">
            {error}
          </p>
        )}
        {canRetry && (
          <button
            type="button"
            disabled={loading}
            onClick={retry}
            className="min-h-11 text-[13px] font-bold underline disabled:opacity-50"
          >
            회원정보 다시 불러오기
          </button>
        )}

        {/* 요청 중에는 disabled로 막고 문구도 바꿔서 진행 중인 걸 알려줌 */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 rounded-[8px] bg-[#a8ff00] text-[14px] font-extrabold disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#73756f]">
        아직 회원이 아니신가요?{' '}
        <Link href="/signup" className="font-bold text-[#111111] underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
