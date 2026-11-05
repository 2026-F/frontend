'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  errorMessage,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import type { Notification, NotificationPage } from '@/types';

const PAGE_SIZE = 20;

// 서버가 내려준 linkUrl은 앱 안 경로일 때만 이동한다. 외부 주소로의 이동은 막는다.
function internalPath(linkUrl: string | null): string | null {
  if (!linkUrl || !linkUrl.startsWith('/') || linkUrl.startsWith('//')) return null;
  return linkUrl;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { member, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setReady(true), []);

  const isLoggedIn = Boolean(member && accessToken);

  const load = useCallback((target: number) => {
    setError(null);
    fetchNotifications({ page: target, size: PAGE_SIZE })
      .then(setData)
      .catch((cause) => setError(errorMessage(cause, '알림을 불러오지 못했습니다.')));
  }, []);

  useEffect(() => {
    if (ready && isLoggedIn) load(page);
  }, [ready, isLoggedIn, page, load]);

  const markOneRead = (target: Notification) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            content: prev.content.map((item) =>
              item.id === target.id ? { ...item, read: true } : item,
            ),
          }
        : prev,
    );
  };

  const handleOpen = async (target: Notification) => {
    if (!target.read) {
      try {
        await markNotificationRead(target.id);
        markOneRead(target);
      } catch (cause) {
        setError(errorMessage(cause, '알림을 읽음으로 바꾸지 못했습니다.'));
      }
    }
    const path = internalPath(target.linkUrl);
    if (path) router.push(path);
  };

  const handleReadAll = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      load(page);
    } catch (cause) {
      setError(errorMessage(cause, '모두 읽음 처리에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <div className="flex items-center justify-between">
        <h1 className="text-[25px] font-extrabold tracking-[-0.05em]">
          알림
          {data && data.unreadCount > 0 && (
            <span className="ml-2 align-middle text-[13px] font-bold text-[#637e27]">
              {data.unreadCount}
            </span>
          )}
        </h1>
        <button
          type="button"
          aria-label="최근 알림 모두 읽음"
          title="최근 알림 모두 읽음"
          onClick={handleReadAll}
          disabled={!isLoggedIn || busy || !data || data.unreadCount === 0}
          className="grid h-9 w-9 place-items-center rounded-full text-[#171717] disabled:cursor-default disabled:text-[#c3c5be]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
              d="m4.5 12.5 4.5 4.5 10.5-10.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {!isLoggedIn ? (
        <div className="py-20 text-center">
          <p className="text-[14px] text-[#73756f]">
            로그인하면 입찰, 낙찰, 결제 알림을 볼 수 있어요
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center rounded-[8px] bg-[#a8ff00] px-6 text-[14px] font-extrabold"
          >
            로그인
          </Link>
        </div>
      ) : error ? (
        <p role="alert" className="py-20 text-center text-[14px] text-[#d33a2c]">
          {error}
        </p>
      ) : !data ? (
        <p className="py-20 text-center text-[14px] text-[#73756f]">불러오는 중...</p>
      ) : data.content.length === 0 ? (
        <p className="py-20 text-center text-[14px] text-[#73756f]">새 알림이 없습니다</p>
      ) : (
        <>
          <ul className="mt-5 flex flex-col divide-y divide-[#eeefea]">
            {data.content.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(item)}
                  className={`flex w-full flex-col gap-1 py-4 text-left ${item.read ? 'text-[#73756f]' : ''}`}
                >
                  <span className="flex items-center gap-2 text-[14px] font-bold">
                    {!item.read && (
                      <span aria-label="안 읽음" className="h-2 w-2 rounded-full bg-[#a8ff00]" />
                    )}
                    {item.title}
                  </span>
                  <span className="text-[13px] leading-5">{item.message}</span>
                  <span className="text-[11px] text-[#9b9d95]">
                    {formatDateTime(item.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && (
            <nav
              aria-label="알림 페이지"
              className="mt-5 flex items-center justify-center gap-4 text-sm"
            >
              <button
                type="button"
                className="btn-outline"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                이전
              </button>
              <span>
                {page + 1} / {data.totalPages}
              </span>
              <button
                type="button"
                className="btn-outline"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                다음
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
