// Joins src/ into dist/quillvane.js: one script tag gives the CSS, the PDF.js loader settings, the viewer and <quillvane-flipbook>.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const css = readFileSync('src/quillvane.css', 'utf8');
const setup = `(function () {
	'use strict';
	// Settings can be set before this script: window.quillvanePdfFlipbook = { pdfjs, worker, pdfjsLegacy, workerLegacy, i18n, noCss }.
	var c = window.quillvanePdfFlipbook = window.quillvanePdfFlipbook || {};
	var cdn = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@';
	c.pdfjs = c.pdfjs || cdn + '4.10.38/build/pdf.min.mjs';
	c.worker = c.worker || cdn + '4.10.38/build/pdf.worker.min.mjs';
	c.pdfjsLegacy = c.pdfjsLegacy || cdn + '2.16.105/legacy/build/pdf.min.js';
	c.workerLegacy = c.workerLegacy || cdn + '2.16.105/legacy/build/pdf.worker.min.js';
	// core.js loads PDF.js 4 through a tiny module script that puts it on window.
	if (!c.loader) {
		c.loader = URL.createObjectURL(new Blob(['import * as p from ' + JSON.stringify(new URL(c.pdfjs, document.baseURI).href) + '; window.quillvanePdfFlipbookPdfjs = p;'], { type: 'text/javascript' }));
	}
	if (!c.noCss && !document.getElementById('quillvane-css')) {
		var s = document.createElement('style');
		s.id = 'quillvane-css';
		s.textContent = ${JSON.stringify(css)};
		document.head.appendChild(s);
	}
})();
`;
const out = `/*! Quillvane PDF Flipbook ${pkg.version} | MIT License | https://github.com/${pkg.repository?.url?.match(/github\.com\/(.+?)(\.git)?$/)?.[1] ?? ''} | Uses PDF.js (Apache-2.0) from jsDelivr */
${setup}
${readFileSync('src/core.js', 'utf8')}
${readFileSync('src/element.js', 'utf8')}`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/quillvane.js', out);
console.log('dist/quillvane.js', out.length, 'bytes');
