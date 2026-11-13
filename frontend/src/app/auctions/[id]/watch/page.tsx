"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchStream, issueStageToken } from "@/lib/api";
import LiveChat from "@/components/live/LiveChat";
import LivePortraitShell,{ LiveBadge, LiveScrim } from "@/components/live/LivePortraitShell";
import type { Stage as IvsStage, StageParticipantInfo, StageStream } from "amazon-ivs-web-broadcast";

export default function WatchStreamPage() {
  const params = useParams<{ id: string }>();
  const auctionId = Number(params.id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<IvsStage | null>(null);
  const [status, setStatus] = useState("연결 중...");
  const [playing, setPlaying] = useState(false);
  // 소리가 켜진 영상은 브라우저가 자동 재생을 막는다. 음소거로 시작하고 버튼으로 켠다.
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const stream = await fetchStream(auctionId);
        if (cancelled) return;

        if (stream.status !== "LIVE") {
          setStatus("아직 방송이 시작되지 않았습니다.");
          return;
        }

        // 비로그인이어도 호출 가능 — 서버가 위탁자 본인이 아니면 자동으로 SUBSCRIBE 토큰을 준다.
        const { token } = await issueStageToken(auctionId);
        if (cancelled) return;

        const { Stage, SubscribeType, StageEvents } = await import("amazon-ivs-web-broadcast");

        // 송출할 영상은 없고(stageStreamsToPublish: []), 위탁자의 화면·음성만 받는다.
        const strategy = {
          stageStreamsToPublish: () => [],
          shouldPublishParticipant: () => false,
          shouldSubscribeToParticipant: () => SubscribeType.AUDIO_VIDEO,
        };

        const stage = new Stage(token, strategy);
        stageRef.current = stage;

        stage.on(
          StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED,
          (participant: StageParticipantInfo, streams: StageStream[]) => {
            if (participant.isLocal) return;
            const mediaStream = new MediaStream(streams.map((s) => s.mediaStreamTrack));
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => {});
            }
            setPlaying(true);
            setStatus("재생 중");
          },
        );

        stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state: string) => {
          if (cancelled) return;
          if (state === "disconnected") {
            setPlaying(false);
            setStatus("방송 연결이 끊어졌습니다.");
          }
        });

        await stage.join();
      } catch {
        if (!cancelled) setStatus("방송 정보를 불러오지 못했습니다.");
      }
    };

    load();

    return () => {
      cancelled = true;
      stageRef.current?.leave();
      stageRef.current = null;
    };
  }, [auctionId]);

  return (
    <LivePortraitShell>
      {/* 송출 영상이 가로여도 가운데를 잘라 세로 화면을 꽉 채운다. */}
      <video ref={videoRef} autoPlay muted={muted} playsInline className="absolute inset-0 h-full w-full object-cover" />
      <LiveScrim />

      <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <Link
          href={`/auctions/${auctionId}`}
          aria-label="경매로 돌아가기"
          className="-ml-1 grid h-9 w-9 place-items-center rounded-full bg-black/30"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <LiveBadge live={playing} />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">경매 #{auctionId} 라이브</p>
        {playing && (
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold"
          >
            {muted ? "소리 켜기" : "소리 끄기"}
          </button>
        )}
      </div>

      {!playing && (
        <p className="absolute inset-x-6 top-1/3 text-center text-sm text-white/80">{status}</p>
      )}

      <LiveChat auctionId={auctionId} />
    </LivePortraitShell>
  );
}
