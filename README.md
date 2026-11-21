# Olive Insight — Data & AI Portfolio

A responsive, single-page personal portfolio documenting a developing interest in data analytics, business intelligence, AI-assisted research and data storytelling.

## Live site

https://nonstoppp125-boop.github.io/olive-insight-portfolio/

## Project structure

- `index.html` — semantic page structure and portfolio content
- `assets/css/styles.css` — responsive layout, Liquid Glass surfaces, ambient motion and local design tokens
- `assets/js/app.js` — Design Studio, theme controls, local preferences, mascot dragging and motion behavior
- `scripts/validate.py` — static structure, accessibility-oriented and performance guardrails
- `.github/workflows/quality.yml` — Python validation and JavaScript syntax checks
- `.github/workflows/deploy.yml` — GitHub Pages deployment

## Run locally

Open `index.html` in a modern browser. The core experience uses local HTML, CSS and JavaScript; it does not require a build step, remote font service, icon CDN or external API.

## Design Studio

The floating **Design Studio** provides:

- Olive, earth and forest palettes
- Accent color picker, HEX input and independent RGB channels
- Glass opacity, background softness and corner radius
- Typography presets using local system font stacks
- Compact, balanced and spacious content density
- Standard and high text contrast
- Independent ambient capsule and card-edge animation speeds
- Motion, mascot visibility and scroll-reveal controls
- JSON settings export/import and reset

The prompt panel recognizes a limited set of visual instructions locally. It is a rule-based interface helper, not a connected generative AI service.

## Ambient visual system

- A small capsule follows a clock-like elliptical orbit around the full viewport behind the page content, with an independent speed control.
- Content surfaces use layered translucent Liquid Glass, restrained blur, specular highlights and subtle inset lighting.
- Cards and Design Studio controls use a super-thin animated perimeter stroke (never a rotating fill over the content); off-screen card-edge animation pauses where IntersectionObserver is available.
- The decorative companion can be dragged freely with mouse or touch, then magnetically snaps to the nearest screen edge. Pointer updates use GPU-friendly transforms and are coalesced to the latest animation frame; its normalized screen position is saved in this browser.
- Reduced-motion preferences are respected.

## Accessibility

Keyboard users can jump directly to the main content, visible focus outlines are provided for interactive controls, and the mobile navigation exposes and synchronizes its expanded state. The decorative companion remains hidden from assistive technology.

## Privacy and browser storage

Design preferences and the companion position are stored in the current browser's local storage. They are not uploaded to a server by this static site. Exported settings are downloaded as a JSON file; importing settings reads a local file selected by the visitor.

## Content integrity

This is a learning-in-progress portfolio. It intentionally avoids fabricated work experience, completed projects, proficiency ratings and learning percentages. Add project case studies only when there is real work and reproducible evidence to show. Update profile and contact details before using the site as a public professional profile.

## Publish with GitHub Pages

The repository deploys from the root directory through GitHub Actions whenever `main` changes. The quality workflow runs the static validator and `node --check` before changes are considered verified. Review the **Actions** tab for the latest quality and deployment results.
