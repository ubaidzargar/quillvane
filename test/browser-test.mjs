// Serves the repo, opens demo/ in headless Chrome over CDP and checks the flipbooks really render.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.pdf': 'application/pdf' };
const srv = createServer((q, r) => {
	const p = normalize(join(root, decodeURIComponent(q.url.split('?')[0])));
	if (!p.startsWith(root)) { r.writeHead(403); return r.end(); }
	try { const b = readFileSync(p); r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(b); } catch { r.writeHead(404); r.end(); }
}).listen(8765);
const CH = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ch = spawn(CH, ['--headless=new', '--remote-debugging-port=9335', '--user-data-dir=/tmp/qv-test', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9335/json')).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = {};
const send = (m, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method: m, params })); });
ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
await new Promise(r => ws.onopen = r);
const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.result?.value;
const waitFor = async (x, ms = 20000) => { for (let t = 0; t < ms; t += 250) { if (await ev(x)) return true; await sleep(250); } return false; };
let fails = 0;
const check = (name, ok) => { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) fails++; };
const run = async (url, w, h) => {
	await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
	await send('Page.navigate', { url }); await sleep(1000);
};

await run('http://localhost:8765/demo/index.html', 1300, 900);
check('three viewers built', await ev(`document.querySelectorAll('quillvane-flipbook .spf-book').length === 3`));
check('inline viewer draws a page', await waitFor(`!!document.querySelector('#inline canvas, #inline .spf-page canvas')`));
check('page counter shows total', await waitFor(`/\\/\\s*8$/.test(document.querySelector('#inline .spf-count').textContent.trim())`));
check('next page works', await ev(`document.querySelector('#inline .spf-next').click(), new Promise(r => setTimeout(() => r(!/^1\\b/.test(document.querySelector('#inline .spf-count').textContent.trim())), 1200))`));
check('popup has trigger button', await ev(`!!document.querySelector('#popup .spf-trigger') && document.querySelector('#popup .spf-book').classList.contains('spf-is-popup')`));
check('download hidden when download="no"', await ev(`!document.querySelector('#button .spf-dl') && !!document.querySelector('#inline .spf-dl')`));
check('accent colour applied', await ev(`document.querySelector('#button .spf-book').style.getPropertyValue('--spf-accent') === '#e76f51'`));
check('search finds text', await ev(`(async () => { const b = document.querySelector('#inline'); b.querySelector('.spf-t-search').click(); const i = b.querySelector('.spf-search input'); i.value = 'trail'; b.querySelector('.spf-search form').requestSubmit(); for (let t = 0; t < 40; t++) { if (b.querySelectorAll('.spf-result').length) return true; await new Promise(r => setTimeout(r, 250)); } return false; })()`));
check('javascript: src is refused', await ev(`(() => { const e = document.createElement('quillvane-flipbook'); e.setAttribute('src', 'javascript:alert(1)'); document.body.appendChild(e); return !e.querySelector('.spf-book') && !!e.querySelector('.spf-notice'); })()`));
check('title is escaped', await ev(`(() => { const e = document.createElement('quillvane-flipbook'); e.setAttribute('src', 'x.pdf'); e.setAttribute('title', '<img src=x onerror=1>'); document.body.appendChild(e); return !e.querySelector('img') && e.querySelector('.spf-title').textContent === '<img src=x onerror=1>'; })()`));

await run('http://localhost:8765/demo/index.html#spf-1-p3', 1300, 900);
check('deep link opens page 3', await waitFor(`/(^|–)3\\b/.test(document.querySelector('#inline .spf-count').textContent.trim())`));

ws.close(); ch.kill(); srv.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
process.exit(fails ? 1 : 0);
