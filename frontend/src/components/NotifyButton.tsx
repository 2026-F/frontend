export default function NotifyButton({ artworkTitle }: { artworkTitle: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={`${artworkTitle} 알림 준비 중`}
      className="rounded-full border border-[#d9dcd2] px-3 py-2 text-xs text-[#73756f]"
    >
      알림 준비 중
    </button>
  );
}
