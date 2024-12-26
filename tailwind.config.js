/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          background: "hsl(0 0% 98%)",
          surface: "hsl(0 0% 100%)",
          primary: "hsl(220 70% 60%)", // Updated to a lighter shade
          secondary: {
            light: "hsl(21 13% 69%)",
            DEFAULT: "hsl(21 13% 59%)",
            dark: "hsl(21 13% 49%)",
          },
          text: {
            primary: "hsl(220 10% 20%)",
            secondary: "hsl(220 10% 40%)",
            muted: "hsl(220 10% 60%)",
          },
          success: "hsl(120 70% 40%)",
          danger: "hsl(0 70% 50%)",
          info: "hsl(200 70% 50%)",
          warning: "hsl(45 100% 50%)",
        },
        // Dark mode colors
        dark: {
          background: "hsl(0 0% 10.2%)",
          surface: "hsl(0 0% 15%)",
          primary: "hsl(220 70% 60%)",
          secondary: {
            light: "hsl(21 13% 69%)",
            DEFAULT: "hsl(21 13% 59%)",
            dark: "hsl(21 13% 49%)",
          },
          text: {
            primary: "hsl(0 0% 90%)",
            secondary: "hsl(0 0% 75%)",
            muted: "hsl(0 0% 60%)",
          },
          success: "hsl(120 70% 40%)",
          danger: "hsl(0 70% 50%)",
          info: "hsl(200 70% 50%)",
          warning: "hsl(45 100% 50%)",
        },
        // Eye-soothing text colors
        "gray-300": "#D1D5DB",
        "gray-700": "#374151",
      },
    },
  },
  plugins: [],
};
