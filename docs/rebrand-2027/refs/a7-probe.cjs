// A7 probe: headless Chromium 1440x900, sites from other niches (fashion, luxury, museums, editorial, hotels, music).
// Based on a2-probe.cjs. Adds: hex colours of ground and text, loaded font families, text-transform of the
// largest line, share of the first viewport covered by images/video, cookie-banner dismissal, and a screenshot
// fallback with animations disabled.
const { chromium } = require('/Users/maximiliannovikov/Desktop/WEB3 TECH SI/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const OUT = '/Users/maximiliannovikov/Desktop/Novikov-claude-create-claude-documentation-9WUuP/docs/rebrand-2027/refs';
const SHOTS = path.join(OUT, 'a7');
const EXE = '/Users/maximiliannovikov/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
fs.mkdirSync(SHOTS, { recursive: true });

const SITES = process.argv.slice(2).map(s => { const i = s.indexOf('='); return [s.slice(0, i), s.slice(i + 1)]; });

const SIG = {
  gsap: /GreenSock|gsap\.registerPlugin|_gsap|"gsap"/,
  ScrollTrigger: /ScrollTrigger/,
  SplitText: /SplitText/,
  three: /WebGLRenderer|__THREE__|THREE\.WebGLRenderer/,
  threeWebGPU: /WebGPURenderer|WebGPUBackend/,
  r3f: /@react-three\/fiber|R3F:|react-three-fiber/,
  lenis: /lenis-smooth|lenis-scrolling|lenis-stopped/,
  locomotiveScroll: /locomotive-scroll|data-scroll-container/,
  barba: /@barba|barba\.init|barba-container/,
  swup: /swup/i,
  taxi: /@unseenco\/taxi|data-taxi/,
  highway: /@dogstudio\/highway|Highway\.Core/,
  pixi: /PIXI\.|pixi\.js|@pixi\//,
  rive: /rive\.wasm|@rive-app|rive-canvas/,
  spline: /splinetool|prod\.spline\.design/,
  unicorn: /UnicornStudio|unicornstudio/i,
  motion: /framer-motion|motion-dom|MotionValue/,
  ogl: /\bOGL\b|from"ogl"|ogl\.js/,
  customGLSL: /gl_FragColor|gl_FragCoord|gl_Position/,
  swiper: /swiper-wrapper|Swiper\(/,
  splitting: /Splitting\(|splitting\.js/,
  viewTransition: /startViewTransition/,
};

async function probeOne(browser, name, url) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
    locale: 'en-US',
  });
  await ctx.addInitScript(() => {
    window.__ctx = [];
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      try { window.__ctx.push(String(t)); } catch (e) {}
      return orig.call(this, t, ...a);
    };
    if (window.OffscreenCanvas) {
      const o2 = OffscreenCanvas.prototype.getContext;
      OffscreenCanvas.prototype.getContext = function (t, ...a) { window.__ctx.push('offscreen:' + t); return o2.call(this, t, ...a); };
    }
    window.__raf = 0;
    const r = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { window.__raf++; return r.call(window, cb); };
  });
  const page = await ctx.newPage();
  const jsHits = {};
  let jsBytes = 0, jsCount = 0;
  page.on('response', async (res) => {
    try {
      if (res.request().resourceType() !== 'script') return;
      const u = res.url();
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
    result.finalUrl = page.url();
    await page.waitForTimeout(+(process.env.WAIT || 6500));
    // dismiss cookie banners so the ground colour and the screenshot show the page, not the overlay
    result.cookieClicked = await page.evaluate(() => {
      const re = /^(accept( all)?( cookies)?|allow( all)?|agree|i agree|ok|got it|tout accepter|accepter|akzeptieren|alle akzeptieren|accetta( tutti)?|aceptar( todo)?|accept & close|j'accepte|acceptér alle|accepter alle|godkend alle|tillad alle|acceptera alla)$/i;
      const els = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const b = els.find(e => re.test((e.innerText || e.textContent || '').trim()));
      if (b) { b.click(); return (b.innerText || '').trim().slice(0, 30); }
      return null;
    }).catch(() => null);
    await page.waitForTimeout(900);
    const raf0 = await page.evaluate(() => window.__raf);
    await page.waitForTimeout(2000);
    const raf1 = await page.evaluate(() => window.__raf);
    result.rafPerSecRest = Math.round((raf1 - raf0) / 2);
    const snap = () => page.evaluate(() => {
      const hex = (c) => {
        const m = String(c).match(/rgba?\(([^)]+)\)/);
        if (!m) return c;
        const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        if (p.length === 4 && p[3] === 0) return 'transparent';
        return '#' + p.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase() + (p.length === 4 && p[3] < 1 ? `@${p[3]}` : '');
      };
      const opaqueBg = (el) => {
        while (el && el.nodeType === 1) {
          const cs = getComputedStyle(el);
          const b = cs.backgroundColor;
          if (b && !/rgba\([^)]*,\s*0\)$/.test(b) && b !== 'transparent') return { color: hex(b), tag: el.tagName.toLowerCase() };
          if (cs.backgroundImage && cs.backgroundImage !== 'none') return { color: 'image', tag: el.tagName.toLowerCase() };
          el = el.parentElement;
        }
        return { color: 'none', tag: '-' };
      };
      const all = Array.from(document.querySelectorAll('body *'));
      let clip = 0, sticky = 0, blendCount = 0;
      let biggest = { size: 0 };
      const fams = {};
      let inView = 0;
      let mediaArea = 0;
      const VW = innerWidth, VH = innerHeight;
      for (const el of all) {
        const cs = getComputedStyle(el);
        if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') blendCount++;
        if (cs.clipPath && cs.clipPath !== 'none') clip++;
        if (cs.position === 'sticky') sticky++;
        const r = el.getBoundingClientRect();
        const vis = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < VH && r.right > 0 && r.left < VW && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
        if (vis) inView++;
        if (vis && (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'PICTURE' && false)) {
          const w = Math.max(0, Math.min(r.right, VW) - Math.max(r.left, 0));
          const h = Math.max(0, Math.min(r.bottom, VH) - Math.max(r.top, 0));
          if (w * h > 400) mediaArea += w * h;
        }
        const own = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (own && vis) {
          const fs = parseFloat(cs.fontSize);
          const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
          fams[fam] = (fams[fam] || 0) + el.textContent.trim().length;
          if (fs > biggest.size) biggest = {
            size: fs, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50), family: cs.fontFamily.slice(0, 80), weight: cs.fontWeight,
            style: cs.fontStyle, transform: cs.textTransform, tracking: cs.letterSpacing, lh: cs.lineHeight, color: hex(cs.color), w: Math.round(r.width),
          };
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
      const bodyBg = hex(getComputedStyle(document.body).backgroundColor);
      const htmlBg = hex(getComputedStyle(document.documentElement).backgroundColor);
      const centreEl = document.elementFromPoint(VW / 2, VH * 0.75);
      const centre = opaqueBg(centreEl);
      const canv = Array.from(document.querySelectorAll('canvas')).map(c => { const r = c.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
      const loadedFonts = Array.from(new Set(Array.from(document.fonts || []).filter(f => f.status === 'loaded').map(f => f.family.replace(/["']/g, '')))).slice(0, 12);
      const topFams = Object.entries(fams).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
      let vtCss = false;
      try { for (const s of document.styleSheets) { try { for (const r of s.cssRules) { if (/view-transition/.test(r.cssText)) { vtCss = true; break; } } } catch (e) {} if (vtCss) break; } } catch (e) {}
      const g = {
        gsap: !!window.gsap, ScrollTrigger: !!window.ScrollTrigger, THREE: !!window.THREE, __THREE__: window.__THREE__ || null,
        Lenis: !!(window.Lenis || window.lenis), barba: !!window.barba, Webflow: !!window.Webflow, Shopify: !!window.Shopify, jQuery: !!window.jQuery,
      };
      const fw = {
        next: !!(window.__NEXT_DATA__ || window.next || document.querySelector('script[src*="/_next/"]')),
        nuxt: !!(window.__NUXT__ || document.querySelector('script[src*="/_nuxt/"]')),
        astro: !!document.querySelector('astro-island, script[src*="/_astro/"], link[href*="/_astro/"]'),
        sveltekit: !!document.querySelector('script[src*="/_app/immutable"], link[href*="/_app/immutable"]'),
        webflow: !!document.documentElement.getAttribute('data-wf-site'),
        framer: !!document.querySelector('meta[name="generator"][content*="Framer" i]'),
        readymag: !!document.querySelector('script[src*="readymag"], link[href*="readymag"]') || /readymag/i.test(document.documentElement.outerHTML.slice(0, 20000)),
        wordpress: !!document.querySelector('link[href*="wp-content"], script[src*="wp-content"]'),
        lenisClass: document.documentElement.classList.contains('lenis'),
      };
      return {
        nodes: all.length, inView, canvases: canv.length, canvasSizes: canv.slice(0, 4), ctx: Array.from(new Set(window.__ctx || [])),
        videos: document.querySelectorAll('video').length, imgs: document.querySelectorAll('img').length, svgs: document.querySelectorAll('svg').length,
        mediaCover: Math.round(100 * Math.min(1, mediaArea / (VW * VH))),
        clip, sticky, blendCount, anims: anims.length, infinite: inf, scrollTl, viewTl, vtCss,
        biggest, fonts: topFams, loadedFonts, bodyBg, htmlBg, centreBg: centre, bodyColor: hex(getComputedStyle(document.body).color),
        globals: g, fw, title: document.title.slice(0, 80), lang: document.documentElement.lang, textLen: document.body.innerText.length,
      };
    });
    result.top = await snap();
    const shot = path.join(SHOTS, `${name}.jpg`);
    try {
      await page.screenshot({ path: shot, type: 'jpeg', quality: 60, timeout: 15000 });
      result.shot = 'normal';
    } catch (e) {
      try {
        await page.screenshot({ path: shot, type: 'jpeg', quality: 60, timeout: 15000, animations: 'disabled' });
        result.shot = 'animations-disabled';
      } catch (e2) { result.shot = 'failed: ' + String(e2.message).slice(0, 80); }
    }
    await page.mouse.wheel(0, 1100); await page.waitForTimeout(700);
    await page.mouse.wheel(0, 1100); await page.waitForTimeout(1500);
    const m = await snap();
    result.mid = { anims: m.anims, infinite: m.infinite, scrollTl: m.scrollTl, viewTl: m.viewTl, canvases: m.canvases, clip: m.clip, sticky: m.sticky, videos: m.videos, ctx: m.ctx, mediaCover: m.mediaCover, centreBg: m.centreBg, fonts: m.fonts };
    result.ok = true;
  } catch (e) {
    result.error = String(e.message || e).slice(0, 200);
  }
  result.jsKB = Math.round(jsBytes / 1024); result.jsFiles = jsCount; result.jsSig = jsHits;
  await ctx.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const outFile = path.join(OUT, 'a7-probe.json');
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : [];
  const done = new Set(results.filter(r => r.ok).map(r => r.name));
  const queue = SITES.filter(([n]) => !done.has(n));
  const N = 4;
  async function worker() {
    while (queue.length) {
      const [name, url] = queue.shift();
      const r = await Promise.race([
        probeOne(browser, name, url),
        new Promise(res => setTimeout(() => res({ name, url, ok: false, error: 'hard timeout 120s' }), 120000)),
      ]);
      const i = results.findIndex(x => x.name === name);
      if (i >= 0) results[i] = r; else results.push(r);
      fs.writeFileSync(outFile, JSON.stringify(results, null, 1));
      console.log(name, r.ok ? `ok shot=${r.shot}` : 'FAIL ' + r.error);
    }
  }
  await Promise.all(Array.from({ length: N }, worker));
  await browser.close();
})();
