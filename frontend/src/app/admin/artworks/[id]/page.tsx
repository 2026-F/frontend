import AdminArtworkDetail from '@/components/AdminArtworkDetail';

export default function AdminArtworkPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { page?: string };
}) {
  return (
    <AdminArtworkDetail
      key={params.id}
      artworkId={Number(params.id)}
      originPage={searchParams?.page ?? null}
    />
  );
}
