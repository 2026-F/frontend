/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // 백엔드/CDN에서 내려오는 작품 이미지 도메인이 정해지면 여기 추가
      // { protocol: 'https', hostname: 'cdn.artbid.example.com' },
    ],
  },
};

export default nextConfig;
