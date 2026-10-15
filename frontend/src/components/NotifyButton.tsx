"use client";

import { useState } from "react";

export default function NotifyButton({ artworkTitle }: { artworkTitle: string }) {
  const [selected, setSelected] = useState(false);

  return (
    <button
      type="button"
      aria-label={`${artworkTitle} 알림 ${selected ? "끄기" : "받기"}`}
      aria-pressed={selected}
      onClick={() => setSelected((current) => !current)}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors ${
        selected
          ? "border-[#b8f53d] bg-[#b8f53d] text-[#171717]"
          : "border-[#d9dcd2] bg-white text-[#454641]"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
        <path
          d="M18 8.5a6 6 0 0 0-12 0c0 7-2.5 7-2.5 8.5h17C20.5 15.5 18 15.5 18 8.5Z"
          fill={selected ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </button>
  );
}
