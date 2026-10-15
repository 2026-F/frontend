import Link from "next/link";

const STATS = [
  { label: "입찰", value: 5 },
  { label: "컬렉션", value: 1 },
  { label: "관심", value: 24 },
];

const MENU = ["주문 및 배송 현황", "결제 대기", "환경 설정"];
const RECENT_COLORS = ["#f4cee0", "#d8e2ff", "#d9e9d4"];

export default function MyPage() {
  return (
    <div className="min-h-screen bg-white px-5 pb-12 pt-6 text-[#171717]">
      <section className="relative overflow-hidden rounded-[18px] bg-[#1b1d19] p-5 text-white">
        <div
          className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full border-[24px] border-white/5"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#b8f53d] text-[21px] font-black text-[#171717]">
            김
          </div>
          <div className="min-w-0">
            <p className="text-[18px] font-extrabold tracking-[-0.04em]">김그림 님</p>
            <p className="mt-1 text-xs text-[#c5c8bf]">첫 컬렉션을 시작해 보세요.</p>
          </div>
        </div>
        <button
          type="button"
          className="relative mt-6 flex h-11 w-full items-center justify-center rounded-[10px] border border-white/30 text-[13px] font-bold text-white transition-colors hover:bg-white/10"
        >
          프로필 수정
        </button>
      </section>

      <section
        aria-label="나의 경매 현황"
        className="mt-9 grid grid-cols-3 rounded-[18px] bg-[#f7f8f4] py-5 text-center"
      >
        {STATS.map((stat) => (
          <button key={stat.label} type="button" disabled aria-label={`${stat.label} ${stat.value}건, 상세 화면 준비 중`} className="flex flex-col items-center justify-center text-center disabled:cursor-default">
            <p className="text-[13px] font-semibold text-[#73756f]">{stat.label}</p>
            <p className="mt-3 text-[25px] font-extrabold leading-none tracking-[-0.05em]">
              {stat.value}
            </p>
          </button>
        ))}
      </section>

      <nav aria-label="마이페이지 메뉴" className="mt-7">
        {MENU.map((label, index) => (
          <Link
            key={label}
            href="#"
            className={`flex min-h-[70px] items-center justify-between text-[16px] font-bold ${index < MENU.length - 1 ? "border-b border-[#dedfd9]" : ""}`}
          >
            {label}
            <span className="text-[25px] font-normal leading-none" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </nav>

      <section className="mt-9">
        <div className="flex items-end justify-between">
          <h2 className="text-[21px] font-extrabold tracking-[-0.045em]">최근 본 작품</h2>
          <Link
            href="/auctions"
            className="pb-0.5 text-xs font-semibold text-[#666862] underline decoration-[#b7b9b2] underline-offset-4"
          >
            작품 둘러보기
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {RECENT_COLORS.map((color, index) => (
            <div
              key={color}
              className="aspect-[4/5] overflow-hidden rounded-[12px]"
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">최근 본 작품 자리 {index + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="mt-9 w-full rounded-[10px] border border-[#d9dcd2] px-4 py-3 text-[13px] font-semibold text-[#73756f]"
      >
        로그아웃
      </button>
    </div>
  );
}
