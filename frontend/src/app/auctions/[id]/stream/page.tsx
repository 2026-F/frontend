"use client";
// Next.js는 기본적으로 서버에서 렌더링하는 컴포넌트인데, 여기선 버튼 클릭·상태(useState) 같은
// 브라우저 상호작용이 필요하니까 맨 위에 "use client"를 붙여서 "이 파일은 브라우저에서 실행되는 컴포넌트다"라고 선언해야 함.

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api"; // 프로젝트에 이미 있는 axios 인스턴스 (baseURL이 자동으로 붙음)
import type { Livestream } from "@/types";

export default function StreamManagePage() {
  // URL이 /auctions/1/stream 이면 params.id === "1" (문자열)이 들어옴.
  // 폴더 이름을 [id]로 만들었기 때문에 이 키 이름도 반드시 "id"여야 함.
  const params = useParams<{ id: string }>();
  const auctionId = params.id;

  // React의 상태(state): 값이 바뀌면 화면이 자동으로 다시 그려짐.
  // stream: 방송 시작 API 응답(채널 정보)을 담아둘 곳. 처음엔 아직 방송 안 켰으니 null.
  const [stream, setStream] = useState<Livestream | null>(null);
  // loading: 버튼 연타 방지용. API 호출 중일 때 true로 바꿔서 버튼을 잠깐 비활성화.
  const [loading, setLoading] = useState(false);
  // error: API 호출이 실패했을 때 화면에 보여줄 에러 메시지.
  const [error, setError] = useState<string | null>(null);

  // 참여자가 접속할 시청 페이지 링크를 미리 만들어둠.
  // typeof window !== "undefined" 체크는 "지금 이 코드가 브라우저에서 실행 중이냐"를 확인하는 것.
  // Next.js는 처음에 서버에서도 한 번 렌더링을 시도하는데, 서버에는 window 객체가 없어서
  // 이 체크 없이 window.location을 쓰면 에러가 남.
  const watchUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auctions/${auctionId}/watch`
      : "";

  // "방송 시작" 버튼을 눌렀을 때 실행되는 함수.
  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      // 백엔드 StreamingController의 POST /api/auctions/{auctionId}/stream/start 호출.
      // 성공하면 Livestream 엔티티(JSON)가 그대로 응답으로 옴 → 그걸 res.data로 받음.
      const res = await api.post<Livestream>(`/api/auctions/${auctionId}/stream/start`);
      setStream(res.data); // 화면 갱신 → status가 "LIVE"로 바뀌면서 아래 OBS 정보 블록이 나타남
    } catch (e: any) {
      // 백엔드가 IllegalStateException("이미 진행 중인 스트림이 있습니다") 같은 걸 던지면
      // Spring 기본 에러 응답 형태(message 필드)를 가정하고 꺼내봄. 없으면 기본 문구 표시.
      setError(e.response?.data?.message ?? "방송 시작에 실패했습니다.");
    } finally {
      // 성공하든 실패하든 로딩 상태는 항상 풀어줘야 버튼이 다시 눌림.
      setLoading(false);
    }
  };

  // "방송 종료" 버튼.
  const handleEnd = async () => {
    setLoading(true);
    setError(null);
    try {
      // endStream은 응답 body가 없는(void) API라서 res.data를 안 씀.
      await api.post(`/api/auctions/${auctionId}/stream/end`);
      // 서버를 다시 조회하지 않고, 화면에서만 status를 "ENDED"로 바꿔서 즉시 버튼 상태를 갱신.
      // (prev가 null이면 그대로 null 유지, 있으면 status만 바꾼 새 객체로 교체)
      setStream((prev) => (prev ? { ...prev, status: "ENDED" } : prev));
    } catch (e: any) {
      setError(e.response?.data?.message ?? "방송 종료에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-2xl font-bold">경매 #{auctionId} 방송 관리</h1>

      <div className="flex gap-3">
        {/* 이미 LIVE 상태면 "방송 시작"은 눌러도 의미 없으니 비활성화 */}
        <button
          onClick={handleStart}
          disabled={loading || stream?.status === "LIVE"}
          className="rounded-lg bg-brand px-4 py-2 text-brand-foreground disabled:opacity-40"
        >
          방송 시작
        </button>
        {/* LIVE가 아니면(아직 시작 전이거나 이미 종료됐으면) "방송 종료"도 비활성화 */}
        <button
          onClick={handleEnd}
          disabled={loading || stream?.status !== "LIVE"}
          className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40"
        >
          방송 종료
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* stream이 있고 LIVE 상태일 때만 OBS 정보 + 시청 링크 블록을 보여줌 */}
      {stream && stream.status === "LIVE" && (
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 text-sm">
          <div>
            <p className="font-semibold">OBS 등 방송 송출 프로그램에 아래 값을 입력하세요</p>

            <p className="mt-1 text-gray-500">서버(ingest) 주소</p>
            {/* IvsChannelClient 주석에 적혀있던 규칙 그대로:
                rtmps://{ingestEndpoint}:443/app/ 가 OBS의 "서버" 칸에 들어가는 값이고,
                streamKey는 별도로 "스트림 키" 칸에 따로 입력함 (한 문자열로 합치는 게 아님) */}
            <code className="block break-all rounded bg-gray-100 p-2">
              rtmps://{stream.ingestEndpoint}:443/app/
            </code>

            <p className="mt-2 text-gray-500">스트림 키</p>
            <code className="block break-all rounded bg-gray-100 p-2">{stream.streamKey}</code>
          </div>

          <div>
            <p className="font-semibold">참여자 시청 링크</p>
            <a href={watchUrl} target="_blank" className="break-all text-blue-600 underline">
              {watchUrl}
            </a>
            {/* 직접 QR 라이브러리 설치할 필요 없이, 무료 QR 생성 API를 이미지 URL로 바로 사용.
                data 파라미터에 시청 링크를 URL 인코딩해서 넣으면 그 이미지가 QR 코드로 나옴. */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(watchUrl)}`}
              alt="시청 페이지 QR 코드"
              className="mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}