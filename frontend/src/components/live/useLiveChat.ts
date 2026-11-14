"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchChatMessages, sendChatMessage, subscribeAuctionChat } from "@/lib/api";
import type { ChatMessage } from "@/types";

// 화면에 들고 있는 최대 메시지 수. 방송이 길어져도 목록이 끝없이 커지지 않게 오래된 것부터 버린다.
const MAX_KEPT = 200;

function merge(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.id - b.id).slice(-MAX_KEPT);
}

function sendErrorMessage(error: any) {
  const status = error?.response?.status;
  if (status === 401) return "로그인 후 채팅을 보낼 수 있습니다.";
  if (status === 409 && error.response?.data?.code === "CHAT_NICKNAME_REQUIRED") {
    return "닉네임을 먼저 정해주세요.";
  }
  if (status === 409) return "방송 중에만 채팅을 보낼 수 있습니다.";
  if (status === 429) return "메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요.";
  if (status === 400) return error.response?.data?.message ?? "메시지를 확인해주세요.";
  return "메시지를 보내지 못했습니다.";
}

/**
 * 경매 라이브 채팅. 최근 대화를 불러오고 SSE로 새 메시지를 받는다.
 * 내가 보낸 메시지는 전송 응답과 SSE 양쪽으로 오므로 id로 합친다.
 */
export function useLiveChat(auctionId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const request = new AbortController();

    const loadRecent = async () => {
      try {
        const recent = await fetchChatMessages(auctionId, undefined, request.signal);
        if (!active) return;
        setMessages((current) => merge(current, recent));
        setLoadFailed(false);
      } catch {
        if (active) setLoadFailed(true);
      }
    };

    setMessages([]);
    // 처음 연결될 때와 끊겼다 다시 붙을 때마다 최근 대화를 다시 받아 빈 구간을 메운다.
    const unsubscribe = subscribeAuctionChat(
      auctionId,
      (message) => {
        if (active && message.auctionId === auctionId) {
          setMessages((current) => merge(current, [message]));
        }
      },
      { onOpen: () => void loadRecent() },
    );
    void loadRecent();

    return () => {
      active = false;
      request.abort();
      unsubscribe();
    };
  }, [auctionId]);

  /** 보냈으면 true. 실패하면 sendError에 안내 문구가 들어간다. */
  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return false;
      setSending(true);
      setSendError(null);
      try {
        const sent = await sendChatMessage(auctionId, trimmed);
        setMessages((current) => merge(current, [sent]));
        return true;
      } catch (error) {
        setSendError(sendErrorMessage(error));
        return false;
      } finally {
        setSending(false);
      }
    },
    [auctionId],
  );

  return { messages, loadFailed, sending, sendError, send };
}
