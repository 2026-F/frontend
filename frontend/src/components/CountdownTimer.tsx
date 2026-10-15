"use client";

import { useEffect, useState } from "react";
import { getRemaining } from "@/lib/format";

export default function CountdownTimer({
  target,
  extended,
  className = "",
  tone = "light",
}: {
  target: string;
  extended?: boolean;
  className?: string;
  tone?: "light" | "dark";
}) {
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    setRemaining(getRemaining(target));
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const urgent = !remaining.isOver && remaining.totalMs <= 30_000;

  if (remaining.isOver) {
    return <span className={`font-semibold ${tone === "dark" ? "text-[#bfc1bb]" : "text-[#73756f]"} ${className}`}>마감되었습니다</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-2 font-display tabular-nums ${
        urgent
          ? tone === "dark" ? "animate-pulse text-[#ff6761]" : "animate-pulse text-[#e0443e]"
          : tone === "dark" ? "text-white" : "text-[#171717]"
      } ${className}`}
    >
      {remaining.days > 0 && `${remaining.days}일 `}
      {String(remaining.hours).padStart(2, "0")}:{String(remaining.minutes).padStart(2, "0")}:
      {String(remaining.seconds).padStart(2, "0")}
      {extended && <span className="badge bg-red-500 text-white">연장됨</span>}
    </span>
  );
}
