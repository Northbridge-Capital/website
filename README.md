# Northbridge Capital website

`main` currently shows a **coming-soon page**: a single static `index.html` with its assets in `coming-soon/` (hero still, font, icons, social image). There is no build step; the deploy workflow (`.github/workflows/static.yml`) publishes the repository as-is to GitHub Pages on every push to `main`.

The full redesigned site (built with Eleventy) lives on the `redesign` branch and is reviewed in a pull request. Merging that pull request replaces this page.

## Tags

- `coming-soon`: the placeholder page as shipped.
- `redesign-live`: the full site, for switching back and forth.

## Preview locally

```bash
python3 -m http.server 8090   # http://localhost:8090
```
