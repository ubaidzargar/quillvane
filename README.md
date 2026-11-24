# Quillvane PDF Flipbook

Show any PDF as a page-turning flipbook on any website, with one HTML tag.

```html
<script src="https://cdn.jsdelivr.net/npm/quillvane@1/dist/quillvane.js"></script>

<quillvane-flipbook src="/files/report.pdf" title="Annual Report"></quillvane-flipbook>
```

No build step, no dependencies, no account. It works in plain HTML, React, Vue, Svelte, Next.js, Astro, Shopify, Webflow, Wix, Squarespace and anything else that lets you add a script.

Using WordPress? Install the [Quillvane PDF Flipbook Viewer](https://wordpress.org/plugins/quillvane-pdf-flipbook-viewer/) plugin instead. It is the same viewer, with a block, an Elementor widget and a shortcode.

## Features

- Two-page spreads on wide screens, one page on phones
- Swipe, arrow buttons and keyboard to turn pages
- Search inside the PDF, with highlights
- Thumbnails of every page
- Zoom up to 3x, and pinch to zoom on phones
- Full screen reading (Esc or the phone's Back button closes it)
- Clickable links inside the PDF
- Popup mode: show a cover or a button that opens the flipbook full screen
- Deep links to any page, for example `#spf-1-p5`
- Preview mode: show only the first few pages
- Lazy loading: the PDF loads only when the reader scrolls near it
- Accessible: screen-reader text per page, labelled buttons, full keyboard use
- Older browsers automatically get a legacy PDF.js build

## Install

**CDN (easiest).** Add this once, in the `<head>` or before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/quillvane@1/dist/quillvane.js"></script>
```

**npm.**

```bash
npm install quillvane
```

```js
import 'quillvane';
```

**Self-hosted.** Download `dist/quillvane.js` and load it with a `<script>` tag.

## Attributes

| Attribute | Default | What it does |
|---|---|---|
| `src` | (required) | Address of the PDF. |
| `title` | | Heading shown above the flipbook. |
| `layout` | `auto` | `auto`, `single` (always one page) or `double` (two pages when there is room). |
| `start` | `1` | Page to open on. |
| `pages` | `0` | Show only the first N pages (preview). `0` shows all. |
| `download` | on | `download="no"` hides the Download button. |
| `popup` | off | Show a cover that opens the flipbook full screen. |
| `button` | | With `popup`: show a button with this text instead of the cover. |
| `accent` | `#2271b1` | Colour of buttons and highlights. |
| `background` | `#f3f4f6` | Background colour of the viewer. |

```html
<!-- Cover that opens full screen -->
<quillvane-flipbook src="magazine.pdf" title="Spring issue" popup></quillvane-flipbook>

<!-- Button, one page at a time, no download, custom colour -->
<quillvane-flipbook src="menu.pdf" popup button="See the menu" layout="single" download="no" accent="#e76f51"></quillvane-flipbook>
```

Anything you put inside the tag shows only when JavaScript is off, so a plain link makes a good fallback:

```html
<quillvane-flipbook src="report.pdf"><a href="report.pdf">Open the PDF</a></quillvane-flipbook>
```

## Settings (optional)

Set these before the script loads:

```html
<script>
window.quillvanePdfFlipbook = {
  // Host PDF.js yourself instead of loading it from jsDelivr:
  pdfjs: '/pdfjs/pdf.min.mjs',
  worker: '/pdfjs/pdf.worker.min.mjs',
  pdfjsLegacy: '/pdfjs/legacy/pdf.min.js',
  workerLegacy: '/pdfjs/legacy/pdf.worker.min.js',
  // Translate the interface:
  i18n: { fullScreen: 'Plein écran', search: 'Rechercher', download: 'Télécharger le PDF' },
  // Skip the built-in CSS and style it yourself:
  noCss: false
};
</script>
```

Translatable keys: `prevPage`, `nextPage`, `loading`, `search`, `searchIn`, `allPages`, `zoomIn`, `zoomOut`, `fullScreen`, `exitFull`, `close`, `closeFull`, `download`, `openPdf`, `openPdfShort`, `page`, `noResults`, `noText`, `searching`, `searchShort`, `loadError`, `internalLink`, `noSrc`.

## Events

Each viewer fires DOM events you can listen to: `spf:open`, `spf:page`, `spf:search`, `spf:link`, `spf:download`.

```js
document.addEventListener('spf:page', e => console.log('page', e.detail.page, e.detail.file));
```

If Google Analytics 4 (`gtag`) or Google Tag Manager (`dataLayer`) is on the page, the same events are also sent there as `pdf_flipbook_open`, `pdf_flipbook_page` and so on.

## Good to know

- **PDFs on another domain** only load if that server allows it (CORS). PDFs on your own site always work.
- **Content Security Policy:** by default PDF.js loads from `cdn.jsdelivr.net` through a small `blob:` module. With a strict CSP, either allow those, or self-host PDF.js and set `loader` to a module file of your own that does `import * as p from '/pdfjs/pdf.min.mjs'; window.quillvanePdfFlipbookPdfjs = p;`.
- **Hiding the download button** does not protect the file. The PDF is still public at its address.
- **Changing attributes after the flipbook is built** does not rebuild it. Replace the element instead.
- **Privacy:** nothing is tracked. The only outside requests are the PDF.js files from jsDelivr, unless you self-host them.

## Develop

```bash
npm run build   # joins src/ into dist/quillvane.js
npm test        # builds, then checks the demo in headless Chrome
```

Open `demo/index.html` through any local web server to try it.

## License

MIT © Yasir Altaf Zargar. PDF.js is © Mozilla, Apache License 2.0.
