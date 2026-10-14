export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <div className="flex h-12 items-center gap-3 rounded-[12px] border border-[#e8e9e4] bg-[#f7f8f4] px-4">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-[#73756f]">
          <circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m15.5 15.5 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          aria-label="검색어"
          placeholder="작품, 작가를 검색해 보세요"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9b9d95]"
        />
      </div>

      <section className="mt-9">
        <h2 className="text-[18px] font-bold tracking-[-0.04em]">최근 검색 기록</h2>
        <p className="py-16 text-center text-[14px] text-[#73756f]">최근 검색 기록이 없습니다</p>
      </section>
    </div>
  );
}
