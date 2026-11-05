'use client';

// 경매를 다시 열 때 마감 날짜를 고르는 입력. 개별 다시 열기와 일괄 다시 열기가 함께 쓴다.

const DAY_MS = 24 * 60 * 60_000;
// 백엔드 AuctionReopenService.MAX_DURATION_MINUTES와 같은 값
const MAX_REOPEN_DAYS = 30;

const PRESETS = [
  { label: '1주', days: 7 },
  { label: '2주', days: 14 },
];

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function reopenEndAfterDays(days: number): string {
  return toLocalInputValue(new Date(Date.now() + days * DAY_MS));
}

/**
 * 고른 마감 날짜를 서버가 받는 진행 시간(분)으로 바꾼다. 범위를 벗어나면 null.
 * 지금부터의 간격으로 보내므로 서버와 브라우저의 시간대가 달라도 같은 시점에 마감된다.
 */
export function reopenDurationMinutes(endAt: string): number | null {
  const minutes = Math.round((new Date(endAt).getTime() - Date.now()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > MAX_REOPEN_DAYS * 24 * 60) return null;
  return minutes;
}

export const REOPEN_END_ERROR = `마감 날짜는 지금 이후 ${MAX_REOPEN_DAYS}일 이내로 골라 주세요.`;

export default function ReopenEndPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold">
        경매 마감
        <input
          type="datetime-local"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 h-10 w-full rounded-[8px] border border-[#dfe0da] bg-white px-2 text-[13px] outline-none focus:border-[#171717]"
        />
      </label>
      <div className="mt-2 flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            disabled={disabled}
            onClick={() => onChange(reopenEndAfterDays(preset.days))}
            className="h-9 flex-1 rounded-[8px] border border-[#dfe0da] bg-white text-[12px] font-bold disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
