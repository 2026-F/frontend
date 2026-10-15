export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <div className="flex items-center justify-between">
        <h1 className="text-[25px] font-extrabold tracking-[-0.05em]">알림</h1>
        <button
          type="button"
          aria-label="최근 알림 모두 읽음"
          title="최근 알림 모두 읽음"
          disabled
          className="grid h-9 w-9 place-items-center rounded-full text-[#73756f] disabled:cursor-default"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path d="m4.5 12.5 4.5 4.5 10.5-10.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <p className="py-20 text-center text-[14px] text-[#73756f]">최근 알림이 없습니다</p>
    </div>
  );
}
