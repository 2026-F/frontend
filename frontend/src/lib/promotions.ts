export type Promotion = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  intro: string;
  artworkIds: number[];
  primaryLink: { href: string; label: string };
  secondaryLink?: { href: string; label: string };
};

// 실제 작품 사진을 사용하는 화면 시연용 프로모션입니다.
export const PROMOTIONS: Promotion[] = [
  {
    id: 'k-rookie-2026',
    eyebrow: 'WEEKLY AUCTION',
    title: '2026 K-루키 컬렉션',
    subtitle: '새로운 취향을 소개할 기획전 · 준비 중',
    imageUrl: '/artworks/uj-bluebird-2025.jpg',
    intro:
      '새로운 취향을 소개하는 컬렉션 기획입니다. 출품작과 경매 일정은 아직 연결되지 않았습니다.',
    artworkIds: [],
    primaryLink: { href: '/auctions', label: '위클리 경매 보기' },
  },
  {
    id: 'wind-sonata',
    eyebrow: 'ARTWORK SPOTLIGHT',
    title: '바람소나타를 만나는 시간',
    subtitle: '이현영, 관조_바람소나타3',
    imageUrl: '/artworks/lee-hyunyoung-wind-sonata-3-2025.webp',
    intro:
      '이현영의 ‘관조_바람소나타3’를 소개하는 편집 콘텐츠입니다. 현재 출품이나 경매 상태를 나타내지 않습니다.',
    artworkIds: [],
    primaryLink: { href: '/categories', label: '작품 경매 보기' },
    secondaryLink: { href: '/categories', label: '작품 정보 보기' },
  },
  {
    id: 'weekly-picks',
    eyebrow: 'WEEKLY PICKS',
    title: '이번 주, 세 가지 시선',
    subtitle: '서로 다른 이미지를 소개할 기획전 · 준비 중',
    imageUrl: '/artworks/jeong-kookyoung-chaotic-signal-2024.webp',
    intro:
      '서로 다른 작품의 시선을 소개하는 기획입니다. 실제 출품 연결과 일정 안내는 준비 중입니다.',
    artworkIds: [],
    primaryLink: { href: '/auctions', label: '세 작품 둘러보기' },
  },
  {
    id: 'live-collection',
    eyebrow: 'LIVE AUCTION',
    title: '한 방송, 세 작품',
    subtitle: '여러 작품을 소개할 방송 기획 · 준비 중',
    imageUrl: '/artworks/song-yumi-indras-net-25-16-2025.webp',
    intro:
      '여러 작품을 한 방송에서 소개하는 기획입니다. 방송 편성과 출품 순서는 아직 제공하지 않습니다.',
    artworkIds: [],
    primaryLink: { href: '/live', label: '라이브 작품 순서 보기' },
    secondaryLink: { href: '/live', label: '라이브 경매 보기' },
  },
  {
    id: 'night-scene',
    eyebrow: 'ARTWORK SPOTLIGHT',
    title: '도시의 밤을 담다',
    subtitle: '전동민, 달빛 아래 한남동',
    imageUrl: '/artworks/jeon-dongmin-hannam-moonlight-2019.jpg',
    intro:
      '전동민의 ‘달빛 아래 한남동’을 소개하는 편집 콘텐츠입니다. 실제 출품이나 라이브 방송에는 연결되지 않았습니다.',
    artworkIds: [],
    primaryLink: { href: '/live', label: '라이브 방송 작품 보기' },
    secondaryLink: { href: '/categories', label: '작품 정보 보기' },
  },
];

export function getPromotion(id: string) {
  return PROMOTIONS.find((promotion) => promotion.id === id);
}
