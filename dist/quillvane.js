/*! Quillvane PDF Flipbook 1.0.0 | MIT License | https://github.com/ubaidzargar/quillvane | Uses PDF.js (Apache-2.0) from jsDelivr */
(function () {
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
		s.textContent = ".spf-book{--spf-accent:#2271b1;--spf-bg:#f3f4f6;--spf-ink:#1d2327;position:relative;margin:32px 0;background:var(--spf-bg);padding:24px 16px 20px;border-top:4px solid var(--spf-accent);box-sizing:border-box;outline:0}\n.spf-book *{box-sizing:border-box}\n.spf-book .spf-title{text-align:center;margin:0 0 18px;color:var(--spf-ink)}\n.spf-stage{position:relative;display:flex;align-items:center;justify-content:center;gap:12px}\n.spf-pages{display:flex;justify-content:center;min-height:300px;max-width:100%;touch-action:pan-x pan-y;transform-origin:center center}\n.spf-page{position:relative;flex:none;box-shadow:0 6px 24px rgba(0,0,0,.18);background:#fff}\n.spf-page canvas{display:block}\n.spf-book:not(.is-full) .spf-page{cursor:zoom-in}\n/* Zoomed: the page area scrolls; auto margins keep it centred without clipping the left edge. */\n.spf-pages.is-zoomed{overflow:auto;justify-content:flex-start;-webkit-overflow-scrolling:touch}\n.spf-pages.is-zoomed>.spf-page:first-child{margin-left:auto}\n.spf-pages.is-zoomed>.spf-page:last-child{margin-right:auto}\n.spf-book .spf-link{position:absolute;display:block;z-index:1;border-radius:2px}\n.spf-book .spf-link:hover,.spf-book .spf-link:focus{background:rgba(255,213,0,.25);outline:1px solid rgba(0,0,0,.3)}\n.spf-hl{position:absolute;pointer-events:none;background:rgba(255,213,0,.45);mix-blend-mode:multiply;border-radius:2px}\n.spf-msg{align-self:center;color:#555;margin:0}\n\n/* !important beats theme button styles, which often target every <button>. */\n.spf-book .spf-nav{flex:none;width:44px;height:44px;padding:0;margin:0;border-radius:50%!important;border:0!important;background:#fff!important;color:var(--spf-ink)!important;font-size:30px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);touch-action:manipulation}\n.spf-book .spf-nav:disabled{opacity:.3;cursor:default}\n@media (hover:hover){.spf-book .spf-nav:not(:disabled):hover{background:var(--spf-accent)!important;color:#fff!important}}\n\n.spf-bar{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px 16px;margin-top:16px}\n.spf-pager,.spf-acts{display:flex;align-items:center;justify-content:center;gap:12px}\n.spf-count{font-size:14px;color:var(--spf-ink);min-width:56px;text-align:center}\n.spf-book .spf-full,.spf-book .spf-dl{display:inline-block;margin:0;padding:10px 16px;font-size:14px;font-weight:600;line-height:1.2;white-space:nowrap;border-radius:2px;text-decoration:none!important;cursor:pointer;touch-action:manipulation}\n.spf-book .spf-full{border:1px solid var(--spf-ink)!important;background:#fff!important;color:var(--spf-ink)!important}\n.spf-book .spf-dl{border:1px solid var(--spf-accent);background:var(--spf-accent);color:#fff!important}\n.spf-mob{display:none!important}\n.spf-tools{display:flex;align-items:center;justify-content:center;gap:6px}\n.spf-book .spf-tool{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;margin:0;padding:0;border:1px solid #c3c4c7!important;border-radius:2px;background:#fff!important;color:var(--spf-ink)!important;font-size:22px;line-height:1;cursor:pointer;touch-action:manipulation}\n.spf-book .spf-tool svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}\n.spf-book .spf-tool:disabled{opacity:.35;cursor:default}\n.spf-book .spf-tool[aria-expanded=\"true\"]{background:var(--spf-accent)!important;border-color:var(--spf-accent)!important;color:#fff!important}\n\n/* Panels (thumbnails, search) cover the pages area. */\n.spf-panel{position:absolute;top:0;left:0;right:0;bottom:0;z-index:3;overflow:auto;padding:16px;background:rgba(255,255,255,.98);border-radius:2px;color:var(--spf-ink);text-align:left}\n.spf-panel[hidden]{display:none}\n.spf-thumbs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:14px}\n.spf-book .spf-thumb{display:flex;flex-direction:column;align-items:center;gap:4px;margin:0;padding:4px;border:2px solid transparent!important;background:none!important;color:var(--spf-ink)!important;cursor:pointer;font-size:12px}\n.spf-thumb>span:first-child{display:block;width:110px;height:140px;background:#e5e7eb}\n.spf-thumb canvas{display:block;box-shadow:0 1px 4px rgba(0,0,0,.2)}\n.spf-book .spf-thumb.is-current{border-color:var(--spf-accent)!important}\n.spf-search form{display:flex;gap:8px;margin:0 0 12px}\n.spf-book .spf-search input{flex:1;min-width:0;margin:0;padding:8px 10px;border:1px solid #8c8f94;border-radius:2px;font-size:15px;color:var(--spf-ink);background:#fff}\n.spf-book .spf-search form button{margin:0;padding:8px 14px;border:0!important;border-radius:2px;background:var(--spf-accent)!important;color:#fff!important;font-weight:600;cursor:pointer}\n.spf-results{list-style:none;margin:0;padding:0}\n.spf-results li{margin:0 0 6px}\n.spf-book .spf-result{display:block;width:100%;margin:0;padding:8px 10px;border:1px solid #e5e7eb!important;border-radius:2px;background:#fff!important;color:var(--spf-ink)!important;text-align:left;font-size:14px;line-height:1.4;cursor:pointer;white-space:normal}\n.spf-book .spf-result:hover{border-color:var(--spf-accent)!important}\n.spf-result mark{background:#ffe066;color:inherit;padding:0}\n.spf-status{color:#50575e;font-size:14px}\n\n/* Popup mode: only the trigger shows on the page; the viewer appears as the full-screen overlay. */\n.spf-book.spf-is-popup:not(.is-full){display:none}\n.spf-book .spf-trigger,.spf-trigger{display:inline-flex;flex-direction:column;align-items:center;gap:10px;margin:16px 0;padding:0;border:0!important;background:none!important;color:inherit!important;font:inherit;cursor:pointer}\n.spf-trigger-cover{display:block;min-width:160px;min-height:200px;background:#e5e7eb;box-shadow:0 6px 24px rgba(0,0,0,.18);transition:transform .2s ease}\n.spf-trigger-cover:empty{width:160px}\n.spf-trigger-cover canvas{display:block}\n.spf-trigger:hover .spf-trigger-cover,.spf-trigger:focus .spf-trigger-cover{transform:translateY(-3px)}\n.spf-trigger-label{font-weight:600}\n.spf-trigger.is-button{padding:12px 20px;border-radius:2px;background:var(--spf-accent)!important;color:#fff!important}\n.spf-trigger.is-error{opacity:.5}\n\n.spf-book .spf-close{display:none;position:absolute;top:12px;right:12px;margin:0;background:#fff!important;color:var(--spf-ink)!important;border:0!important;border-radius:2px;padding:10px 14px;font-size:14px;font-weight:600;line-height:1;cursor:pointer}\n/* Full screen is a fixed overlay, not the browser Fullscreen API: that resizes the window and breaks sticky headers on exit. */\n/* !important on size: block themes give content a max-width that would shrink the overlay. */\n.spf-book.is-full{position:fixed;top:0;left:0;right:0;bottom:0;z-index:100000;width:auto!important;max-width:none!important;height:auto!important;margin:0!important;border-top:0;background:#1b1f27;display:flex;flex-direction:column;justify-content:center;padding:60px 12px 16px;overflow:auto}\n.spf-book.is-full .spf-close{display:block}\n/* No browser page-zoom anywhere in the overlay (panels included); our own pinch zoom works on the pages. */\n.spf-book.is-full{touch-action:pan-x pan-y}\n.spf-book.is-full .spf-title{color:#fff!important;font-size:20px;margin-bottom:12px}\n.spf-book.is-full .spf-count{color:#ddd}\nhtml.spf-noscroll,html.spf-noscroll body{overflow:hidden}\n\n.spf-in-next .spf-page{animation:spfSlideNext .32s ease-out}\n.spf-in-prev .spf-page{animation:spfSlidePrev .32s ease-out}\n@keyframes spfSlideNext{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}\n@keyframes spfSlidePrev{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}\n@media (prefers-reduced-motion:reduce){.spf-in-next .spf-page,.spf-in-prev .spf-page{animation:none}}\n\n@media (max-width:759px){\n\t.spf-book{padding:18px 12px 16px}\n\t.spf-side{display:none!important}\n\t.spf-mob{display:block!important}\n\t.spf-bar{flex-direction:column}\n\t.spf-acts{width:100%}\n\t.spf-acts>*{flex:1;text-align:center}\n}\n.spf-notice{padding:12px;border:1px dashed #c3c4c7;color:#50575e}\n\n/* Visually hidden but read by screen readers. */\n.spf-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}\n.spf-msg a,.spf-fallback{color:var(--spf-accent);text-decoration:underline}\n";
		document.head.appendChild(s);
	}
})();

/* Quillvane PDF Flipbook Viewer: renders .spf-book elements with PDF.js. No dependencies. */
(function () {
	'use strict';
	var cfg = window.quillvanePdfFlipbook || {};
	var i18n = cfg.i18n || {};
	var libPromise;

	function tr(key, fallback) { return i18n[key] || fallback; }
	function each(list, fn) { Array.prototype.forEach.call(list, fn); }

	var pdfjs; // the PDF.js library once loaded

	function loadScript(src, type) {
		return new Promise(function (resolve, reject) {
			var s = document.createElement('script');
			if (type) { s.type = type; }
			s.src = src;
			s.onload = resolve;
			s.onerror = reject;
			document.head.appendChild(s);
		});
	}

	// PDF.js is loaded once, and only when the first viewer comes near the screen.
	// Current browsers get PDF.js 4 (an ES module, loaded through a tiny module script). It needs
	// Promise.withResolvers (Chrome 119+, Safari 17.4+); older browsers get the PDF.js 2.16 legacy build.
	function loadPdfJs() {
		if (libPromise) { return libPromise; }
		function legacy() {
			return loadScript(cfg.pdfjsLegacy).then(function () { return { lib: window.pdfjsLib, worker: cfg.workerLegacy }; });
		}
		var load = typeof Promise.withResolvers === 'function' ?
			loadScript(cfg.loader, 'module').then(function () {
				if (!window.quillvanePdfFlipbookPdfjs) { throw new Error('module failed'); }
				return { lib: window.quillvanePdfFlipbookPdfjs, worker: cfg.worker };
			}).catch(legacy) :
			legacy();
		libPromise = load.then(function (r) {
			if (!r.lib || !r.lib.getDocument) { throw new Error('PDF.js unavailable'); }
			r.lib.GlobalWorkerOptions.workerSrc = r.worker;
			pdfjs = r.lib;
			return r.lib;
		});
		return libPromise;
	}

	// Analytics: a DOM event for custom code, plus GA4 (gtag) or Tag Manager (dataLayer) when present.
	function track(root, action, data) {
		data = data || {};
		data.file = root.dataset.pdf;
		try { root.dispatchEvent(new CustomEvent('spf:' + action, { bubbles: true, detail: data })); } catch (e) { /* old browsers */ }
		var payload = { file_url: data.file, page_number: data.page, search_term: data.query, link_url: data.url };
		if (typeof window.gtag === 'function') {
			window.gtag('event', 'pdf_flipbook_' + action, payload);
		} else if (window.dataLayer && typeof window.dataLayer.push === 'function') {
			payload.event = 'pdf_flipbook_' + action;
			window.dataLayer.push(payload);
		}
	}

	function Flipbook(root) {
		function q(s) { return root.querySelector(s); }
		var box = q('.spf-pages');
		var stage = q('.spf-stage');
		var count = q('.spf-count');
		var prevs = root.querySelectorAll('.spf-prev');
		var nexts = root.querySelectorAll('.spf-next');
		var fullBtn = q('.spf-full');
		var closeBtn = q('.spf-close');
		var thumbsPanel = q('.spf-thumbs');
		var searchPanel = q('.spf-search');
		var searchInput = q('.spf-search input');
		var results = q('.spf-results');
		var zoomIn = q('.spf-t-zin');
		var zoomOut = q('.spf-t-zout');
		var popup = root.classList.contains('spf-is-popup');
		var trigger = popup ? document.querySelector('.spf-trigger[data-for="' + root.id + '"]') : null;
		var layout = root.dataset.layout || 'auto';
		var limit = parseInt(root.dataset.pages, 10) || 0;

		var pdf, total = 0, busy = false, again = false, zoom = 1, started = false, savedY = 0;
		var touched = false, term = '', thumbsBuilt = false, texts = {};
		var pos = Math.max(1, parseInt(root.dataset.start, 10) || 1);

		// Deep link: #spf-2-p5 opens viewer spf-2 on page 5.
		var hashMatch = location.hash.match(new RegExp('^#' + root.id + '-p(\\d+)$'));
		if (hashMatch) { pos = parseInt(hashMatch[1], 10); }

		function isFull() { return root.classList.contains('is-full'); }
		function spread() {
			var w = stage.clientWidth;
			if (layout === 'single') { return false; }
			if (layout === 'double') { return w >= 480; }
			return w >= 760;
		}
		function chromeHeight() {
			var cs = getComputedStyle(root);
			var title = q('.spf-title');
			var bar = q('.spf-bar');
			return parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
				(title ? title.offsetHeight + parseFloat(getComputedStyle(title).marginBottom) : 0) +
				bar.offsetHeight + parseFloat(getComputedStyle(bar).marginTop);
		}
		function sideArrows() { return q('.spf-side').offsetParent !== null; }
		// Book layout: cover alone, then two-page spreads.
		function pagesAt(p) {
			if (!spread() || p === 1) { return [p]; }
			var a = p % 2 ? p - 1 : p;
			return a + 1 <= total ? [a, a + 1] : [a];
		}

		function addLinks(page, viewport, wrap) {
			return page.getAnnotations({ intent: 'display' }).then(function (anns) {
				anns.forEach(function (a) {
					if (a.subtype !== 'Link') { return; }
					var el = document.createElement('a');
					if (a.url) {
						// Only safe schemes; a PDF can carry javascript: links.
						if (!/^(https?:|mailto:)/i.test(a.url)) { return; }
						el.href = a.url;
						el.target = '_blank';
						el.rel = 'noopener noreferrer';
						el.addEventListener('click', function (e) { e.stopPropagation(); track(root, 'link', { url: a.url }); });
					} else if (a.dest) {
						el.href = '#';
						el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goToDest(a.dest); });
					} else {
						return;
					}
					var r = viewport.convertToViewportRectangle(a.rect);
					el.className = 'spf-link';
					el.style.left = Math.min(r[0], r[2]) + 'px';
					el.style.top = Math.min(r[1], r[3]) + 'px';
					el.style.width = Math.abs(r[2] - r[0]) + 'px';
					el.style.height = Math.abs(r[3] - r[1]) + 'px';
					el.setAttribute('aria-label', a.url || tr('internalLink', 'Go to page'));
					wrap.appendChild(el);
				});
			}).catch(function () { /* links are optional */ });
		}

		// The page is a picture; screen readers get its text from a visually hidden copy.
		function addReaderText(n, wrap) {
			return pageText(n).then(function (t) {
				var sr = document.createElement('div');
				sr.className = 'spf-sr';
				sr.textContent = tr('page', 'Page') + ' ' + n + '. ' + (t.raw.trim() || tr('noText', 'This page has no text.'));
				wrap.insertBefore(sr, wrap.firstChild);
			}).catch(function () {});
		}

		function addHighlights(page, viewport, wrap) {
			if (!term) { return null; }
			var util = pdfjs.Util;
			return page.getTextContent().then(function (tc) {
				tc.items.forEach(function (it) {
					if (!it.str || it.str.toLowerCase().indexOf(term) < 0) { return; }
					var t = util.transform(viewport.transform, it.transform);
					var h = Math.hypot(t[2], t[3]);
					var mark = document.createElement('span');
					mark.className = 'spf-hl';
					mark.style.left = t[4] + 'px';
					mark.style.top = (t[5] - h) + 'px';
					mark.style.width = (it.width * viewport.scale) + 'px';
					mark.style.height = (h * 1.15) + 'px';
					wrap.appendChild(mark);
				});
			}).catch(function () { /* highlights are optional */ });
		}

		function render(dir) {
			if (!pdf) { return; }
			if (busy) { again = true; return; }
			busy = true;
			var list = pagesAt(pos);
			var w = stage.clientWidth - (sideArrows() ? 112 : 0);
			// Full screen: page height = window minus the measured title and toolbar, so the controls always fit.
			var h = isFull() ? innerHeight - chromeHeight() - 16 : innerHeight * 0.8;
			Promise.all(list.map(function (n) { return pdf.getPage(n); })).then(function (pages) {
				var vp = pages[0].getViewport({ scale: 1 });
				var scale = Math.min(w / list.length / vp.width, h / vp.height) * zoom;
				var dpr = window.devicePixelRatio || 1;
				var wraps = [];
				// Draw off-screen first, then swap, so there is no blank flash.
				return Promise.all(pages.map(function (p) {
					var css = p.getViewport({ scale: scale });
					var px = p.getViewport({ scale: scale * dpr });
					var wrap = document.createElement('div');
					var c = document.createElement('canvas');
					wrap.className = 'spf-page';
					wrap.style.width = css.width + 'px';
					wrap.style.height = css.height + 'px';
					c.width = px.width; c.height = px.height;
					c.style.width = css.width + 'px'; c.style.height = css.height + 'px';
					c.setAttribute('aria-hidden', 'true');
					wrap.appendChild(c);
					wraps.push(wrap);
					return p.render({ canvasContext: c.getContext('2d'), viewport: px }).promise.then(function () {
						return Promise.all([addLinks(p, css, wrap), addHighlights(p, css, wrap), addReaderText(p.pageNumber, wrap)]);
					});
				})).then(function () {
					box.innerHTML = '';
					wraps.forEach(function (el) { box.appendChild(el); });
					box.classList.toggle('is-zoomed', zoom > 1);
					box.style.maxHeight = zoom > 1 ? Math.round(h) + 'px' : '';
					box.classList.remove('spf-in-next', 'spf-in-prev');
					if (dir) { void box.offsetWidth; box.classList.add(dir > 0 ? 'spf-in-next' : 'spf-in-prev'); }
				});
			}).then(function () {
				count.textContent = list.join('–') + ' / ' + total;
				each(prevs, function (b) { b.disabled = list[0] <= 1; });
				each(nexts, function (b) { b.disabled = list[list.length - 1] >= total; });
				if (zoomOut) { zoomOut.disabled = zoom <= 1; zoomIn.disabled = zoom >= 3; }
				if (touched) {
					if (window.history && history.replaceState) { history.replaceState(null, '', '#' + root.id + '-p' + list[0]); }
					track(root, 'page', { page: list[0] });
				}
				markThumb();
				busy = false;
				if (again) { again = false; render(); }
			}, function () { busy = false; });
		}

		function goTo(n) {
			if (!pdf) { return; }
			n = Math.max(1, Math.min(total, n));
			var dir = n > pos ? 1 : -1;
			pos = n;
			touched = true;
			// Read the new page aloud only once the reader starts turning pages.
			box.setAttribute('aria-live', 'polite');
			render(dir);
		}
		function go(d) {
			if (!pdf) { return; }
			var l = pagesAt(pos);
			goTo(d > 0 ? l[l.length - 1] + 1 : l[0] - 1);
		}
		function goToDest(dest) {
			var p = typeof dest === 'string' ? pdf.getDestination(dest) : Promise.resolve(dest);
			p.then(function (d) { return d ? pdf.getPageIndex(d[0]) : null; })
				.then(function (i) { if (i !== null) { goTo(i + 1); } })
				.catch(function () {});
		}

		// Panels: thumbnails and search. Only one open at a time.
		function closePanels() {
			[thumbsPanel, searchPanel].forEach(function (p) { if (p) { p.hidden = true; } });
			each(root.querySelectorAll('.spf-t-thumbs, .spf-t-search'), function (b) { b.setAttribute('aria-expanded', 'false'); });
		}
		function togglePanel(panel, btn) {
			var open = panel.hidden;
			closePanels();
			if (open) {
				panel.hidden = false;
				btn.setAttribute('aria-expanded', 'true');
			}
			return open;
		}
		function renderThumb(btn, n) {
			pdf.getPage(n).then(function (p) {
				var vp = p.getViewport({ scale: 1 });
				var dpr = window.devicePixelRatio || 1;
				var v = p.getViewport({ scale: (110 / vp.width) * dpr });
				var c = document.createElement('canvas');
				c.width = v.width; c.height = v.height; c.style.width = '110px';
				return p.render({ canvasContext: c.getContext('2d'), viewport: v }).promise.then(function () {
					btn.replaceChild(c, btn.firstChild);
				});
			}).catch(function () {});
		}
		function buildThumbs() {
			if (thumbsBuilt) { return; }
			thumbsBuilt = true;
			var grid = q('.spf-thumbs-grid');
			var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
				entries.forEach(function (e) {
					if (e.isIntersecting) { io.unobserve(e.target); renderThumb(e.target, parseInt(e.target.dataset.page, 10)); }
				});
			}, { root: thumbsPanel, rootMargin: '200px' }) : null;
			for (var n = 1; n <= total; n++) {
				var b = document.createElement('button');
				b.type = 'button';
				b.className = 'spf-thumb';
				b.dataset.page = n;
				b.appendChild(document.createElement('span'));
				var label = document.createElement('span');
				label.className = 'spf-thumb-n';
				label.textContent = n;
				b.appendChild(label);
				b.setAttribute('aria-label', tr('page', 'Page') + ' ' + n);
				grid.appendChild(b);
				if (io) { io.observe(b); } else { renderThumb(b, n); }
			}
			grid.addEventListener('click', function (e) {
				var b = e.target.closest('.spf-thumb');
				if (!b) { return; }
				closePanels();
				goTo(parseInt(b.dataset.page, 10));
			});
		}
		function markThumb() {
			if (!thumbsBuilt) { return; }
			var list = pagesAt(pos);
			each(root.querySelectorAll('.spf-thumb'), function (b) {
				b.classList.toggle('is-current', list.indexOf(parseInt(b.dataset.page, 10)) >= 0);
			});
		}

		function pageText(n) {
			if (!texts[n]) {
				texts[n] = pdf.getPage(n).then(function (p) { return p.getTextContent(); }).then(function (tc) {
					var raw = tc.items.map(function (x) { return x.str; }).join(' ').replace(/\s+/g, ' ');
					return { raw: raw, lower: raw.toLowerCase() };
				});
			}
			return texts[n];
		}
		function setStatus(msg) {
			results.innerHTML = '';
			var li = document.createElement('li');
			li.className = 'spf-status';
			li.textContent = msg;
			results.appendChild(li);
		}
		function search(query) {
			query = query.trim().toLowerCase();
			term = query.length >= 2 ? query : '';
			if (!term) { setStatus(tr('searchShort', 'Type at least 2 letters.')); render(); return; }
			setStatus(tr('searching', 'Searching…'));
			var hits = [];
			var chain = Promise.resolve();
			for (var n = 1; n <= total; n++) {
				(function (page) {
					chain = chain.then(function () { return pageText(page); }).then(function (t) {
						var k = t.lower.indexOf(term);
						if (k >= 0) { hits.push({ page: page, raw: t.raw, at: k }); }
					});
				})(n);
			}
			chain.then(function () {
				if (query !== term) { return; }
				results.innerHTML = '';
				if (!hits.length) { setStatus(tr('noResults', 'No results.')); }
				hits.forEach(function (hit) {
					// Built with text nodes only: PDF text is never inserted as HTML.
					var start = Math.max(0, hit.at - 40);
					var li = document.createElement('li');
					var b = document.createElement('button');
					var pg = document.createElement('strong');
					var mark = document.createElement('mark');
					b.type = 'button';
					b.className = 'spf-result';
					pg.textContent = tr('page', 'Page') + ' ' + hit.page + ': ';
					mark.textContent = hit.raw.substr(hit.at, term.length);
					b.appendChild(pg);
					b.appendChild(document.createTextNode((start ? '…' : '') + hit.raw.slice(start, hit.at)));
					b.appendChild(mark);
					b.appendChild(document.createTextNode(hit.raw.slice(hit.at + term.length, hit.at + term.length + 40) + '…'));
					b.addEventListener('click', function () { closePanels(); goTo(hit.page); });
					li.appendChild(b);
					results.appendChild(li);
				});
				track(root, 'search', { query: term, results: hits.length });
				render();
			});
		}

		var pushed = false;
		function openFull() {
			savedY = window.pageYOffset;
			// A history step, so the phone's Back button closes full screen instead of leaving the page.
			if (window.history && history.pushState) { history.pushState({ spfFull: root.id }, ''); pushed = true; }
			root.classList.add('is-full');
			document.documentElement.classList.add('spf-noscroll');
			fullBtn.textContent = tr('exitFull', 'Exit full screen');
			render();
			closeBtn.focus({ preventScroll: true });
			track(root, 'open', { page: pos });
		}
		// The viewer leaves the page flow while full screen; browsers' scroll anchoring then shifts the page, so restore it on close.
		function closeFull(fromBack) {
			if (pushed && fromBack !== true) { pushed = false; history.back(); return; } // the popstate handler finishes closing
			pushed = false;
			closePanels();
			root.classList.remove('is-full');
			if (!document.querySelector('.spf-book.is-full')) { document.documentElement.classList.remove('spf-noscroll'); }
			fullBtn.textContent = tr('fullScreen', 'Full screen');
			window.scrollTo(0, savedY);
			if (popup) {
				if (trigger) { trigger.focus({ preventScroll: true }); }
			} else {
				render();
				fullBtn.focus({ preventScroll: true });
			}
		}

		each(prevs, function (b) { b.addEventListener('click', function () { go(-1); }); });
		each(nexts, function (b) { b.addEventListener('click', function () { go(1); }); });
		fullBtn.addEventListener('click', function () { if (isFull()) { closeFull(); } else { openFull(); } });
		closeBtn.addEventListener('click', closeFull);
		addEventListener('popstate', function () { if (isFull()) { closeFull(true); } });
		box.addEventListener('click', function () { if (pdf && !isFull()) { openFull(); } });

		var thumbsBtn = q('.spf-t-thumbs');
		var searchBtn = q('.spf-t-search');
		if (thumbsBtn) { thumbsBtn.addEventListener('click', function () { if (togglePanel(thumbsPanel, thumbsBtn)) { buildThumbs(); markThumb(); } }); }
		if (searchBtn) {
			searchBtn.addEventListener('click', function () { if (togglePanel(searchPanel, searchBtn)) { searchInput.focus({ preventScroll: true }); } });
			q('.spf-search form').addEventListener('submit', function (e) { e.preventDefault(); search(searchInput.value); });
		}
		if (zoomIn) {
			zoomIn.addEventListener('click', function () { zoom = Math.min(3, zoom + 0.5); render(); });
			zoomOut.addEventListener('click', function () { zoom = Math.max(1, zoom - 0.5); render(); });
		}
		var dl = q('.spf-dl');
		if (dl) { dl.addEventListener('click', function () { track(root, 'download', { page: pos }); }); }

		root.addEventListener('keydown', function (e) {
			if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { return; }
			if (e.key === 'ArrowLeft') { go(-1); }
			if (e.key === 'ArrowRight') { go(1); }
		});
		document.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape') { return; }
			var panelOpen = (thumbsPanel && !thumbsPanel.hidden) || (searchPanel && !searchPanel.hidden);
			if (panelOpen && root.contains(document.activeElement)) { closePanels(); return; }
			if (isFull()) { closeFull(); }
		});

		// One finger swipes pages; two fingers pinch to zoom (previewed with a CSS scale, then redrawn sharp).
		var x0 = null, pinch = null;
		function spread2(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
		function clampZoom(z) { return Math.max(1, Math.min(3, z)); }
		box.addEventListener('touchstart', function (e) {
			if (e.touches.length === 2) {
				pinch = { d: spread2(e.touches), z: zoom, s: 1 };
				x0 = null;
			} else if (e.touches.length === 1 && !pinch) {
				x0 = e.touches[0].clientX;
			}
		}, { passive: true });
		box.addEventListener('touchmove', function (e) {
			if (!pinch || e.touches.length !== 2) { return; }
			pinch.s = spread2(e.touches) / pinch.d;
			box.style.transform = 'scale(' + (clampZoom(pinch.z * pinch.s) / pinch.z) + ')';
		}, { passive: true });
		box.addEventListener('touchend', function (e) {
			if (pinch) {
				if (e.touches.length < 2) {
					var z = clampZoom(Math.round(pinch.z * pinch.s * 4) / 4);
					box.style.transform = '';
					pinch = null;
					if (z !== zoom) { zoom = z; render(); }
				}
				return;
			}
			if (x0 === null || zoom > 1) { x0 = null; return; } // zoomed: the finger pans instead
			var dx = e.changedTouches[0].clientX - x0;
			x0 = null;
			if (Math.abs(dx) > 40) { go(dx < 0 ? 1 : -1); }
		});

		// Phones fire resize when the address bar hides while scrolling, so in the page only a width change
		// needs a redraw. Full screen fits the height too (e.g. after the on-screen keyboard closes).
		var timer, lastW = innerWidth, lastH = innerHeight;
		addEventListener('resize', function () {
			if (innerWidth === lastW && !(isFull() && innerHeight !== lastH)) { return; }
			lastW = innerWidth;
			lastH = innerHeight;
			clearTimeout(timer);
			timer = setTimeout(render, 200);
		});

		function renderCover() {
			var slot = trigger && trigger.querySelector('.spf-trigger-cover');
			if (!slot) { return; }
			pdf.getPage(1).then(function (p) {
				var vp = p.getViewport({ scale: 1 });
				var dpr = window.devicePixelRatio || 1;
				var v = p.getViewport({ scale: (220 / vp.width) * dpr });
				var c = document.createElement('canvas');
				c.width = v.width; c.height = v.height; c.style.width = '220px';
				return p.render({ canvasContext: c.getContext('2d'), viewport: v }).promise.then(function () {
					slot.innerHTML = '';
					slot.appendChild(c);
				});
			}).catch(function () {});
		}

		function start() {
			if (started) { return; }
			started = true;
			loadPdfJs().then(function (lib) {
				// isEvalSupported: false closes CVE-2024-4367 (script execution through crafted PDF fonts).
				return lib.getDocument({ url: root.dataset.pdf, disableAutoFetch: true, isEvalSupported: false }).promise;
			}).then(function (doc) {
				pdf = doc;
				total = limit ? Math.min(limit, doc.numPages) : doc.numPages;
				pos = Math.min(pos, total);
				if (popup) { renderCover(); }
				if (hashMatch) {
					if (popup) { openFull(); } else { root.scrollIntoView({ block: 'start' }); render(); }
				} else {
					render();
				}
			}).catch(function () {
				box.innerHTML = '';
				var p = document.createElement('p');
				p.className = 'spf-msg';
				p.textContent = tr('loadError', 'The PDF could not be shown here.') + ' ';
				var a = document.createElement('a');
				a.href = root.dataset.pdf;
				a.target = '_blank';
				a.rel = 'noopener';
				a.textContent = tr('openPdf', 'Open the PDF');
				p.appendChild(a);
				box.appendChild(p);
				if (trigger) { trigger.classList.add('is-error'); }
			});
		}

		if (trigger) {
			trigger.addEventListener('click', function () {
				start();
				openFull();
			});
		}

		// Only fetch the PDF when the viewer (or its popup button) is near the screen, or a deep link asks for it.
		var watch = trigger || root;
		if (hashMatch || !('IntersectionObserver' in window)) {
			start();
		} else {
			var io = new IntersectionObserver(function (entries) {
				if (entries[0].isIntersecting) { io.disconnect(); start(); }
			}, { rootMargin: '400px' });
			io.observe(watch);
		}
	}

	function initAll() {
		each(document.querySelectorAll('.spf-book:not([data-spf-ready])'), function (el) {
			el.setAttribute('data-spf-ready', '1');
			Flipbook(el);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initAll);
	} else {
		initAll();
	}
	// Page builders (e.g. the Elementor editor) add viewers after load.
	if ('MutationObserver' in window) {
		var queued = false;
		new MutationObserver(function () {
			if (queued) { return; }
			queued = true;
			setTimeout(function () { queued = false; initAll(); }, 100);
		}).observe(document.documentElement, { childList: true, subtree: true });
	}
})();

/* <quillvane-flipbook>: builds the same markup as the WordPress plugin; core.js then turns it into a flipbook. */
(function () {
	'use strict';
	if (!window.customElements || customElements.get('quillvane-flipbook')) { return; }

	var i18n = (window.quillvanePdfFlipbook && window.quillvanePdfFlipbook.i18n) || {};
	function tr(key, fallback) { return i18n[key] || fallback; }
	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}
	// Boolean attribute: missing = default, bare (popup) = on, "no"/"false"/"0"/"off" = off.
	function flag(el, name, def) {
		if (!el.hasAttribute(name)) { return def; }
		return ['no', 'false', '0', 'off'].indexOf(el.getAttribute(name).trim().toLowerCase()) === -1;
	}
	function safeUrl(u) {
		// Only http(s) and relative addresses: blocks javascript: and data: URLs.
		try { var p = new URL(u, document.baseURI).protocol; return p === 'http:' || p === 'https:' ? u : ''; } catch (e) { return ''; }
	}
	function color(v) { return v && /^#[0-9a-f]{3,8}$|^[a-z]+$|^rgba?\([\d\s.,%]+\)$/i.test(v) ? v : ''; }
	var ICONS = {
		search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
		thumbs: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'
	};
	function icon(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[n] + '</svg>'; }
	function tool(cls, label, inner, extra) {
		return '<button class="spf-tool ' + cls + '" type="button"' + (extra || '') + ' aria-label="' + esc(label) + '" title="' + esc(label) + '">' + inner + '</button>';
	}

	var instance = 0;

	function render(el) {
		var pdf = safeUrl(el.getAttribute('src') || '');
		if (!pdf) { return '<p class="spf-notice">' + esc(tr('noSrc', 'Quillvane: set a PDF address in the src attribute.')) + '</p>'; }
		var uid;
		do { uid = 'spf-' + (++instance); } while (document.getElementById(uid));
		var title = el.getAttribute('title') || '';
		el.removeAttribute('title'); // keep the browser tooltip off the whole viewer
		var layout = el.getAttribute('layout');
		layout = ['single', 'double'].indexOf(layout) !== -1 ? layout : 'auto';
		var start = Math.max(1, parseInt(el.getAttribute('start'), 10) || 1);
		var pages = Math.max(0, parseInt(el.getAttribute('pages'), 10) || 0);
		var popup = flag(el, 'popup', false);
		var button = el.getAttribute('button') || '';
		var download = flag(el, 'download', true);
		var accent = color(el.getAttribute('accent'));
		var bg = color(el.getAttribute('background'));
		var style = (accent ? '--spf-accent:' + accent + ';' : '') + (bg ? '--spf-bg:' + bg + ';' : '');
		var prev = tr('prevPage', 'Previous page');
		var next = tr('nextPage', 'Next page');
		var h = '';
		if (popup) {
			var label = button || title || tr('openPdfShort', 'Open PDF');
			h += '<button type="button" class="spf-trigger' + (button ? ' is-button' : '') + '" data-for="' + uid + '" style="' + esc(style) + '" aria-haspopup="dialog">' +
				(button ? '' : '<span class="spf-trigger-cover"></span>') +
				'<span class="spf-trigger-label">' + esc(label) + '</span></button>';
		}
		h += '<div id="' + uid + '" class="spf-book' + (popup ? ' spf-is-popup' : '') + '" data-pdf="' + esc(pdf) + '" data-start="' + start + '" data-layout="' + layout + '" data-pages="' + pages + '" style="' + esc(style) + '" tabindex="0"' +
			(popup ? ' role="dialog" aria-modal="true"' : '') + (title ? ' aria-label="' + esc(title) + '"' : '') + '>' +
			'<button class="spf-close" type="button" aria-label="' + esc(tr('closeFull', 'Close full screen')) + '">&#10005; ' + esc(tr('close', 'Close')) + '</button>' +
			(title ? '<h2 class="spf-title">' + esc(title) + '</h2>' : '') +
			'<div class="spf-stage">' +
				'<button class="spf-nav spf-prev spf-side" type="button" aria-label="' + esc(prev) + '">&#8249;</button>' +
				'<div class="spf-pages"><p class="spf-msg">' + esc(tr('loading', 'Loading…')) + '</p></div>' +
				'<button class="spf-nav spf-next spf-side" type="button" aria-label="' + esc(next) + '">&#8250;</button>' +
				'<div class="spf-panel spf-thumbs" hidden><div class="spf-thumbs-grid"></div></div>' +
				'<div class="spf-panel spf-search" hidden><form role="search">' +
					'<input type="search" aria-label="' + esc(tr('searchIn', 'Search in document')) + '" placeholder="' + esc(tr('searchIn', 'Search in document')) + '">' +
					'<button type="submit">' + esc(tr('search', 'Search')) + '</button></form>' +
					'<ol class="spf-results" aria-live="polite"></ol></div>' +
			'</div>' +
			'<div class="spf-bar">' +
				'<div class="spf-pager"><button class="spf-nav spf-prev spf-mob" type="button" aria-label="' + esc(prev) + '">&#8249;</button><span class="spf-count">–</span><button class="spf-nav spf-next spf-mob" type="button" aria-label="' + esc(next) + '">&#8250;</button></div>' +
				'<div class="spf-tools">' +
					tool('spf-t-search', tr('search', 'Search'), icon('search'), ' aria-expanded="false"') +
					tool('spf-t-thumbs', tr('allPages', 'All pages'), icon('thumbs'), ' aria-expanded="false"') +
					tool('spf-t-zout', tr('zoomOut', 'Zoom out'), '&minus;', ' disabled') +
					tool('spf-t-zin', tr('zoomIn', 'Zoom in'), '+') +
				'</div>' +
				'<div class="spf-acts"><button class="spf-full" type="button">' + esc(tr('fullScreen', 'Full screen')) + '</button>' +
					(download ? '<a class="spf-dl" href="' + esc(pdf) + '" download>' + esc(tr('download', 'Download PDF')) + '</a>' : '') +
				'</div>' +
			'</div>' +
		'</div>';
		return h;
	}

	customElements.define('quillvane-flipbook', class extends HTMLElement {
		connectedCallback() {
			if (this.dataset.qvRendered) { return; } // moving the element in the DOM must not rebuild it
			this.dataset.qvRendered = '1';
			this.style.display = 'block';
			this.innerHTML = render(this); // replaces the author's no-JavaScript fallback (e.g. a plain link)
		}
	});
})();
