import Link from 'next/link';
import DataNotice from '@/components/DataNotice';
export default function LiveEventPage() {
  return (
    <div className="container-page py-6">
      <Link href="/live" className="text-sm">
        ← 라이브 경매
      </Link>
      <h1 className="mt-5 text-xl font-bold">라이브 작품 편성</h1>
      <DataNotice
        message="여러 작품의 방송 편성 안내는 준비 중입니다. 이 주소는 실제 경매나 방송을 나타내지 않습니다."
        retry={false}
      />
    </div>
  );
}
