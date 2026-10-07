import Link from "next/link";

const MENU = [
  { label: "나의 입찰 내역", value: "3건" },
  { label: "관심 작품", value: "8개" },
  { label: "주문·배송 현황", value: "1건" },
  { label: "결제 수단 관리", value: "" },
];

export default function MyPage() {
  return (
    <div className="min-h-screen bg-white px-[18px] py-5 text-[#171717]">
      <h1 className="text-[25px] font-black tracking-[-0.05em]">MY</h1>
      <section className="mt-5 rounded-[12px] bg-[#f3f3f3] p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#a8ff00] text-[18px] font-black">김</div>
          <div>
            <p className="text-[15px] font-extrabold">김그림 님</p>
            <p className="mt-1 text-[10px] text-[#777873]">첫 컬렉션을 시작해 보세요.</p>
          </div>
        </div>
        <button type="button" className="mt-4 h-10 w-full rounded-[7px] border border-[#d5d5d1] bg-white text-[11px] font-semibold">프로필 수정</button>
      </section>

      <section className="mt-7">
        <h2 className="text-[17px] font-extrabold">나의 아트비드</h2>
        <div className="mt-3 divide-y divide-[#ededE9] border-y border-[#ededE9]">
          {MENU.map((item) => (
            <Link key={item.label} href="#" className="flex h-[54px] items-center justify-between text-[13px] font-semibold">
              <span>{item.label}</span>
              <span className="text-[#8a8b86]">{item.value} ›</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[17px] font-extrabold">최근 본 작품</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {["#f4cee0", "#d8e2ff", "#d9e9d4"].map((color) => <div key={color} className="aspect-square rounded-[7px]" style={{ backgroundColor: color }} />)}
        </div>
      </section>
    </div>
  );
}
