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
