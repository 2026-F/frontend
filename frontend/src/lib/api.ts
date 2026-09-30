import axios from "axios";
import type { Artwork, Auction, BidResult, PresignedUploadResponse } from "@/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 4000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 로그인 토큰을 붙이는 인터셉터 (인증 방식이 정해지면 여기서 처리)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 공통 에러 처리(401 리다이렉트 등)는 백엔드 응답 포맷이 정해지면 여기서 구현
    return Promise.reject(error);
  },
);

// -----------------------------------------------------------------------
// 도메인별 API 함수. 백엔드에 아직 없는 엔드포인트(경매 목록, 작품 상세 등)는
// 화면(lib/lots.ts)에서 이 함수 호출 실패 시 lib/mock.ts 데이터로 대체합니다.
// 나중에 엔드포인트가 추가되면 이 파일만 채우면 되도록 시그니처를 미리 맞춰뒀습니다.
// -----------------------------------------------------------------------

export async function fetchArtworks(): Promise<Artwork[]> {
  const res = await api.get<Artwork[]>("/api/artworks");
  return res.data;
}

export async function fetchAuction(auctionId: number): Promise<Auction> {
  const res = await api.get<Auction>(`/api/auctions/${auctionId}/current-price`);
  return res.data;
}

export async function submitBid(auctionId: number, bidderId: number, price: number): Promise<BidResult> {
  const res = await api.post<BidResult>(`/api/auctions/${auctionId}/bids`, { bidderId, price });
  return res.data;
}

/**
 * 경매 실시간 이벤트 구독 (SSE, GET /ws/auctions/{id}).
 * 백엔드 BidService가 아직 AuctionSseRegistry.broadcast()를 호출하지 않아서
 * (README의 TODO 항목) 지금은 이벤트가 오지 않을 수 있습니다. 그런 상황에서도
 * 화면이 실시간처럼 보이도록 호출하는 쪽(BidPanel)에서 폴링을 함께 둡니다.
 * 연결이 끊기면 onError로 알리고, cleanup 함수를 반환하니 useEffect에서 정리하세요.
 */
export function subscribeAuctionEvents(
  auctionId: number,
  onEvent: (data: unknown) => void,
  onError?: () => void,
): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const source = new EventSource(`${base}/ws/auctions/${auctionId}`);

  source.onmessage = (event) => {
    try {
      onEvent(JSON.parse(event.data));
    } catch {
      onEvent(event.data);
    }
  };
  source.onerror = () => {
    onError?.();
  };

  return () => source.close();
}

// -----------------------------------------------------------------------
// 작품 미디어 업로드 (사진 / 영상 / 3D 모델)
// 1) presigned URL 발급 → 2) S3에 직접 PUT → 3) /complete로 업로드 완료 알림
// /complete에는 1)에서 받은 objectKey와 mediaType을 그대로 돌려보내야 한다.
// (백엔드가 완료 시점에는 contentType을 알 수 없어 mediaType으로 PHOTO/VIDEO를 구분함 — 백엔드 이슈 #11)
// -----------------------------------------------------------------------

export async function requestMediaUploadUrl(
  artworkId: number,
  fileName: string,
  contentType: string,
): Promise<PresignedUploadResponse> {
  const res = await api.post<PresignedUploadResponse>(`/api/artworks/${artworkId}/media/presigned-url`, null, {
    params: { fileName, contentType },
  });
  return res.data;
}

export async function completeMediaUpload(
  artworkId: number,
  objectKey: string,
  mediaType: PresignedUploadResponse["mediaType"],
): Promise<void> {
  await api.post(`/api/artworks/${artworkId}/media/complete`, null, {
    params: { objectKey, mediaType },
  });
}

/**
 * 파일 하나를 업로드하고 완료 처리까지 한 번에 수행한다.
 * S3 PUT은 공용 axios 인스턴스(기본 Content-Type: application/json, timeout 4초)를 쓰면
 * 서명 불일치·타임아웃이 나기 때문에 fetch로 따로 보낸다.
 */
export async function uploadArtworkMedia(artworkId: number, file: File): Promise<PresignedUploadResponse> {
  const contentType = file.type || "application/octet-stream";
  const presigned = await requestMediaUploadUrl(artworkId, file.name, contentType);

  const putRes = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`미디어 업로드 실패 (status=${putRes.status})`);
  }

  await completeMediaUpload(artworkId, presigned.objectKey, presigned.mediaType);
  return presigned;
}
