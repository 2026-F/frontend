"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { fetchStream, issueStageToken } from "@/lib/api";
import type { Stage as IvsStage, StageParticipantInfo, StageStream } from "amazon-ivs-web-broadcast";

export default function WatchStreamPage() {
  const params = useParams<{ id: string }>();
  const auctionId = Number(params.id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<IvsStage | null>(null);
  const [status, setStatus] = useState("연결 중...");

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
            setStatus("재생 중");
          },
        );

        stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state: string) => {
          if (cancelled) return;
          if (state === "disconnected") {
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
    <div className="container-page py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="eyebrow">Live</p>
        <h1 className="font-display text-2xl font-semibold text-cream">경매 #{auctionId} 라이브</h1>
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-ink-700 bg-black">
          <video ref={videoRef} controls playsInline className="h-full w-full" />
        </div>
        <p className="text-sm text-ink-400">{status}</p>
      </div>
    </div>
  );
}
