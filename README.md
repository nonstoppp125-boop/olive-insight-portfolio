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

The repository includes `.github/workflows/deploy.yml`. It publishes the root directory to GitHub Pages whenever `main` changes and uses the Pages configuration action to enable the GitHub Actions deployment source. Check the **Actions** tab for the deployment result and the repository **Settings → Pages** page for the published URL.

## Design studio

Use the floating **Design Studio** control to change the palette, accent color, glass blur and opacity, corner radius, typography, border animation speed, mascot visibility and motion/reveal toggles. Preferences are saved in the current browser using local storage.

The prompt panel currently recognizes a focused set of visual instructions (palette, blur, radius, border speed and visibility). It is a local rule-based starter, not a connected generative AI service.

## Content integrity

Learning progress and project results are intentionally not fabricated. Replace profile/contact details and add completed project evidence as they become available. The current contact action links to the repository owner's GitHub profile.

## Accessibility and responsiveness

The interface includes mobile navigation, keyboard dismissal for the studio, visible labels, semantic sections and reduced-motion preference handling.
