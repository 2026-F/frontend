import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <h1 className="text-xl font-bold">요청한 페이지를 찾을 수 없습니다.</h1>
      <p className="mt-3 text-sm">작품이나 경매가 없거나 잘못된 주소입니다.</p>
      <Link href="/categories" className="btn-outline mt-6">
        작품 둘러보기
      </Link>
    </div>
  );
}
