// 폰 카메라 원본 사진은 4000px 이상·수 MB라 그대로 쓰면 화면 합성/저장이 느려집니다.
// 긴 변을 maxSize 이하로 줄이고 JPEG로 다시 인코딩해서 가볍게 만듭니다.

export interface ResizedImage {
  /** 리사이즈된 이미지 데이터 */
  blob: Blob;
  /** <img src>에 바로 쓸 수 있는 object URL — 다 쓰면 URL.revokeObjectURL()로 해제해야 함 */
  url: string;
  width: number;
  height: number;
}

const DEFAULT_MAX_SIZE = 2048;
const JPEG_QUALITY = 0.9;

// 사진을 화면에 그릴 수 있는 형태로 읽어옵니다.
// createImageBitmap + imageOrientation: "from-image"를 쓰면
// 폰으로 세로로 찍은 사진이 옆으로 누워 보이는 문제(EXIF 회전)도 같이 해결됩니다.
async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // 일부 구형 브라우저는 옵션을 지원하지 않음 → 아래 <img> 방식으로 대체
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };
    img.src = url;
  });
}

export async function resizeImageFile(
  file: File,
  maxSize: number = DEFAULT_MAX_SIZE,
): Promise<ResizedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 선택할 수 있습니다.");
  }

  const source = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리할 수 없습니다.");
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close(); // ImageBitmap 메모리 해제

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("이미지 변환에 실패했습니다."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  return { blob, url: URL.createObjectURL(blob), width, height };
}
