// 만든 이미지를 사용자 기기에 저장합니다.
// - 모바일: 공유 시트(Web Share API)를 띄움 → '이미지 저장'으로 사진 앱에 바로 저장 가능
// - 공유를 지원하지 않는 브라우저(대부분의 PC): 파일 다운로드

export type SaveResult = "shared" | "downloaded" | "cancelled";

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // 다운로드가 시작될 시간을 준 뒤 해제
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveOrShareImage(blob: Blob, fileName: string): Promise<SaveResult> {
  const file = new File([blob], fileName, { type: blob.type });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "내 공간에 걸어본 작품" });
      return "shared";
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 실패가 아니므로 그냥 종료
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      // 그 외 공유 실패는 다운로드로 대체
    }
  }

  download(blob, fileName);
  return "downloaded";
}
