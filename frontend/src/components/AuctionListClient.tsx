"use client";

import { useMemo, useState } from "react";
import type { AuctionStatus, Lot } from "@/types";
import AuctionCard from "@/components/AuctionCard";

const FILTERS: { key: string; label: string; match: (s: AuctionStatus) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "ongoing", label: "진행중", match: (s) => s === "ONGOING" || s === "EXTENDED" },
  { key: "preview", label: "프리뷰/예정", match: (s) => s === "PREVIEW" || s === "SCHEDULED" },
  { key: "closed", label: "마감", match: (s) => s === "CLOSED" },
];

export default function AuctionListClient({ lots }: { lots: Lot[] }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    return lots.filter((lot) => active.match(lot.auction.status));
  }, [lots, filter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              filter === f.key
                ? "border-accent bg-accent font-semibold text-white"
                : "border-ink-600 text-ink-200 hover:border-accent hover:text-accent-light"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-400">해당하는 경매가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((lot) => (
            <AuctionCard key={lot.artwork.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}
