import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      primary: "#1B5E20", secondary: "#2E7D32", accent: "#43A047",
      mist: "#F1F8E9", line: "#C8E6C9", ink: "#212121", muted: "#616161",
      warn: "#E65100", amber: { score: "#F9A825" },
    },
    fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"], display: ["var(--font-display)", "system-ui", "sans-serif"] },
    boxShadow: { soft: "0 8px 30px -12px rgba(27,94,32,0.25)" },
  } },
  plugins: [],
};
export default config;
