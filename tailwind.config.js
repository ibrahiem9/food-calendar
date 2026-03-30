/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Manrope", "Segoe UI", "sans-serif"],
        sans: ["Inter", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 8px 32px rgba(45, 52, 49, 0.06)",
      },
    },
  },
  plugins: [],
};
