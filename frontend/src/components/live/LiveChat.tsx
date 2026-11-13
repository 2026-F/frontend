"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHAT_MAX_LENGTH } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLiveChat } from "./useLiveChat";

/**
 * 라이브 영상 위 아래쪽에 겹쳐 놓는 채팅. LivePortraitShell 안에서 쓴다.
 * 대화는 누구나 보고, 입력창은 로그인한 회원에게만 보인다. 권한은 서버가 다시 확인한다.
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
    if (sending) return;
    stickToBottom.current = true;
    if (await send(draft)) {
      setDraft("");
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div
        ref={listRef}
        onScroll={handleScroll}
        aria-live="polite"
        className="scrollbar-hide flex max-h-[30dvh] flex-col gap-1.5 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_24%)]"
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

      {mounted && member ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={CHAT_MAX_LENGTH}
            placeholder="채팅을 입력하세요"
            aria-label="채팅 메시지"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border border-white/25 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-[#b8f53d] focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="shrink-0 rounded-full bg-[#b8f53d] px-4 py-2.5 text-sm font-semibold text-[#171717] disabled:opacity-40"
          >
            전송
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className="rounded-full border border-white/25 bg-black/40 px-4 py-2.5 text-center text-sm text-white/80"
        >
          로그인하고 채팅에 참여하기
        </Link>
      )}
    </div>
  );
}
