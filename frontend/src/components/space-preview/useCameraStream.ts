"use client";

import { useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "starting" | "live" | "error";

/**
 * 후면 카메라를 실시간으로 켜서 <video>에 연결하는 훅
 *
 * 주의: 브라우저는 보안상 HTTPS 또는 localhost에서만 카메라를 열어줍니다.
 * 폰에서 http://192.168.x.x:3000 처럼 접속하면 카메라가 열리지 않습니다.
 */
export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("이 브라우저에서는 카메라를 사용할 수 없어요. (HTTPS 환경에서만 동작합니다)");
        return;
      }

      setStatus("starting");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, // 후면 카메라 우선 (없으면 전면)
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) return;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setStatus("live");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(toCameraErrorMessage(e));
      }
    };

    start();

    // 페이지를 떠나면 카메라를 꺼서 폰 상단의 카메라 사용 표시가 남지 않게 함
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { videoRef, status, error };
}

function toCameraErrorMessage(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  switch (name) {
    case "NotAllowedError":
      return "카메라 권한이 거부됐어요. 브라우저 설정에서 카메라 권한을 허용해주세요.";
    case "NotFoundError":
      return "사용할 수 있는 카메라를 찾지 못했어요.";
    case "NotReadableError":
      return "다른 앱이 카메라를 사용 중이에요. 다른 앱을 종료한 뒤 다시 시도해주세요.";
    default:
      return "카메라를 켜지 못했어요.";
  }
}
