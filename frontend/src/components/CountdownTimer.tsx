"use client";

import { useEffect, useState } from "react";
import { getRemaining } from "@/lib/format";

export default function CountdownTimer({
  target,
  extended,
  className = "",
}: {
  target: string;
  extended?: boolean;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    setRemaining(getRemaining(target));
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const urgent = !remaining.isOver && remaining.totalMs <= 30_000;

  if (remaining.isOver) {
    return <span className={`font-semibold text-[#555651] ${className}`}>마감되었습니다</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-2 font-display tabular-nums ${
        urgent ? "animate-pulse text-[#b42318]" : "text-[#171717]"
      } ${className}`}
    >
      {remaining.days > 0 && `${remaining.days}일 `}
      {String(remaining.hours).padStart(2, "0")}:{String(remaining.minutes).padStart(2, "0")}:
      {String(remaining.seconds).padStart(2, "0")}
      {extended && <span className="badge bg-[#a8ff00] text-[#171717]">연장됨</span>}
    </span>
  );
}
