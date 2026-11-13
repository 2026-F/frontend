"use client";
// Next.js는 기본적으로 서버에서 렌더링하는 컴포넌트인데, 여기선 버튼 클릭·상태(useState) 같은
// 브라우저 상호작용이 필요하니까 맨 위에 "use client"를 붙여서 "이 파일은 브라우저에서 실행되는 컴포넌트다"라고 선언해야 함.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { endStream, issueStageToken, qrCodeUrl, startStream } from "@/lib/api";
import LivePortraitShell, { LiveBadge, LiveScrim } from "@/components/live/LivePortraitShell";
import type { Livestream } from "@/types";
import type { Stage as IvsStage } from "amazon-ivs-web-broadcast";

// 쇼츠처럼 세로(9:16)로 찍는다. ideal이라 카메라가 못 맞추면 가까운 값으로 열리고,
// 그 경우에도 미리보기와 시청 화면이 object-cover로 가운데를 잘라 세로를 채운다.
const PORTRAIT_VIDEO: MediaTrackConstraints = {
  width: { ideal: 720 },
  height: { ideal: 1280 },
  aspectRatio: { ideal: 9 / 16 },
};

export default function StreamManagePage() {
  // URL이 /auctions/1/stream 이면 params.id === "1" (문자열)이 들어옴.
  const params = useParams<{ id: string }>();
  const auctionId = Number(params.id);

  const [stream, setStream] = useState<Livestream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<IvsStage | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isLive = stream?.status === "LIVE";
  const watchUrl =
    typeof window !== "undefined" ? `${window.location.origin}/auctions/${auctionId}/watch` : "";

  // 스테이지에 PUBLISH로 들어간다: 카메라·마이크를 잡고, 참여 토큰을 받아 join한다.
  // 남의 영상은 받을 필요가 없으니(자기 화면만 쏘면 됨) shouldSubscribeToParticipant는 NONE.
  const joinStageAsPublisher = async () => {
    const { Stage, LocalStageStream, SubscribeType } = await import("amazon-ivs-web-broadcast");

    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: PORTRAIT_VIDEO, audio: true });
    mediaStreamRef.current = mediaStream;
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }

    const videoTrack = mediaStream.getVideoTracks()[0];
    const audioTrack = mediaStream.getAudioTracks()[0];
    const localVideo = new LocalStageStream(videoTrack);
    const localAudio = new LocalStageStream(audioTrack);

    const { token } = await issueStageToken(auctionId);

    const strategy = {
      stageStreamsToPublish: () => [localVideo, localAudio],
      shouldPublishParticipant: () => true,
      shouldSubscribeToParticipant: () => SubscribeType.NONE,
    };

    const stage = new Stage(token, strategy);
    stageRef.current = stage;
    await stage.join();
  };

  const leaveStage = () => {
    stageRef.current?.leave();
    stageRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startStream(auctionId);
      setStream(data);
      await joinStageAsPublisher();
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
      leaveStage();
      await endStream(auctionId);
      setStream((prev) => (prev ? { ...prev, status: "ENDED" } : prev));
      setShowShare(false);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "방송 종료에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 페이지를 벗어날 때 카메라·스테이지 연결을 정리한다.
  useEffect(() => {
    return () => leaveStage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LivePortraitShell>
      <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
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
        <LiveBadge live={isLive} />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">경매 #{auctionId} 방송</p>
        {isLive && (
          <>
            <button
              type="button"
              onClick={() => setShowShare((value) => !value)}
              className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold"
            >
              공유
            </button>
            <button
              type="button"
              onClick={handleEnd}
              disabled={loading}
              className="rounded-full bg-[#e0443e] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              종료
            </button>
          </>
        )}
      </div>

      {isLive && showShare && (
        <div className="absolute inset-x-4 top-[72px] rounded-2xl bg-black/70 p-4 text-sm backdrop-blur">
          <p className="font-semibold">참여자 시청 링크</p>
          <a href={watchUrl} target="_blank" className="break-all text-[#d6fa76] underline">
            {watchUrl}
          </a>
          <img src={qrCodeUrl(auctionId)} alt="시청 페이지 QR 코드" className="mt-3 rounded bg-white p-2" width={140} height={140} />
        </div>
      )}

      {!isLive && (
        <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4 text-center">
          <p className="text-sm text-white/80">
            {stream?.status === "ENDED" ? "방송을 종료했습니다." : "세로 화면으로 송출됩니다. 휴대폰을 세워서 시작하세요."}
          </p>
          <button onClick={handleStart} disabled={loading} className="btn-primary">
            {loading ? "준비 중..." : "방송 시작"}
          </button>
        </div>
      )}

      {error && (
        <p className="absolute inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] rounded-xl bg-[#e0443e]/90 px-4 py-2.5 text-center text-sm">
          {error}
        </p>
      )}
    </LivePortraitShell>
  );
}
