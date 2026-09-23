export function formatWon(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

export interface Remaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
}

export function getRemaining(target: string | Date, now: Date = new Date()): Remaining {
  const targetMs = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const totalMs = Math.max(0, targetMs - now.getTime());
  const isOver = targetMs <= now.getTime();

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return { totalMs, days, hours, minutes, seconds, isOver };
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
