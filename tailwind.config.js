/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#11151c",
        "panel-2": "#161b24",
        "panel-3": "#1d242f",
        line: "#2a3340",
        accent: "#6366f1",
        "accent-2": "#818cf8",
        ink: "#e6e9ef",
        muted: "#8c97a8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
