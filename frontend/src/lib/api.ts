import axios from 'axios';
import type {
  Artist,
  ArtistCreateRequest,
  ArtistPageResponse,
  Artwork,
  ArtworkCreateRequest,
  ArtworkDetail,
  ArtworkStatus,
  Auction,
  AuctionCreateRequest,
  AuctionLiveView,
  AuctionStatus,
  Bid,
  BidResult,
  Livestream,
  LoginResponse, // 추가: 로그인 응답 타입
  NotificationPage,
  Notification,
  Member, // 추가: 회원 정보 타입 (회원가입 응답, 회원 조회 응답에 같이 씀)
  PageResponse,
  PresignedUploadResponse,
  StageToken,
  SellerProfile,
  SellerProfileRegisterRequest,
  SellerProfileUpdateRequest,
} from '@/types';

// 서버 렌더링과 브라우저가 사용하는 API 주소를 구분한다. 인증 헤더는 브라우저 요청에만 붙인다.
const isServer = typeof window === 'undefined';

export const api = axios.create({
  baseURL: isServer
    ? process.env.BACKEND_ORIGIN || process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 4000,
  headers: { 'Content-Type': 'application/json' },
});

// 로그인 토큰을 붙이는 인터셉터 (인증 방식이 정해지면 여기서 처리)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('accessToken');
    if (token && !config.headers.has('Authorization')) {
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

export type ArtworkQuery = {
  keyword?: string;
  status?: ArtworkStatus;
  category?: Artwork['category'];
  page?: number;
  size?: number;
  sort?: 'latest' | 'priceAsc' | 'priceDesc';
};

export async function fetchArtworkPage(params?: ArtworkQuery): Promise<PageResponse<Artwork>> {
  const res = await api.get<PageResponse<Artwork>>('/api/artworks', { params });
  return res.data;
}

// 기존 판매자·관리자 호출과의 호환용. 공개 목록은 페이지 응답을 사용한다.
export async function fetchArtworks(params?: ArtworkQuery): Promise<Artwork[]> {
  return (await fetchArtworkPage(params)).content;
}

export async function fetchArtworkDetail(artworkId: number): Promise<ArtworkDetail> {
  const res = await api.get<ArtworkDetail>(`/api/artworks/${artworkId}`);
  return res.data;
}

// -----------------------------------------------------------------------
// 작가(Artist) 검색/등록 — 작품 등록 화면에서 "기존 작가 선택" 또는 "새 작가 등록"에 씀
// -----------------------------------------------------------------------

/** keyword로 작가를 검색. keyword를 비우면 전체 목록(최신순)을 돌려준다. */
export async function fetchArtists(params?: {
  keyword?: string;
  page?: number;
  size?: number;
}): Promise<ArtistPageResponse> {
  const res = await api.get<ArtistPageResponse>('/api/artists', { params });
  return res.data;
}

export async function createArtist(request: ArtistCreateRequest): Promise<Artist> {
  const res = await api.post<Artist>('/api/artists', request);
  return res.data;
}

// -----------------------------------------------------------------------
// 작품 등록 — POST /api/artworks
// 성공하면 생성된 작품(ArtworkDetail, id 포함)을 돌려준다.
// 등록 직후 상태는 PENDING_REVIEW라 어드민 승인 전까지 공개 목록에는 안 보인다.
// -----------------------------------------------------------------------
export async function createArtwork(request: ArtworkCreateRequest): Promise<ArtworkDetail> {
  const res = await api.post<ArtworkDetail>('/api/artworks', request);
  return res.data;
}

// -----------------------------------------------------------------------
// 어드민: 작품 심사(승인/반려), 경매 생성/상태 변경
// -----------------------------------------------------------------------

export async function approveArtwork(artworkId: number): Promise<void> {
  await api.post(`/api/artworks/${artworkId}/approve`);
}

export async function rejectArtwork(artworkId: number): Promise<void> {
  await api.post(`/api/artworks/${artworkId}/reject`);
}

/** 이미 공개된(PREVIEW/IN_AUCTION) 작품을 다시 비공개(REJECTED)로 내린다. */
export async function unpublishArtwork(artworkId: number): Promise<void> {
  await api.post(`/api/artworks/${artworkId}/unpublish`);
}

/** 작품에 경매를 새로 연다. 성공하면 생성된 경매(Auction, id 포함)를 돌려준다. */
export async function createAuction(request: AuctionCreateRequest): Promise<Auction> {
  const res = await api.post<Auction>('/api/auctions', request);
  return res.data;
}

/**
 * 경매 상태를 어드민이 직접 바꾼다 (예: PREVIEW -> ONGOING으로 열기).
 * 지금은 시간에 맞춰 자동으로 상태가 바뀌는 기능이 없어서, 실제로 입찰이 가능하게 하려면
 * 이 함수로 상태를 ONGOING으로 바꿔줘야 한다.
 */
export async function updateAuctionStatus(auctionId: number, status: AuctionStatus): Promise<void> {
  await api.patch(`/api/auctions/${auctionId}/status`, { status });
}

/**
 * 마감된 경매의 작품을 시작가부터 새 경매로 바로 연다. 응답은 새로 만든 경매다.
 * 미결제 낙찰 정산은 서버에서 무효가 되고, 결제 완료나 진행 중인 경매는 409로 거절된다.
 */
export async function reopenAuction(auctionId: number, durationMinutes: number): Promise<Auction> {
  const res = await api.post<Auction>(`/api/auctions/${auctionId}/reopen`, { durationMinutes });
  return res.data;
}

// -----------------------------------------------------------------------
// 인증(로그인/회원가입) 관련 API
// 백엔드: member/controller/AuthController.java, MemberController.java
// -----------------------------------------------------------------------

/**
 * 로그인
 * POST /api/auth/login  body: { email, password }
 * 성공하면 { accessToken, memberId }를 돌려줌
 * 실패(이메일 없음/비밀번호 틀림)하면 백엔드가 404 + "이메일 또는 비밀번호가 올바르지 않습니다." 문자열을 보냄
 * → axios는 2xx가 아니면 에러를 throw하니까, 호출하는 쪽에서 try/catch로 잡으면 됨
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/api/auth/login', { email, password });
  return res.data; // res 전체가 아니라 실제 응답 본문(JSON)만 꺼내서 반환
}

/**
 * 회원가입
 * POST /api/auth/signup  body: { email, password, name }
 * 성공하면 201 Created + 가입된 회원 정보 { id, email, name, role }
 * 이미 가입된 이메일이면 404 + "이미 가입된 이메일입니다: ..." 문자열
 * 주의: 가입만 될 뿐 토큰은 안 줌 → 가입 후 로그인을 한 번 더 호출해야 로그인 상태가 됨
 * 역할(role)은 백엔드에서 항상 BIDDER(입찰자)로 고정해서 만듦
 */
export async function signUp(email: string, password: string, name: string): Promise<Member> {
  const res = await api.post<Member>('/api/auth/signup', { email, password, name });
  return res.data;
}

/**
 * 로그아웃
 * POST /api/auth/logout → 204 No Content
 * JWT는 서버가 따로 저장하지 않는 방식이라 백엔드는 사실 아무 일도 안 함.
 * 진짜 로그아웃은 프론트에서 저장해둔 토큰을 지우는 것(useAuth의 clear)이고,
 * 이 호출은 나중에 백엔드가 토큰 블랙리스트 같은 걸 만들 때를 대비해 맞춰두는 용도
 */
export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}

/**
 * 회원 정보 조회
 * GET /api/members/{id} → { id, email, name, role }
 * 로그인 응답에 이름이 없어서, 로그인 직후 memberId로 이걸 불러 화면에 쓸 이름을 받아옴
 */
export async function fetchMember(memberId: number, accessToken?: string): Promise<Member> {
  const res = await api.get<Member>(`/api/members/${memberId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return res.data;
}

export async function fetchSellerProfile(memberId: number): Promise<SellerProfile> {
  const res = await api.get<SellerProfile>(`/api/sellers/${memberId}`);
  return res.data;
}

export async function registerSellerProfile(
  request: SellerProfileRegisterRequest,
): Promise<SellerProfile> {
  const res = await api.post<SellerProfile>('/api/sellers', request);
  return res.data;
}

export async function updateSellerProfile(
  memberId: number,
  request: SellerProfileUpdateRequest,
): Promise<SellerProfile> {
  const res = await api.patch<SellerProfile>(`/api/sellers/${memberId}`, request);
  return res.data;
}

/** 본인 이름 수정. 이메일과 역할은 변경하지 않는다. */
export async function updateMember(memberId: number, request: { name: string }): Promise<Member> {
  const res = await api.patch<Member>(`/api/members/${memberId}`, request);
  return res.data;
}

/**
 * 에러를 화면에 보여줄 문구로 바꿔주는 도우미 함수
 * 백엔드 GlobalExceptionHandler는 에러 메시지를 JSON이 아닌 "그냥 문자열"로 보내줌
 *   예) "이메일 또는 비밀번호가 올바르지 않습니다."
 * - 문자열 응답과 회원 API의 { code, message } 응답을 지원
 * - 서버가 꺼져 있거나 네트워크 오류라 응답 자체가 없으면 → fallback(기본 문구) 사용
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data) return data;
    if (data && typeof data.message === 'string' && data.message) return data.message;
  }
  return fallback;
}

export async function fetchAuction(auctionId: number, signal?: AbortSignal): Promise<Auction> {
  const res = await api.get<Auction>(`/api/auctions/${auctionId}/current-price`, { signal });
  return res.data;
}

export async function fetchAuctionLive(auctionId: number, signal?: AbortSignal): Promise<AuctionLiveView> {
  const res = await api.get<AuctionLiveView>(`/api/auctions/${auctionId}/live`, { signal });
  return res.data;
}

/** 입찰자는 서버가 로그인 토큰으로 정한다. 요청 본문에는 금액만 보낸다. 비로그인이면 401. */
export async function submitBid(auctionId: number, price: number): Promise<BidResult> {
  const res = await api.post<BidResult>(`/api/auctions/${auctionId}/bids`, { price });
  return res.data;
}

/** 경매의 입찰 기록 (최신순 정렬은 호출하는 쪽에서 한다). 취소된 입찰도 canceled=true로 포함된다. */
export async function fetchBids(auctionId: number, signal?: AbortSignal): Promise<Bid[]> {
  const res = await api.get<Bid[]>(`/api/auctions/${auctionId}/bids`, { signal });
  return res.data;
}

export const AUCTION_LIVE_EVENTS = ['auction-live', 'auction-tick'] as const;

/**
 * 경매 실시간 이벤트 구독 (SSE, GET /ws/auctions/{id}).
 * 백엔드는 이름 있는 이벤트로 AuctionLiveView를 보낸다.
 * - auction-live: 구독 직후 현재 상태(SNAPSHOT), 입찰, 입찰 취소, 마감
 * - auction-tick: 잔여시간 보정용 주기 동기화
 * 이름 없는 이벤트(onmessage)는 이전 화면 호환용이라 구독하지 않는다.
 * onOpen/onError로 연결 상태를 알리고, cleanup 함수를 반환하니 useEffect에서 정리한다.
 */
export function subscribeAuctionEvents(
  auctionId: number,
  onEvent: (view: AuctionLiveView) => void,
  handlers?: { onOpen?: () => void; onError?: () => void },
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const source = new EventSource(`${base}/ws/auctions/${auctionId}`);

  const listener = (event: MessageEvent) => {
    try {
      onEvent(JSON.parse(event.data) as AuctionLiveView);
    } catch {
      // 형식이 맞지 않는 이벤트는 무시한다.
    }
  };
  AUCTION_LIVE_EVENTS.forEach((name) => source.addEventListener(name, listener));
  source.onopen = () => handlers?.onOpen?.();
  source.onerror = () => handlers?.onError?.();

  return () => {
    AUCTION_LIVE_EVENTS.forEach((name) => source.removeEventListener(name, listener));
    source.close();
  };
}

// -----------------------------------------------------------------------
// 알림 (로그인 필요, 본인 알림만). 백엔드: notification/controller/NotificationController.java
// -----------------------------------------------------------------------

export async function fetchNotifications(params?: {
  page?: number;
  size?: number;
}): Promise<NotificationPage> {
  const res = await api.get<NotificationPage>('/api/notifications', { params });
  return res.data;
}

export async function markNotificationRead(notificationId: number): Promise<Notification> {
  const res = await api.patch<Notification>(`/api/notifications/${notificationId}/read`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await api.patch<{ updatedCount: number }>('/api/notifications/read-all');
  return res.data.updatedCount;
}

// -----------------------------------------------------------------------
// 라이브 스트리밍 (AWS IVS Real-Time, 스테이지 기준)
// 방송 시작/종료는 위탁자만, 스테이지 참여 토큰은 위탁자(PUBLISH)·시청자(SUBSCRIBE, 비로그인 포함)
// 둘 다 같은 엔드포인트에서 받는다 — 서버가 요청자가 위탁자 본인인지 보고 역할을 정해준다.
// -----------------------------------------------------------------------

export async function startStream(auctionId: number): Promise<Livestream> {
  const res = await api.post<Livestream>(`/api/auctions/${auctionId}/stream/start`);
  return res.data;
}

export async function endStream(auctionId: number): Promise<void> {
  await api.post(`/api/auctions/${auctionId}/stream/end`);
}

export async function fetchStream(auctionId: number): Promise<Livestream> {
  const res = await api.get<Livestream>(`/api/auctions/${auctionId}/stream`);
  return res.data;
}

export async function issueStageToken(auctionId: number): Promise<StageToken> {
  const res = await api.post<StageToken>(`/api/auctions/${auctionId}/stream/tokens`);
  return res.data;
}

/** 경매 라이브 시청 페이지 QR코드(PNG) 주소. api 인스턴스를 거치지 않는 <img src>라 baseURL을 직접 붙인다. */
export function qrCodeUrl(auctionId: number): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return `${base}/api/auctions/${auctionId}/qrcode`;
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
  const res = await api.post<PresignedUploadResponse>(
    `/api/artworks/${artworkId}/media/presigned-url`,
    null,
    {
      params: { fileName, contentType },
    },
  );
  return res.data;
}

export async function completeMediaUpload(
  artworkId: number,
  objectKey: string,
  mediaType: PresignedUploadResponse['mediaType'],
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
export async function uploadArtworkMedia(
  artworkId: number,
  file: File,
): Promise<PresignedUploadResponse> {
  const contentType = file.type || 'application/octet-stream';
  const presigned = await requestMediaUploadUrl(artworkId, file.name, contentType);

  const putRes = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`미디어 업로드 실패 (status=${putRes.status})`);
  }

  await completeMediaUpload(artworkId, presigned.objectKey, presigned.mediaType);
  return presigned;
}
