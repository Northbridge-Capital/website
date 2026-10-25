# Northbridge Capital Website

Static marketing website for Northbridge Capital, based on the HTML5 UP "Big Picture" template and customized for firm content, team information, and contact flow.

Live site: https://northbridge-capital.com/

## Tech Stack

- HTML5 (`index.html`)
- CSS + Sass (`assets/css`, `assets/sass`)
- JavaScript/jQuery plugins for scroll effects and gallery interactions (`assets/js`)
- GitHub Pages deployment via GitHub Actions (`.github/workflows/static.yml`)

## Project Structure

- `index.html`: single-page site content and section layout
- `assets/css/main.css`: compiled stylesheet used by the site
- `assets/sass/main.scss`: Sass entrypoint for style source
- `assets/js/main.js`: page behavior (animations, gallery, scroll effects)
- `images/`: section backgrounds and gallery images
- `.github/workflows/static.yml`: deploy workflow for GitHub Pages

## Run Locally

No build step is required for normal content edits.

1. Start a local static server from the repo root:
   ```bash
   python3 -m http.server 8080
   ```
2. Open `http://localhost:8080`.

## Editing Guide

- Update text, sections, nav items, and contact form in `index.html`.
- The contact form currently posts to Formspree (`https://formspree.io/f/mzzglgwg`).
- Replace gallery or hero images in `images/` and keep file paths in `index.html` in sync.

## Styling Workflow

If you edit Sass files, recompile to CSS before committing.

- One-time compile:
  ```bash
  sass assets/sass/main.scss assets/css/main.css
  ```
- Watch mode:
  ```bash
  sass --watch assets/sass/main.scss:assets/css/main.css
  ```

(`sass` here refers to Dart Sass CLI.)

## Deployment

Push to `main` to trigger GitHub Actions deployment to GitHub Pages via `.github/workflows/static.yml`.

## Attribution

- Template: "Big Picture" by HTML5 UP
- License: CCA 3.0 (`html5up.net/license`)
