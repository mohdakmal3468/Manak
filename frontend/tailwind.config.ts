import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f8fc",
        ink: "#1e293b",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      boxShadow: {
        card: "0 12px 32px rgba(30, 41, 59, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
