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
    return <span className={`font-semibold text-ink-300 ${className}`}>마감되었습니다</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-2 font-display tabular-nums ${
        urgent ? "animate-pulse text-red-400" : "text-cream"
      } ${className}`}
    >
      {remaining.days > 0 && `${remaining.days}일 `}
      {String(remaining.hours).padStart(2, "0")}:{String(remaining.minutes).padStart(2, "0")}:
      {String(remaining.seconds).padStart(2, "0")}
      {extended && <span className="badge bg-red-500 text-white">연장됨</span>}
    </span>
  );
}
