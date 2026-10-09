"use client";
// Next.js는 기본적으로 서버에서 렌더링하는 컴포넌트인데, 여기선 버튼 클릭·상태(useState) 같은
// 브라우저 상호작용이 필요하니까 맨 위에 "use client"를 붙여서 "이 파일은 브라우저에서 실행되는 컴포넌트다"라고 선언해야 함.

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api"; // 프로젝트에 이미 있는 axios 인스턴스 (baseURL이 자동으로 붙음)
import type { Livestream } from "@/types";

export default function StreamManagePage() {
  // URL이 /auctions/1/stream 이면 params.id === "1" (문자열)이 들어옴.
  const params = useParams<{ id: string }>();
  const auctionId = params.id;

  const [stream, setStream] = useState<Livestream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchUrl =
    typeof window !== "undefined" ? `${window.location.origin}/auctions/${auctionId}/watch` : "";

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<Livestream>(`/api/auctions/${auctionId}/stream/start`);
      setStream(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "방송 시작에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/api/auctions/${auctionId}/stream/end`);
      setStream((prev) => (prev ? { ...prev, status: "ENDED" } : prev));
    } catch (e: any) {
      setError(e.response?.data?.message ?? "방송 종료에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <p className="eyebrow">Broadcast</p>
        <h1 className="font-display text-2xl font-semibold text-cream">경매 #{auctionId} 방송 관리</h1>

        <div className="flex gap-3">
          <button onClick={handleStart} disabled={loading || stream?.status === "LIVE"} className="btn-primary">
            방송 시작
          </button>
          <button onClick={handleEnd} disabled={loading || stream?.status !== "LIVE"} className="btn-outline">
            방송 종료
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {stream && stream.status === "LIVE" && (
          <div className="card-surface flex flex-col gap-4 p-5 text-sm">
            <div>
              <p className="font-semibold text-cream">OBS 등 방송 송출 프로그램에 아래 값을 입력하세요</p>

              <p className="mt-2 text-ink-400">서버(ingest) 주소</p>
              <code className="block break-all rounded bg-ink-900 p-2 text-cream">
                rtmps://{stream.ingestEndpoint}:443/app/
              </code>

              <p className="mt-2 text-ink-400">스트림 키</p>
              <code className="block break-all rounded bg-ink-900 p-2 text-cream">{stream.streamKey}</code>
            </div>

            <div>
              <p className="font-semibold text-cream">참여자 시청 링크</p>
              <a href={watchUrl} target="_blank" className="break-all text-accent-light underline">
                {watchUrl}
              </a>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(watchUrl)}`}
                alt="시청 페이지 QR 코드"
                className="mt-2 rounded bg-cream p-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
