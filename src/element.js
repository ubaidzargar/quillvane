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
