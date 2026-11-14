// Smoothie theme for Millennium.
// 1. Palette remap: re-declares the colors of Steam's own stylesheets with Smoothie's neutral palette,
//    computed at runtime (no build step; follows Steam updates by itself).
// 2. Taller game-list rows (cover + two lines).
// 3. The selected game's art as a blurred, crossfading backdrop.

// Pure color logic, kept separate so tests/color.test.mjs can run it under node.
globalThis.SmoothieColor = (() => {
  const BLUE = [35, 131, 226]; // #2383e2: buttons, fills
  const BLUE_TEXT = [82, 156, 202]; // #529cca: light blue text, links
  const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

  function parse(c) {
    c = c.trim();
    if (c[0] === "#") {
      let h = c.slice(1);
      if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("");
      if (h.length !== 6 && h.length !== 8) return null;
      const n = (i) => parseInt(h.slice(i, i + 2), 16);
      return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
    }
    const nums = c.match(/[\d.]+%?/g);
    if (!nums || nums.length < 3 || nums.slice(0, 3).some((x) => x.endsWith("%"))) return null;
    let a = nums[3] ?? "1";
    a = a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a);
    return [Math.trunc(+nums[0]), Math.trunc(+nums[1]), Math.trunc(+nums[2]), a];
  }

  const hex = (v) => v.toString(16).padStart(2, "0");
  const fmt = (r, g, b, a) => (a < 1 ? `rgba(${r},${g},${b},${Math.round(a * 1000) / 1000})` : `#${hex(r)}${hex(g)}${hex(b)}`);

  function hls(r, g, b) { // same convention as Python's colorsys.rgb_to_hls; hue in degrees
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, l, 0];
    const d = max - min, s = l <= 0.5 ? d / (max + min) : d / (2 - max - min);
    let h = max === r ? (g - b) / d : max === g ? 2 + (b - r) / d : 4 + (r - g) / d;
    h = ((h / 6) % 1 + 1) % 1;
    return [h * 360, l, s];
  }

  function remap(c, text = false) {
    const p = parse(c);
    if (!p) return c;
    const [r, g, b, a] = p, [hue, l, s] = hls(r, g, b), bluish = hue >= 180 && hue <= 250;
    if (text && bluish && l > 0.6) { const v = Math.round(l * 255); return fmt(v, v, v, a); } // text never blue-tinted
    if (bluish && s >= 0.5 && l >= 0.35) return fmt(...(l > 0.6 ? BLUE_TEXT : BLUE), a); // Steam accent blue
    if (s < 0.2 || (bluish && s < 0.6)) { // Steam blue-grey surfaces/text -> neutral, darker surfaces
      const v = Math.round(l * 255 * (l < 0.4 ? 0.88 : 1));
      return fmt(v, v, v, a);
    }
    return c; // greens, reds, oranges keep their meaning
  }

  // Flat color for a panel gradient, else null. Fades (a stop at ~0 alpha) stay: they blend over images.
  function flatten(val) {
    if (!val.includes("gradient(") || val.includes("transparent")) return null;
    const cs = (val.match(COLOR_RE) || []).map(parse);
    if (!cs.length || cs.includes(null) || cs.some((c) => c[3] < 0.05)) return null;
    const same = (c, ref) => c[0] === ref[0] && c[1] === ref[1] && c[2] === ref[2];
    if (cs.some((c) => same(c, BLUE) || same(c, BLUE_TEXT))) return fmt(...BLUE, 1);
    const avg = (i) => cs.reduce((t, c) => t + c[i], 0) / cs.length;
    return fmt(Math.round(avg(0)), Math.round(avg(1)), Math.round(avg(2)), avg(3));
  }

  const recolor = (val, text) => val.replace(COLOR_RE, (m) => remap(m, text));
  return { parse, fmt, remap, flatten, recolor };
})();

if (typeof document !== "undefined") (() => {
  const C = globalThis.SmoothieColor;
  const root = document.documentElement;

  // ---------- 1. Palette remap (every window: main, menus, popups, friends) ----------
  // CSSOM gives longhands, so `background: linear-gradient(...)` arrives as background-image.
  const PROPS = ["color", "background-color", "background-image", "border-top-color", "border-right-color",
    "border-bottom-color", "border-left-color", "outline-color", "box-shadow", "fill", "stroke"];
  const done = new WeakSet();
  let out = null;

  function ruleCss(rule) {
    const decls = [];
    for (const p of PROPS) {
      const v = rule.style.getPropertyValue(p);
      if (!v || v.includes("var(") || v.includes("url(")) continue;
      const nv = C.recolor(v, p === "color");
      const flat = p === "background-image" ? C.flatten(nv) : null;
      if (flat) decls.push(`background-image:none !important;background-color:${flat} !important`);
      else if (nv !== v) decls.push(`${p}:${nv} !important`);
    }
    return decls.length ? `${rule.selectorText}{${decls.join(";")}}` : "";
  }

  function walk(rules, acc) {
    for (const r of rules) {
      if (r.selectorText !== undefined && r.style) {
        const css = ruleCss(r);
        if (css) acc.push(css);
      } else if (r.cssRules && (r instanceof CSSMediaRule || r instanceof CSSSupportsRule)) {
        const inner = [];
        walk(r.cssRules, inner);
        if (inner.length) acc.push(`@${r instanceof CSSMediaRule ? "media " + r.media.mediaText : "supports " + r.conditionText}{${inner.join("\n")}}`);
      }
    }
  }

  function remapSheets() {
    if (!document.head) return;
    if (!out) { out = document.createElement("style"); out.id = "smoothie-remap"; document.head.appendChild(out); }
    for (const sheet of document.styleSheets) {
      if (done.has(sheet) || sheet.ownerNode === out) continue;
      let rules;
      try { rules = sheet.cssRules; } catch (e) { // cross-origin (the theme's own CSS) or still loading
        if (e.name === "SecurityError") done.add(sheet);
        continue;
      }
      done.add(sheet);
      const acc = [];
      walk(rules, acc);
      // unlayered !important: beats Steam's rules; the theme's own @layer smoothie !important still beats this
      if (acc.length) out.appendChild(document.createTextNode(acc.join("\n") + "\n"));
    }
  }

  // ---------- 2. Taller game-list rows ----------
  const GAME_ROW = 52;
  const fiberOf = (el) => el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))];
  const upTo = (f, test) => { while (f && !(f.stateNode && test(f.stateNode))) f = f.return; return f && f.stateNode; };

  // shortcut: Steam hardcodes 26px rows (sp.js, RowHeightMeasure is a frozen bound method), so we wrap
  // react-virtualized's size getter inside the mounted Grid. If Steam changes the list, rows stay at 26px.
  function patchRows() {
    const el = document.querySelector(".ReactVirtualized__List");
    if (!el || el.dataset.smoothieRows) return;
    const fiber = fiberOf(el);
    const owner = fiber && upTo(fiber, (s) => typeof s.SetRowIsCollapsed === "function");
    const grid = fiber && upTo(fiber, (s) => s.state && s.state.instanceProps && s.state.instanceProps.rowSizeAndPositionManager);
    const list = fiber && upTo(fiber, (s) => typeof s.recomputeRowHeights === "function");
    if (!owner || !grid || !list) return;
    const mgr = grid.state.instanceProps.rowSizeAndPositionManager;
    const inner = mgr._cellSizeAndPositionManager || mgr;
    const wrap = (get) => (p) => (owner.visibleRows[p.index]?.bIsCollection ? get(p) : GAME_ROW);
    inner._cellSizeGetter = wrap(inner._cellSizeGetter);
    const configure = inner.configure.bind(inner);
    inner.configure = (o) => configure({ ...o, cellSizeGetter: wrap(o.cellSizeGetter) }); // Grid reconfigures on every props update
    el.dataset.smoothieRows = "1";
    list.recomputeRowHeights();
    root.classList.add("smoothie-tall-rows"); // CSS restyles rows only once heights changed
  }

  // ---------- 3. Game art backdrop (main window only) ----------
  // Crossfade: preload the new art, put it in the hidden layer (A/B), then flip which layer is visible.
  // The last selected game's art stays on every page (Store, Community, profile, library home) and across restarts.
  const isMain = () => root.classList.contains("MillenniumWindow_MainSteamWindow");
  let wanted = null;
  function syncArt() {
    // several game pages coexist during transitions: take the hero actually on screen
    const img = [...document.querySelectorAll(".TopCapsule img.ImgSrc:not(.ImgBlur)")].find((i) => i.getBoundingClientRect().width > 0);
    let src = img && img.currentSrc;
    if (src) { try { localStorage.setItem("smoothie-art", src); } catch (e) {} }
    else { try { src = localStorage.getItem("smoothie-art"); } catch (e) {} } // not on a game page: keep the last one
    if (!src || src === wanted) return;
    wanted = src;
    const pre = new Image();
    pre.onload = () => {
      if (wanted !== src) return; // user already moved to another game
      const showB = !root.classList.contains("smoothie-art-b");
      root.style.setProperty(showB ? "--smoothie-art-b" : "--smoothie-art-a", `url("${src.replace(/"/g, "%22")}")`);
      requestAnimationFrame(() => { // let the hidden layer get its image before fading it in
        root.classList.toggle("smoothie-art-b", showB);
        root.classList.add("smoothie-has-art");
      });
    };
    pre.src = src;
  }

  const safe = (name, fn) => { try { fn(); } catch (e) { console.warn("[smoothie]", name, e); } };
  const tick = () => {
    safe("remap", remapSheets); // picks up stylesheets Steam loads later (lazy chunks)
    if (!isMain()) return;
    safe("rows", patchRows);
    safe("art", syncArt);
  };
  setInterval(tick, 500); // list remounts, lazy stylesheets and game page changes on navigation
  tick();
})();
