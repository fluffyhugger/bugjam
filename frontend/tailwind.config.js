/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF6EC",
        ink: "#161616",
        yolk: "#FFD400",
        punch: "#FF4FA3",
        sky: "#4F86FF",
        mint: "#3DDC97",
        ember: "#FF7A45",
        // Logo handoff tokens — the mark ships only in these two treatments.
        brandink: "#141311",
        brandcream: "#EFE7D6",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        hard: "4px 4px 0 0 #161616",
        "hard-sm": "2px 2px 0 0 #161616",
        "hard-lg": "8px 8px 0 0 #161616",
      },
      borderRadius: {
        blob: "1.5rem",
      },
    },
  },
  plugins: [],
};
