module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          background: "hsl(0 0% 98% / <alpha-value>)",
          surface: "hsl(0 0% 100% / <alpha-value>)",
          primary: "hsl(220 70% 50% / <alpha-value>)",
          secondary: {
            light: "hsl(21 13% 69% / <alpha-value>)",
            DEFAULT: "hsl(21 13% 59% / <alpha-value>)",
            dark: "hsl(21 13% 49% / <alpha-value>)",
          },
          text: {
            primary: "hsl(220 10% 20% / <alpha-value>)",
            secondary: "hsl(220 10% 40% / <alpha-value>)",
            muted: "hsl(220 10% 60% / <alpha-value>)",
          },
        },
        // Dark mode colors - updated to match the new base dark color
        dark: {
          background: "hsl(0 0% 10.2% / <alpha-value>)", // Your specified color
          surface: "hsl(0 0% 15% / <alpha-value>)", // Slightly lighter
          primary: "hsl(220 70% 60% / <alpha-value>)",
          secondary: {
            light: "hsl(21 13% 69% / <alpha-value>)",
            DEFAULT: "hsl(21 13% 59% / <alpha-value>)",
            dark: "hsl(21 13% 49% / <alpha-value>)",
          },
          text: {
            primary: "hsl(0 0% 90% / <alpha-value>)", // Very light gray
            secondary: "hsl(0 0% 75% / <alpha-value>)", // Medium light gray
            muted: "hsl(0 0% 60% / <alpha-value>)", // Muted gray
          },
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
