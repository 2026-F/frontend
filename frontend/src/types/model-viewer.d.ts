// <model-viewer>는 우리가 직접 만든 컴포넌트가 아니라 @google/model-viewer가
// 브라우저에 등록하는 "커스텀 엘리먼트"라서, JSX에서 쓰려면 TypeScript한테
// "이런 태그가 있고 이런 속성을 받는다"고 미리 알려줘야 함.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        poster?: string;
      };
    }
  }
}

export {};