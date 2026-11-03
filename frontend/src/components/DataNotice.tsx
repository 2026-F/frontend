'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function DataNotice({
  message,
  retry = true,
}: {
  message: string;
  retry?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div role="status" className="my-4 rounded-xl bg-[#f7f8f4] p-5 text-sm text-[#555751]">
      <p>{message}</p>
      {retry && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
          className="mt-3 rounded-lg border border-[#d9dcd2] px-4 py-2 font-semibold disabled:opacity-50"
        >
          {pending ? '다시 불러오는 중...' : '다시 시도'}
        </button>
      )}
    </div>
  );
}
