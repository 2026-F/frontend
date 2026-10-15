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
    id: "k-rookie-2026",
    eyebrow: "WEEKLY AUCTION",
    title: "2026 K-루키 컬렉션",
    subtitle: "새로운 취향을 발견하는 이번 주의 경매",
    imageUrl: "/artworks/uj-bluebird-2025.jpg",
    intro: "이번 주 위클리 경매에 선보이는 세 작품을 한곳에서 만나보세요. 마음에 드는 작품을 고르고, 각 작품의 경매 일정과 가격을 확인할 수 있습니다.",
    artworkIds: [1, 2, 3],
    primaryLink: { href: "/auctions", label: "위클리 경매 보기" },
  },
  {
    id: "wind-sonata",
    eyebrow: "ARTWORK SPOTLIGHT",
    title: "바람소나타를 만나는 시간",
    subtitle: "이현영, 관조_바람소나타3",
    imageUrl: "/artworks/lee-hyunyoung-wind-sonata-3-2025.webp",
    intro: "이현영의 2025년 작품 ‘관조_바람소나타3’를 자세히 살펴보세요. 작품 이미지와 경매 상태를 확인한 뒤 작품 페이지로 이동할 수 있습니다.",
    artworkIds: [2],
    primaryLink: { href: "/auctions/2", label: "작품 경매 보기" },
    secondaryLink: { href: "/artworks/2?auctionId=2", label: "작품 정보 보기" },
  },
  {
    id: "weekly-picks",
    eyebrow: "WEEKLY PICKS",
    title: "이번 주, 세 가지 시선",
    subtitle: "서로 다른 이미지가 만나는 위클리 경매",
    imageUrl: "/artworks/jeong-kookyoung-chaotic-signal-2024.webp",
    intro: "유제이, 이현영, 정국영의 작품을 차례로 둘러보세요. 작품마다 입찰 시작 시점이 다르므로 상세 페이지에서 상태를 확인할 수 있습니다.",
    artworkIds: [1, 2, 3],
    primaryLink: { href: "/auctions", label: "세 작품 둘러보기" },
  },
  {
    id: "live-collection",
    eyebrow: "LIVE AUCTION",
    title: "한 방송, 세 작품",
    subtitle: "순서대로 이어지는 라이브 경매",
    imageUrl: "/artworks/song-yumi-indras-net-25-16-2025.webp",
    intro: "라이브 경매에서는 세 작품이 정해진 순서로 진행됩니다. 방송 페이지에서 전체 순서와 현재 차례인 작품을 확인하세요.",
    artworkIds: [4, 5, 6],
    primaryLink: { href: "/live/1", label: "라이브 작품 순서 보기" },
    secondaryLink: { href: "/live", label: "라이브 경매 보기" },
  },
  {
    id: "night-scene",
    eyebrow: "ARTWORK SPOTLIGHT",
    title: "도시의 밤을 담다",
    subtitle: "전동민, 달빛 아래 한남동",
    imageUrl: "/artworks/jeon-dongmin-hannam-moonlight-2019.jpg",
    intro: "전동민의 2019년 작품 ‘달빛 아래 한남동’을 살펴보세요. 이 작품이 포함된 라이브 방송에서 다른 출품작과 진행 순서도 확인할 수 있습니다.",
    artworkIds: [6],
    primaryLink: { href: "/live/1", label: "라이브 방송 작품 보기" },
    secondaryLink: { href: "/artworks/6", label: "작품 정보 보기" },
  },
];

export function getPromotion(id: string) {
  return PROMOTIONS.find((promotion) => promotion.id === id);
}
