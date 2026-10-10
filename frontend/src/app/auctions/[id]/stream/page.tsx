"use client";
// Next.js는 기본적으로 서버에서 렌더링하는 컴포넌트인데, 여기선 버튼 클릭·상태(useState) 같은
// 브라우저 상호작용이 필요하니까 맨 위에 "use client"를 붙여서 "이 파일은 브라우저에서 실행되는 컴포넌트다"라고 선언해야 함.

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { endStream, issueStageToken, qrCodeUrl, startStream } from "@/lib/api";
import type { Livestream } from "@/types";
import type { Stage as IvsStage } from "amazon-ivs-web-broadcast";

export default function StreamManagePage() {
  // URL이 /auctions/1/stream 이면 params.id === "1" (문자열)이 들어옴.
  const params = useParams<{ id: string }>();
  const auctionId = Number(params.id);

  const [stream, setStream] = useState<Livestream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<IvsStage | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const watchUrl =
    typeof window !== "undefined" ? `${window.location.origin}/auctions/${auctionId}/watch` : "";

  // 스테이지에 PUBLISH로 들어간다: 카메라·마이크를 잡고, 참여 토큰을 받아 join한다.
  // 남의 영상은 받을 필요가 없으니(자기 화면만 쏘면 됨) shouldSubscribeToParticipant는 NONE.
  const joinStageAsPublisher = async () => {
    const { Stage, LocalStageStream, SubscribeType } = await import("amazon-ivs-web-broadcast");

    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
    <div className="container-page py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <p className="eyebrow">Broadcast</p>
        <h1 className="font-display text-2xl font-semibold text-cream">경매 #{auctionId} 방송 관리</h1>

        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-ink-700 bg-black">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        </div>

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
              <p className="font-semibold text-cream">참여자 시청 링크</p>
              <a href={watchUrl} target="_blank" className="break-all text-accent-light underline">
                {watchUrl}
              </a>
              <img src={qrCodeUrl(auctionId)} alt="시청 페이지 QR 코드" className="mt-2 rounded bg-cream p-2" width={180} height={180} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
