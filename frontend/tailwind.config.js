/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#F6F1E7",
          50: "#FFFFFF",
          100: "#FBF8F2",
          200: "#F6F1E7",
          300: "#EFE7D6",
        },
        sand: {
          DEFAULT: "#E4D5BE",
          light: "#EEE3D0",
          dark: "#D2BE9F",
        },
        walnut: {
          DEFAULT: "#5B3A29",
          light: "#7A503A",
          dark: "#41291D",
        },
        charcoal: {
          DEFAULT: "#221F1C",
          light: "#3A342E",
        },
        brass: {
          DEFAULT: "#9C7A44",
          light: "#B99B66",
        },
        moss: {
          DEFAULT: "#3F4A3D",
          light: "#56684F",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.01em" }],
        "display-lg": ["clamp(2.25rem, 3.5vw, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(1.75rem, 2.5vw, 2.5rem)", { lineHeight: "1.1" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(34, 31, 28, 0.06), 0 8px 24px -12px rgba(34, 31, 28, 0.12)",
        lift: "0 12px 32px -12px rgba(34, 31, 28, 0.22)",
      },
      borderRadius: {
        card: "0.375rem",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
