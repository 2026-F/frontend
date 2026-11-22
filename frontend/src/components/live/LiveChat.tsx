"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHAT_MAX_LENGTH, errorMessage, fetchMember, updateMember } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLiveChat } from "./useLiveChat";

const NICKNAME_MAX_LENGTH = 20;

const inputClass =
  "min-w-0 flex-1 rounded-full border border-white/25 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-[#b8f53d] focus:outline-none";
const submitClass =
  "shrink-0 rounded-full bg-[#b8f53d] px-4 py-2.5 text-sm font-semibold text-[#171717] disabled:opacity-40";

/**
 * 라이브 영상 위 아래쪽에 겹쳐 놓는 채팅. LivePortraitShell 안에서 쓴다.
 * 대화는 누구나 보고, 입력창은 닉네임을 정한 로그인 회원에게만 보인다. 권한은 서버가 다시 확인한다.
 */
export default function LiveChat({ auctionId, above }: { auctionId: number; above?: React.ReactNode }) {
  const member = useAuth((state) => state.member);
  const { messages, loadFailed, sending, sendError, send } = useLiveChat(auctionId);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // 사용자가 위로 올려 지난 대화를 보는 중이면 새 메시지가 와도 끌어내리지 않는다.
  const stickToBottom = useRef(true);

  // 로그인 상태는 localStorage에서 복원되므로, 서버 렌더링 결과와 어긋나지 않게 마운트 뒤에 반영한다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const list = listRef.current;
    if (list) {
      stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (sending || !text) return;
    stickToBottom.current = true;
    // 보내는 순간 입력창을 비운다. 응답을 기다리는 동안 새로 쓴 내용을 응답 처리에서 지우지 않기 위함이다.
    setDraft("");
    const sent = await send(text);
    if (!sent) {
      // 실패하면 보낸 내용을 돌려놓되, 그 사이 새로 쓴 내용이 있으면 그것을 남긴다.
      setDraft((current) => (current ? current : text));
    }
  };

  return (
    <div className="scrollbar-hide absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100dvh-64px)] flex-col gap-2 overflow-y-auto px-3 pb-[max(12px,env(safe-area-inset-bottom))] [@media(max-height:500px)]:max-w-[420px]">
      <div
        ref={listRef}
        onScroll={handleScroll}
        aria-live="polite"
        className="scrollbar-hide flex max-h-[30dvh] shrink-0 flex-col gap-1.5 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_24%)] [@media(max-height:500px)]:max-h-[18dvh]"
      >
        {loadFailed && messages.length === 0 && (
          <p className="text-xs text-white/70">대화를 불러오지 못했습니다.</p>
        )}
        {messages.map((message) => (
          <p key={message.id} className="w-fit max-w-[85%] break-words rounded-2xl bg-black/35 px-3 py-1.5 text-[13px] leading-snug">
            {message.host && (
              <span className="mr-1.5 rounded bg-[#b8f53d] px-1 py-0.5 text-[10px] font-bold text-[#171717]">진행자</span>
            )}
            <span className={`mr-1.5 font-semibold ${message.senderId === member?.id ? "text-[#d6fa76]" : "text-white/70"}`}>
              {message.senderName}
            </span>
            {message.content}
          </p>
        ))}
      </div>

      {/* 대화 목록과 입력창 사이 자리. 입찰 막대처럼 채팅과 함께 아래에 붙어야 하는 것을 넣는다. */}
      {above}

      {sendError && <p className="text-xs text-[#ffb4b0]">{sendError}</p>}

      {!mounted || !member ? (
        <Link
          href="/login"
          className="rounded-full border border-white/25 bg-black/40 px-4 py-2.5 text-center text-sm text-white/80"
        >
          로그인하고 채팅에 참여하기
        </Link>
      ) : !member.nickname ? (
        <NicknameForm />
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={CHAT_MAX_LENGTH}
            placeholder="채팅을 입력하세요"
            aria-label="채팅 메시지"
            autoComplete="off"
            className={inputClass}
          />
          <button type="submit" disabled={sending || !draft.trim()} className={submitClass}>
            전송
          </button>
        </form>
      )}
    </div>
  );
}

/**
 * 채팅에는 실명 대신 닉네임이 보인다. 닉네임이 없는 회원에게 입력창 자리에서 바로 정하게 한다.
 * 로그인할 때 저장해 둔 회원 정보가 오래됐을 수 있어, 먼저 서버에서 닉네임이 이미 있는지 확인한다.
 */
function NicknameForm() {
  const member = useAuth((state) => state.member);
  const accessToken = useAuth((state) => state.accessToken);
  const setAuth = useAuth((state) => state.setAuth);
  const [nickname, setNickname] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const memberId = member?.id;

  useEffect(() => {
    if (!memberId || !accessToken) return;
    let active = true;
    fetchMember(memberId)
      .then((latest) => {
        if (active && latest.nickname) setAuth(accessToken, latest);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [memberId, accessToken, setAuth]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = nickname.trim();
    if (!memberId || !accessToken || saving) return;
    if (trimmed.length < 2) {
      setError("닉네임은 2자 이상으로 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setAuth(accessToken, await updateMember(memberId, { nickname: trimmed }));
    } catch (cause) {
      setError(errorMessage(cause, "닉네임을 저장하지 못했습니다. 다시 시도해주세요."));
    } finally {
      setSaving(false);
    }
  };

  if (checking) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <p className="text-xs text-white/80">채팅에 표시할 닉네임을 정해주세요. 이름 대신 닉네임이 보입니다.</p>
      <div className="flex items-center gap-2">
        <input
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setError(null);
          }}
          maxLength={NICKNAME_MAX_LENGTH}
          placeholder="닉네임 (2~20자)"
          aria-label="닉네임"
          autoComplete="off"
          className={inputClass}
        />
        <button type="submit" disabled={saving || !nickname.trim()} className={submitClass}>
          {saving ? "저장 중..." : "정하기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-[#ffb4b0]">
          {error}
        </p>
      )}
    </form>
  );
}
