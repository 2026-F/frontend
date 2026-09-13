"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Hls from "hls.js";
import { api } from "@/lib/api";
import type { Livestream } from "@/types";

export default function WatchStreamPage() {
  const params = useParams<{ id: string }>();
  const auctionId = params.id;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("연결 중...");

  useEffect(() => {
    let hls: Hls | null = null;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get<Livestream>(`/api/auctions/${auctionId}/stream`);
        if (cancelled) return;

        if (res.data.status !== "LIVE" || !res.data.playbackUrl) {
          setStatus("아직 방송이 시작되지 않았습니다.");
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
          hls = new Hls({ liveSyncDuration: 2 });
          hls.loadSource(res.data.playbackUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
            setStatus("재생 중");
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) setStatus(`재생 오류: ${data.details}`);
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = res.data.playbackUrl;
          video.play();
          setStatus("재생 중 (Safari)");
        } else {
          setStatus("이 브라우저는 HLS 재생을 지원하지 않습니다.");
        }
      } catch {
        setStatus("방송 정보를 불러오지 못했습니다.");
      }
    };

    load();

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [auctionId]);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-bold">경매 #{auctionId} 라이브</h1>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} controls playsInline className="h-full w-full" />
      </div>
      <p className="text-sm text-gray-500">{status}</p>
    </div>
  );
}