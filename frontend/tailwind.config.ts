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
        // 브랜드 컬러 확정되면 여기 교체
        brand: {
          DEFAULT: "#111111",
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
