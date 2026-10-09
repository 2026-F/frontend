/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // 백엔드/CDN에서 내려오는 작품 이미지 도메인이 정해지면 여기 추가
      // { protocol: 'https', hostname: 'cdn.artbid.example.com' },
    ],
  },
  async rewrites() {
    // BACKEND_ORIGIN이 설정된 환경(Vercel)에서만 프록시를 켠다.
    // 로컬 개발에서는 이 값이 없어서 그냥 NEXT_PUBLIC_API_BASE_URL(localhost:8080)을 직접 쓴다.
    const backendOrigin = process.env.BACKEND_ORIGIN;
    if (!backendOrigin) {
      return [];
    }
    return [
      { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` },
      { source: "/ws/:path*", destination: `${backendOrigin}/ws/:path*` },
    ];
  },
};

export default nextConfig;
