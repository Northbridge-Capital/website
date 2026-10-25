# Northbridge Capital Website

Website for Northbridge Capital, built with [Eleventy](https://www.11ty.dev/) (a static site generator) and published on GitHub Pages.

Live site: https://northbridge-capital.com/

## How it works

You edit the files in `src/`. A build step (`npm run build`) turns them into the finished site in `_site/`, and that is what gets published. The header, footer and the cards are written once and reused on every page.

## Project structure

```
src/
  index.njk                 the home page
  detail.njk                the one template for every inner page ("What we do" and "How we work")
  404.njk                   the "page not found" page
  _data/                    the content: site.json, sections.json (section names and folders),
                            offers.json, cases.json, people.json, links.json (the inner pages are built from offers and cases in eleventy.config.js)
  _includes/
    layouts/base.njk        the shared page frame (head tags, skip link, scripts)
    partials/               header.njk and footer.njk
    icons/                  the four animated card icons and the footer's social logos
  css/                      the styles, split by purpose (see below)
  assets/                   fonts/, img/, media/ (the videos and their stills) and js/site.js, copied as they are
eleventy.config.js          build settings
.github/workflows/static.yml  builds and publishes the site when you push to main
```

### The styles (`src/css/`)

The numbered files are joined in order into one file, `/assets/css/styles.css`, so the order matters.
`00-fonts`, `01-base` (colours, spacing, layout grid, type, section tones), `02-buttons`, `03-header`, `04-hero`, `05-media` (photo and video placeholders), `06-offers` (flip cards and icons), `07-about-people`, `08-cases`, `09-contact` (form), `10-footer`, `11-pages` (inner pages), `12-motion` (all animations), `13-responsive` (small screens), `14-reduced-motion` (visitors who prefer less motion), `15-transitions` (the cross-fade between pages).

## Working on the site

You need [Node.js](https://nodejs.org/) (version 20 or newer).

```bash
npm install     # once, to download Eleventy
npm start       # builds the site and opens a local preview that refreshes when you save
npm run build   # builds the finished site into _site/
```

## Editing guide

- **Change text on a card, an inner page or a person:** edit the JSON files in `src/_data/` (`offers.json` and `cases.json` hold each page's `desc`, `intro`, `detail` and three `points`; offers also have a card `back`, and cases have two glass `notes` shown over the feature video). The home page and the inner pages update together.
- **Add a "What we do" or "How we work" page:** add an entry to `src/_data/offers.json` or `cases.json` (the `slug` becomes the address). The page, its link, its "next" link and its place in the sitemap are created automatically. A new "What we do" entry also needs an icon name that matches a file in `src/_includes/icons/`.
- **Rename a section or change its folder:** edit `src/_data/sections.json`. The header, headings, breadcrumbs and page addresses follow. The keys (`what`, `who`, `how`) are also the `id` of each section on the home page, so keep them in step.
- **Change the header or footer:** edit `src/_includes/partials/`. It changes everywhere.
- **Footer links** (LinkedIn, Databricks datasets, GitHub, YouTube) are in `src/_data/links.json`; every `href` is still `#`, so put the real addresses there. Their small logos are in `src/_includes/icons/social-*.svg`. The logos are the official brand marks (taken from the Simple Icons set); check each company's brand guidelines before launch.
- **The frame around "What we do"** is an illustration, not a border: topographic contour lines (`src/assets/img/contours.svg`, drawn from a made-up height map) curve in from two opposite corners behind the content (`.s-contour` in `01-base.css`). Add the class to another section to frame it the same way. The same section's heading types itself out with a blinking cursor when it scrolls into view (the `data-type` attribute, typed by `site.js`).
- **Change colours, spacing or the corner radius:** edit the values at the top of `src/css/01-base.css`. Each section is one of five tones (`--tone-light`, `-dark`, `-grey`, `-night`, `-stone`).
- **Page transitions:** moving between pages cross-fades, using the browser's own View Transitions feature (`15-transitions.css`, no script). Chrome, Edge and Safari 18.2+ do it; Firefox does not yet and simply loads the page. The header is deliberately not given its own transition name: it is absolutely positioned and scrolls away, so a named header would fly in from above when you navigate from far down the page.
- **Section drift:** the content of every section except "What we do" eases up about 70 px and fades in as the section scrolls in (`12-motion.css`, with `.arrived` added to the section by `site.js`). It is timed, not tied to the scroll wheel, so it stays smooth. It is off for visitors who prefer less motion.
- **The hero and "What we do":** the home hero is pinned (`position:sticky`) and fills the screen, and "What we do" slides up over it. The section's content also lifts as it arrives. This follows the scroll wheel (scroll-linked animation), so scrolling back up reverses it. It is the only section that does this. Firefox cannot do the scroll-linked lift yet and shows the content at once.
- **Home logo:** on the home page it glides back to the top instead of reloading the page (`site.js`).
- **Cache:** the build adds a short fingerprint to the stylesheet, script and every video and poster address (the `media` filter), so browsers always fetch the newest copy, including after you replace a video file with the same name.
- **Videos** (all in `src/assets/media/`, silent loops, each with a `-poster.jpg` still):
  - `hero.mp4`: the home hero (29 s montage of hard cuts: a quick opening burst, then about 2 seconds a shot, like Halfspace). It has the shared black-and-white grade with each clip's brightness matched, and no grain; the poster is its exact first frame.
  - `cards/card1…card4.mp4`: the back of each "What we do" card, in the order of `src/_data/offers.json` (square). They start when the card is flipped.
  - `cards/card1…card4-wide.mp4`: the same four clips in widescreen, used as the page header of each "What we do" page (`offers.json` names the clip with `video`). The three "How we work" cases have their own clips (named after the case, portrait for the card and `-wide` for the page header, set by `video` in `cases.json`); a case without a `video` shows a placeholder. The wide feature video lower down a page is `feature` in the same file (21:9, `cards/<name>.mp4`; without it there is a placeholder).
  - `who-we-are.mp4`: the wide feature video in "Who we are" (graded like the hero).
  How the clips were prepared (not in the repo): cut to length, cropped to the box (portrait for cards, 21:9 for feature videos, 16:9 for the rest), converted to black and white with `eq=gamma=1.05` and `curves=all='0/0 0.22/0.17 0.5/0.5 0.8/0.86 1/1'` in ffmpeg (the hero adds a gamma per source clip so they share one brightness), and encoded as H.264 (`-crf 26` to `32`, 24 fps, no audio). Clips meant to loop end in a one-second cross-fade back into their start.
  Only the hero loads straight away. The others load shortly before they are needed, and the hero and the "Who we are" video pause while off screen. Visitors who prefer less motion see the still posters.
- **Placeholders:** the other photos and videos are placeholders (`.slot`, `.slot-photo`, `.slot-video`; the label says what goes there). The card backs and inner pages hold a first draft of real copy to be checked for truth. The team bios are in `src/_data/people.json` (the `bio` field). Replace a slot with an `<img>` or a muted, looping `<video>` when the media is chosen.
- The contact form sends to Formspree (the address is in `src/_data/site.json`).
- The share image and icons are in `src/assets/img/`.
- The site targets current browsers (the last two years of Chrome, Edge, Firefox and Safari), so there are no fallbacks for older ones. The one exception is scroll-linked animation (the hero's parallax and the lift of "What we do"), which Firefox does not support yet: it simply does not move there.

## Deployment

Pushing to `main` runs `.github/workflows/static.yml`, which installs the dependencies, builds the site and publishes the `_site` folder to GitHub Pages. The first time, check in the repository's Settings → Pages that the source is set to **GitHub Actions**.

### Going back to the coming-soon page

The old placeholder page is kept in the tag `coming-soon`. To put it back on the live site, undo the redesign on `main` and push:

```bash
git checkout main
git revert -m 1 redesign-live    # redesign-live is the tag on the commit that merged the redesign
git push origin main
```

To bring the redesign back afterwards, revert that revert (`git revert <the revert commit>`) and push again. Reverting leaves the history intact, so nothing is lost either way.
