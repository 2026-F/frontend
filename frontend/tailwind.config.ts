import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 살짝 보라 기운이 도는 다크 톤 (완전 무채색 블랙보다 트렌디한 느낌)
        ink: {
          DEFAULT: "#0B0B14",
          50: "#F5F3F8",
          100: "#E7E3ED",
          200: "#C7C0D1",
          300: "#9A90A8",
          400: "#6E6580",
          500: "#4A4358",
          600: "#322C42",
          700: "#211D2E",
          800: "#14121F",
          900: "#0B0B14",
        },
        // 포인트 컬러: 비비드한 바이올렛 + 핑크 (그라데이션용)
        accent: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        pink: {
          DEFAULT: "#EC4899",
        },
        cream: "#F5F3F8",
        // 기존 코드 호환용
        brand: {
          DEFAULT: "#8B5CF6",
          foreground: "#0B0B14",
        },
      },
      fontFamily: {
        display: ["'Pretendard Variable'", "Pretendard", "-apple-system", "system-ui", "sans-serif"],
        sans: ["'Pretendard Variable'", "Pretendard", "-apple-system", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
