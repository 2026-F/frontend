// 배치 미리보기 화면(배경 + 3D 작품)을 화면에 보이는 그대로 한 장의 이미지로 합칩니다.
// 배경은 실시간 카메라(<video>)든 앨범 사진(<img>)이든 똑같이 처리합니다.

interface Size {
  width: number;
  height: number;
}

const DEFAULT_MAX_OUTPUT_SIZE = 2048;
const JPEG_QUALITY = 0.92;

/**
 * CSS object-fit: cover와 똑같이, 원본(src)에서 상자(box)에 보이는 부분만 잘라낼 영역을 계산
 * (화면에서 카메라 영상 양옆/위아래가 잘려 보이는 것과 똑같이 저장되도록)
 */
function coverCrop(src: Size, box: Size) {
  const scale = Math.max(box.width / src.width, box.height / src.height);
  const sw = box.width / scale;
  const sh = box.height / scale;
  return { sx: (src.width - sw) / 2, sy: (src.height - sh) / 2, sw, sh };
}

interface ComposeLayersOptions {
  /** 배경 (카메라 <video> 또는 사진 <img>) */
  background: CanvasImageSource;
  /** 배경 원본 해상도 */
  backgroundSize: Size;
  /** 화면에 보이는 미리보기 영역 크기 (CSS px) */
  stageSize: Size;
  /** 미리보기 영역 전체를 덮는 위 레이어 (3D 뷰어를 투명 배경으로 렌더링한 이미지) */
  overlay: CanvasImageSource;
  /** 결과 이미지 긴 변 최대 길이 */
  maxOutputSize?: number;
}

/**
 * 배경 + 3D 렌더 이미지를 화면에 보이는 그대로 한 장으로 합칩니다.
 * 3D 레이어는 미리보기 영역과 같은 비율로 렌더링되므로 결과 크기에 맞춰 그대로 늘려 그립니다.
 */
export async function composeLayers({
  background,
  backgroundSize,
  stageSize,
  overlay,
  maxOutputSize = DEFAULT_MAX_OUTPUT_SIZE,
}: ComposeLayersOptions): Promise<Blob> {
  const bg = coverCrop(backgroundSize, stageSize);
  let pxPerStagePx = bg.sw / stageSize.width;
  const longest = Math.max(bg.sw, bg.sh);
  if (longest > maxOutputSize) pxPerStagePx *= maxOutputSize / longest;

  const width = Math.round(stageSize.width * pxPerStagePx);
  const height = Math.round(stageSize.height * pxPerStagePx);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 합성할 수 없어요.");

  ctx.drawImage(background, bg.sx, bg.sy, bg.sw, bg.sh, 0, 0, width, height);
  ctx.drawImage(overlay, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("이미지 저장에 실패했어요."))),
        "image/jpeg",
        JPEG_QUALITY,
      );
    } catch {
      reject(new Error("작품 이미지 보안 설정 때문에 저장할 수 없어요. (이미지 서버 CORS 설정 필요)"));
    }
  });
}
