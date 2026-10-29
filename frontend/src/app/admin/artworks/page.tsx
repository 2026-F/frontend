import { Suspense } from 'react';
import AdminArtworkList from '@/components/AdminArtworkList';

export default function AdminArtworksPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-5">
          심사 목록을 준비하는 중...
        </p>
      }
    >
      <AdminArtworkList />
    </Suspense>
  );
}
