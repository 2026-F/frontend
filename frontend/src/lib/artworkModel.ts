// 작품을 3D로 보여줄 때 어떤 모델을 쓸지 정하는 공용 로직. 3D 뷰어와 '내 공간에 걸어보기'가 함께 쓴다.
import type { ArtworkCategory, ArtworkDetail } from "@/types";

// 작품 전용 3D 스캔 모델이 없을 때 쓰는 "빈 캔버스" 모델.
// 1×1×1 박스이고, 앞면 재질 이름이 "Painting"이라 여기에 작품 이미지를 텍스처로 붙인다.
// 실제 크기(cm)는 model-viewer의 scale 속성으로 맞춘다. (public/models/canvas.glb)
export const CANVAS_MODEL_URL = "/models/canvas.glb";
export const PAINTING_MATERIAL = "Painting";
const DEFAULT_DEPTH_CM = 3; // 캔버스 프레임 두께 기본값
const DEFAULT_WIDTH_CM = 60; // 크기 정보가 없을 때 가로 기준값 (세로는 이미지 비율로 계산)

// 이미지·크기 정보도 없을 때 뷰어 동작만 확인하는 샘플 (3D 뷰어에서만 사용)
export const FALLBACK_MODEL_URL = "/duck.glb";

// 캔버스(평면 액자) 모드는 평면 작품에만 쓴다. 조각·공예 같은 입체 작품에 사진을 액자처럼 붙이면 어색하니까 제외
// (작품 상세 페이지의 "3D로 보기" 버튼 노출 조건과 같은 규칙)
const SOLID_CATEGORIES: ArtworkCategory[] = ["SCULPTURE", "CRAFT"];
export const isFlatCategory = (category: ArtworkCategory | null | undefined) =>
  !category || !SOLID_CATEGORIES.includes(category);

export type ModelSource =
  | { kind: "model"; url: string } // 작품 전용 3D 모델(.glb)
  | { kind: "canvas"; imageUrl: string; scale: string } // 캔버스 모델 + 작품 사진
  | { kind: "fallback"; url: string }; // 샘플 모델

/** model-viewer에 넣을 모델 파일 주소 */
export const modelUrlOf = (source: ModelSource) => (source.kind === "canvas" ? CANVAS_MODEL_URL : source.url);

function loadImageRatio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalHeight / img.naturalWidth || 1);
    img.onerror = () => resolve(1);
    img.src = url;
  });
}

// 작품 크기(cm)를 model-viewer scale("가로 세로 두께", 단위 m)로 변환
async function canvasScale(artwork: ArtworkDetail, imageUrl: string) {
  let width = artwork.widthCm;
  let height = artwork.heightCm;
  if (!width || !height) {
    const ratio = await loadImageRatio(imageUrl);
    width = width ?? (height ? height / ratio : DEFAULT_WIDTH_CM);
    height = height ?? width * ratio;
  }
  const depth = artwork.depthCm || DEFAULT_DEPTH_CM;
  return [width, height, depth].map((cm) => (cm / 100).toFixed(4)).join(" ");
}

/**
 * 작품을 어떤 3D 모델로 보여줄지 정한다.
 * 1순위: 작품 전용 3D 모델(MODEL_3D). apiModelUrl(미디어 API)이 있으면 그걸, 없으면 작품 상세 media에서 찾음
 *        (목업 조각·공예 작품은 lib/mock.ts에서 MODEL_3D(.glb)를 넣어둬서 여기로 들어옴)
 * 2순위: 평면 작품이면 대표 사진을 캔버스 모델 앞면에 붙임
 * 둘 다 안 되면 allowFallback일 때만 샘플 모델, 아니면 null
 */
export async function resolveModelSource(
  artwork: ArtworkDetail | null,
  options: { apiModelUrl?: string | null; allowFallback?: boolean } = {},
): Promise<ModelSource | null> {
  const detailModel = artwork?.media
    .filter((m) => m.mediaType === "MODEL_3D" && m.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const modelUrl = options.apiModelUrl ?? detailModel?.url;
  if (modelUrl) return { kind: "model", url: modelUrl };

  const photo = artwork?.media
    .filter((m) => m.mediaType === "PHOTO" && m.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const imageUrl = photo?.url ?? artwork?.imageUrl;
  if (artwork && imageUrl && isFlatCategory(artwork.category)) {
    return { kind: "canvas", imageUrl, scale: await canvasScale(artwork, imageUrl) };
  }

  return options.allowFallback ? { kind: "fallback", url: FALLBACK_MODEL_URL } : null;
}

/** 작품 상세 정보만으로(비동기 계산 없이) 3D로 보여줄 수 있는지. 버튼 노출 조건에 쓴다 */
export function canShowIn3d(artwork: ArtworkDetail, primaryImage: string | null | undefined) {
  const hasModel = artwork.media.some((item) => item.mediaType === "MODEL_3D" && (item.url || item.sourceUrl));
  return hasModel || (Boolean(primaryImage) && isFlatCategory(artwork.category));
}
