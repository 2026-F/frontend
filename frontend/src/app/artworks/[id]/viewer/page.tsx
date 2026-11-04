'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ArtworkModelViewer from '@/components/artwork-model/ArtworkModelViewer';
import { fetchArtworkDetail } from '@/lib/api';
import { resolveModelSource, type ModelSource } from '@/lib/artworkModel';
import { requestFailure } from '@/lib/requestFailure';

export default function ArtworkViewerPage() {
  const params = useParams<{ id: string }>();
  const artworkId = Number(params.id);
  const [source, setSource] = useState<ModelSource | null>(null);
  const [title, setTitle] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailure(null);
    setSource(null);
    setTitle('');
    async function load() {
      try {
        if (!Number.isSafeInteger(artworkId) || artworkId <= 0) throw new Error('invalid-id');
        const artwork = await fetchArtworkDetail(artworkId);
        const resolved = await resolveModelSource(artwork);
        if (!cancelled) {
          setTitle(artwork.title);
          setSource(resolved);
        }
      } catch (error) {
        if (!cancelled) setFailure(requestFailure(error, '요청한 작품을 불러올 수 없습니다.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [artworkId, attempt]);
  return (
    <div className="container-page flex flex-col gap-4 py-6 text-[#171717]">
      <p className="eyebrow">3D Viewer</p>
      <h1 className="text-xl font-semibold">{title || '작품'} 3D 뷰어</h1>
      {loading ? (
        <p>불러오는 중...</p>
      ) : failure ? (
        <div role="status">
          <p>{failure}</p>
          <button className="btn-outline mt-3" onClick={() => setAttempt((v) => v + 1)}>
            다시 시도
          </button>
        </div>
      ) : source ? (
        <>
          <div className="aspect-square overflow-hidden rounded-2xl border bg-[#f7f8f4]">
            <ArtworkModelViewer
              source={source}
              alt={`${title} 3D 모델`}
              autoRotate
              cameraOrbit="25deg 80deg auto"
            />
          </div>
          <Link href={`/artworks/${artworkId}/preview`} className="btn-outline">
            이 작품 내 공간에 걸어보기
          </Link>
          {source.kind === 'canvas' && (
            <p className="text-xs text-[#73756f]">
              작품 사진을 캔버스 모델에 입힌 미리보기입니다. 공간 인식이나 자동 실측 기능은
              아닙니다.
            </p>
          )}
        </>
      ) : (
        <p>이 작품에 표시할 3D 모델이나 평면 작품 이미지가 없습니다.</p>
      )}
    </div>
  );
}
