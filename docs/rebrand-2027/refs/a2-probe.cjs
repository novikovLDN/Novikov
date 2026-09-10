// A2 probe: headless Chromium 1440x900. Mirrors research/refs agency-probe method,
// plus library detection (window globals + JS bundle signatures) and context-type hooks.
const { chromium } = require('/Users/maximiliannovikov/Desktop/WEB3 TECH SI/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUT = '/Users/maximiliannovikov/Desktop/Novikov-claude-create-claude-documentation-9WUuP/docs/rebrand-2027/refs';
const EXE = '/Users/maximiliannovikov/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
fs.mkdirSync(OUT, { recursive: true });

const SITES = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.split('=')) : [];

const SIG = {
  gsap: /GreenSock|gsap\.registerPlugin|_gsap|"gsap"/,
  ScrollTrigger: /ScrollTrigger/,
  SplitText: /SplitText/,
  three: /WebGLRenderer|__THREE__|THREE\.WebGLRenderer/,
  threeWebGPU: /WebGPURenderer|WebGPUBackend/,
  TSL: /NodeMaterial|MeshStandardNodeMaterial/,
  r3f: /@react-three\/fiber|R3F:|react-three-fiber/,
  lenis: /lenis-smooth|lenis-scrolling|lenis-stopped/,
  locomotiveScroll: /locomotive-scroll|data-scroll-container/,
  barba: /@barba|barba\.init|barba-container/,
  swup: /swup/i,
  taxi: /@unseenco\/taxi|data-taxi/,
  pixi: /PIXI\.|pixi\.js|@pixi\//,
  rive: /rive\.wasm|@rive-app|rive-canvas/,
  spline: /splinetool|prod\.spline\.design/,
  unicorn: /UnicornStudio|unicornstudio/i,
  theatre: /@theatre\/core|theatrejs/,
  rapier: /rapier/i,
  matter: /Matter\.Engine|matter-js/,
  motion: /framer-motion|motion-dom|MotionValue/,
  anime: /animejs|anime\.js/,
  ogl: /\bOGL\b|from"ogl"|ogl\.js/,
  babylon: /BABYLON\./,
  customGLSL: /gl_FragColor|gl_FragCoord|gl_Position/,
  wgsl: /@fragment|@vertex|@compute/,
};

async function probeOne(browser, name, url) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });
  await ctx.addInitScript(() => {
    window.__ctx = [];
    window.__gpu = { accessed: false, adapter: false };
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      try { window.__ctx.push(String(t)); } catch (e) {}
      return orig.call(this, t, ...a);
    };
    if (window.OffscreenCanvas) {
      const o2 = OffscreenCanvas.prototype.getContext;
      OffscreenCanvas.prototype.getContext = function (t, ...a) { window.__ctx.push('offscreen:' + t); return o2.call(this, t, ...a); };
    }
    try {
      const d = Object.getOwnPropertyDescriptor(Navigator.prototype, 'gpu');
      if (d && d.get) {
        Object.defineProperty(Navigator.prototype, 'gpu', {
          configurable: true,
          get() {
            window.__gpu.accessed = true;
            const g = d.get.call(this);
            if (g && !g.__wrapped) {
              const ra = g.requestAdapter.bind(g);
              g.requestAdapter = (...x) => { window.__gpu.adapter = true; return ra(...x); };
              g.__wrapped = true;
            }
            return g;
          },
        });
      }
    } catch (e) {}
    window.__raf = 0;
    const r = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { window.__raf++; return r.call(window, cb); };
  });
  const page = await ctx.newPage();
  const jsHits = {};
  let jsBytes = 0, jsCount = 0;
  const scriptHosts = new Set();
  page.on('response', async (res) => {
    try {
      const rt = res.request().resourceType();
      if (rt !== 'script') return;
      const u = res.url();
      try { scriptHosts.add(new URL(u).host); } catch (e) {}
      const buf = await res.body();
      jsBytes += buf.length; jsCount++;
      if (buf.length > 8e6) return;
      const txt = buf.toString('utf8');
      for (const [k, re] of Object.entries(SIG)) if (re.test(txt) || re.test(u)) jsHits[k] = (jsHits[k] || 0) + 1;
    } catch (e) {}
  });
  const result = { name, url, ok: false };
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    result.status = resp ? resp.status() : null;
    await page.waitForTimeout(6500);
    // rAF rate at rest over 2s
    const raf0 = await page.evaluate(() => window.__raf);
    await page.waitForTimeout(2000);
    const raf1 = await page.evaluate(() => window.__raf);
    result.rafPerSecRest = Math.round((raf1 - raf0) / 2);
    const snap = () => page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('body *'));
      let blend = new Set(), blendCount = 0, clip = 0, sticky = 0, filt = 0, bdf = 0, mask = 0, persp = 0;
      let biggest = { size: 0 };
      const fams = {};
      let inView = 0;
      for (const el of all) {
        const cs = getComputedStyle(el);
        if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') { blend.add(cs.mixBlendMode); blendCount++; }
        if (cs.clipPath && cs.clipPath !== 'none') clip++;
        if (cs.position === 'sticky') sticky++;
        if (cs.filter && cs.filter !== 'none') filt++;
        if (cs.backdropFilter && cs.backdropFilter !== 'none') bdf++;
        if ((cs.maskImage && cs.maskImage !== 'none') || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none')) mask++;
        if (cs.perspective && cs.perspective !== 'none') persp++;
        const r = el.getBoundingClientRect();
        const vis = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && +cs.opacity > 0;
        if (vis) inView++;
        const own = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (own && vis) {
          const fs = parseFloat(cs.fontSize);
          const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
          fams[fam] = (fams[fam] || 0) + el.textContent.trim().length;
          if (fs > biggest.size) biggest = { size: fs, text: el.textContent.trim().slice(0, 40), family: fam, weight: cs.fontWeight, w: Math.round(r.width) };
        }
      }
      const anims = document.getAnimations ? document.getAnimations() : [];
      let inf = 0, scrollTl = 0, viewTl = 0;
      for (const a of anims) {
        try { if (a.effect && a.effect.getTiming().iterations === Infinity) inf++; } catch (e) {}
        const tl = a.timeline && a.timeline.constructor && a.timeline.constructor.name;
        if (tl === 'ScrollTimeline') scrollTl++;
        if (tl === 'ViewTimeline') viewTl++;
      }
      const bgOf = (e) => getComputedStyle(e).backgroundColor;
      let bg = bgOf(document.body);
      if (bg === 'rgba(0, 0, 0, 0)') bg = bgOf(document.documentElement) + ' (html)';
      const canv = Array.from(document.querySelectorAll('canvas')).map(c => { const r = c.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
      const customCursor = !!document.querySelector('[class*="cursor" i]:not(html):not(body)');
      const topFams = Object.entries(fams).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
      const g = {
        gsap: !!window.gsap, ScrollTrigger: !!window.ScrollTrigger, THREE: !!window.THREE, __THREE__: window.__THREE__ || null,
        Lenis: !!(window.Lenis || window.lenis), barba: !!window.barba, PIXI: !!window.PIXI, Webflow: !!window.Webflow,
        UnicornStudio: !!window.UnicornStudio, rive: !!window.rive, Matter: !!window.Matter, Splide: !!window.Splide,
        Swiper: !!window.Swiper, jQuery: !!window.jQuery,
      };
      const fw = {
        next: !!(window.__NEXT_DATA__ || window.next || document.querySelector('script[src*="/_next/"]')),
        nuxt: !!(window.__NUXT__ || window.useNuxtApp || document.querySelector('script[src*="/_nuxt/"]')),
        astro: !!document.querySelector('astro-island, script[src*="/_astro/"], link[href*="/_astro/"]'),
        sveltekit: !!document.querySelector('script[src*="/_app/immutable"], link[href*="/_app/immutable"]'),
        webflow: !!document.documentElement.getAttribute('data-wf-site'),
        framer: !!document.querySelector('meta[name="generator"][content*="Framer" i]'),
        wordpress: !!document.querySelector('link[href*="wp-content"], script[src*="wp-content"]'),
        vue: !!document.querySelector('[data-v-app], #__nuxt, [data-server-rendered]'),
        lenisClass: document.documentElement.classList.contains('lenis'),
      };
      return {
        nodes: all.length, inView, canvases: canv.length, canvasSizes: canv.slice(0, 5), ctx: Array.from(new Set(window.__ctx || [])),
        gpu: window.__gpu, videos: document.querySelectorAll('video').length, imgs: document.querySelectorAll('img').length,
        svgs: document.querySelectorAll('svg').length, blend: Array.from(blend), blendCount, clip, sticky, filt, backdrop: bdf, mask, persp,
        anims: anims.length, infinite: inf, scrollTl, viewTl, biggest, fonts: topFams, bg,
        cursorNoneBody: getComputedStyle(document.body).cursor === 'none', customCursorEl: customCursor,
        globals: g, fw, title: document.title.slice(0, 80), textLen: document.body.innerText.length,
      };
    });
    result.top = await snap();
    await page.screenshot({ path: path.join(OUT, `${name}--hero.jpg`), type: 'jpeg', quality: 55 });
    await page.mouse.wheel(0, 1100); await page.waitForTimeout(700);
    await page.mouse.wheel(0, 1100); await page.waitForTimeout(1500);
    const m = await snap();
    result.mid = { anims: m.anims, infinite: m.infinite, scrollTl: m.scrollTl, viewTl: m.viewTl, canvases: m.canvases, clip: m.clip, sticky: m.sticky, blendCount: m.blendCount, videos: m.videos, ctx: m.ctx, gpu: m.gpu };
    result.ok = true;
  } catch (e) {
    result.error = String(e.message || e).slice(0, 200);
  }
  result.jsKB = Math.round(jsBytes / 1024); result.jsFiles = jsCount; result.jsSig = jsHits; result.scriptHosts = Array.from(scriptHosts).slice(0, 15);
  await ctx.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--enable-unsafe-webgpu'] });
  const outFile = path.join(OUT, 'a2-probe.json');
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : [];
  const done = new Set(results.filter(r => r.ok).map(r => r.name));
  const queue = SITES.filter(([n]) => !done.has(n));
  const N = 4;
  async function worker() {
    while (queue.length) {
      const [name, url] = queue.shift();
      const r = await probeOne(browser, name, url);
      const i = results.findIndex(x => x.name === name);
      if (i >= 0) results[i] = r; else results.push(r);
      fs.writeFileSync(outFile, JSON.stringify(results, null, 1));
      console.log(name, r.ok ? 'ok' : 'FAIL ' + r.error);
    }
  }
  await Promise.all(Array.from({ length: N }, worker));
  await browser.close();
})();
