import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f5f3",
          100: "#e6e5df",
          900: "#1f1e1b"
        },
        coral: "#ff6b57",
        teal: "#0a9396"
      }
    }
  },
  plugins: []
};

export default config;
