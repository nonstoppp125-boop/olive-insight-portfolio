# Olive Insight — Data & AI Portfolio

A responsive personal portfolio for data analytics, business intelligence, AI-assisted analysis and data storytelling.

## Project structure

- `index.html` — semantic page structure and portfolio sections
- `assets/css/styles.css` — liquid-glass visual system, animated single-hue borders and responsive layouts
- `assets/js/app.js` — interactive design studio, live theme controls, reduced-motion support and local preference persistence
- `favicon.svg` — Olive Insight brand mark

## Run locally

Open `index.html` in a modern browser. The page uses Google Fonts and Lucide icons from their public CDNs; the core layout and mascot illustration are authored locally.

## Publish with GitHub Pages

The repository includes `.github/workflows/deploy.yml`. First-time setup requires the repository owner to open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source; the linked GitHub integration cannot create the initial Pages site. After that one-time setup, the workflow publishes the root directory whenever `main` changes. Check the **Actions** tab for the deployment result and **Settings → Pages** for the published URL.

## Design studio

Use the floating **Design Studio** control to change the palette, accent color, glass blur and opacity, corner radius, typography, content density, text contrast, border animation speed, mascot visibility and motion/reveal toggles. Preferences are saved in the current browser using local storage.

The prompt panel currently recognizes a focused set of visual instructions (palette, blur, radius, spacing density, text contrast, typography, glass opacity, border speed and visibility). It is a local rule-based starter, not a connected generative AI service.

## Content integrity

Learning progress and project results are intentionally not fabricated. Replace profile/contact details and add completed project evidence as they become available. The current contact action links to the repository owner's GitHub profile.

## Accessibility and responsiveness

The interface includes mobile navigation, keyboard dismissal for the studio, visible labels, semantic sections and reduced-motion preference handling.


## Interactive experience

- A persistent floating companion remains available while browsing and responds to pointer movement and touch/click activation.
- The Design Studio controls color palettes, accent, glass blur/opacity, radius, typography, border speed, mascot visibility and motion.
- Design preferences persist locally in the browser and can be exported/imported as JSON.
- Prompt controls interpret supported visual instructions locally; they do not call an AI model or send design data to a server.
- Reduced-motion preferences are respected. The studio supports keyboard focus management and Escape-to-close.
