import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
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
