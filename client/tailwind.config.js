/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#fff8ed",
          100: "#f5ead6",
          200: "#e6cfaa",
          300: "#d0ab76",
          400: "#ad7b43",
          500: "#88562b",
          600: "#6f3f21",
          700: "#552f1d",
          800: "#3a2117",
          900: "#24140f"
        },
        cream: "#fff4df",
        caramel: "#d99a4e",
        leaf: "#4b6b42"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(58, 33, 23, 0.14)"
      }
    }
  },
  plugins: []
};
