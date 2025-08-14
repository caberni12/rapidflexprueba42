// excel-config.js
// Requiere: <script src="https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js"></script>
// Uso: const cfg = await ExcelConfig.load('config_spa.xlsx'); ExcelConfig.applyToSPA(cfg);

(function () {
  function tableToDict(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const dict = {};
    rows.forEach(r => { if (r.key !== undefined && r.value !== undefined) dict[String(r.key).trim()] = String(r.value); });
    return dict;
  }
  function sheetToViews(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const views = {};
    rows.forEach(r => {
      const key = String(r.key || "").trim();
      const url = String(r.url || "").trim();
      if (!key || !url) return;
      const cssList = [];
      Object.keys(r).forEach(k => { if (/^css\d+$/i.test(k) && String(r[k]).trim()) cssList.push(String(r[k]).trim()); });
      views[key] = { url, css: cssList };
    });
    return views;
  }
  function sheetToHero(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    rows.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const images = [], captions = [];
    rows.forEach(r => {
      const img = String(r.image || "").trim(); if (!img) return;
      images.push(img);
      const s = String(r.show_text).toLowerCase();
      const show = (s === "true" || s === "1" || s === "si" || s === "sí" || s === "yes");
      captions.push(show ? undefined : null);
    });
    return { images, captions };
  }
  function sheetToColors(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return rows.map(r => ({
      key: String(r.key || "").trim(),
      color: String(r.color || "").trim(),
      bg: String(r.bg || "").trim(),
      border: String(r.border || "").trim(),
      hover: String(r.hover || "").trim(),
    })).filter(r => r.key);
  }
  function sheetToTheme(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const vars = {};
    rows.forEach(r => {
      const k = String(r.var || "").trim();
      const v = String(r.value || "").trim();
      if (k) vars[k] = v;
    });
    return vars;
  }
  function sheetToTexts(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return rows.map(r => ({
      route: String(r.route || "").trim(),
      key: String(r.key || "").trim(),
      value: String(r.value || ""),
    })).filter(r => r.key);
  }
  function applyTexts(root, texts, routeKey) {
    if (!Array.isArray(texts) || !texts.length) return;
    const where = root || document;
    texts.forEach(item => {
      if (item.route && routeKey && item.route.toLowerCase() !== routeKey.toLowerCase()) return;
      const sel = '#' + CSS.escape(item.key);
      const el = where.querySelector(sel) || document.getElementById(item.key) || where.querySelector(`[data-key="${item.key}"]`);
      if (!el) return;
      el.innerHTML = item.value;
    });
  }
  function injectColorsTheme(colors) {
    const id = "excel-theme";
    let style = document.getElementById(id);
    if (!style) { style = document.createElement("style"); style.id = id; document.head.appendChild(style); }
    let css = "";
    colors.forEach(r => {
      const sel = `#${r.key}, [data-key="${r.key}"]`;
      const body = [
        r.color ? `color:${r.color} !important` : "",
        r.bg ? `background-color:${r.bg} !important` : "",
        r.border ? `border-color:${r.border} !important` : "",
      ].filter(Boolean).join(";");
      if (body) css += `${sel}{${body}}\n`;
      if (r.hover) css += `${sel}:hover{color:${r.hover} !important}\n`;
    });
    style.textContent = css;
  }
  function injectThemeVars(vars) {
    const id = "excel-vars";
    let style = document.getElementById(id);
    if (!style) { style = document.createElement("style"); style.id = id; document.head.appendChild(style); }
    let css = [":root{"];
    Object.keys(vars).forEach(k => {
      let val = vars[k];
      if (/height|pad|size|width/i.test(k) && /^[0-9]+$/.test(val)) val = val + "px";
      css.push(`--${k}:${val};`);
    });
    css.push("}");
    style.textContent = css.join("");
  }
  async function loadExcel(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar " + url + " (HTTP " + res.status + ")");
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const appSheet    = wb.Sheets["APP"];
    const viewsSheet  = wb.Sheets["VIEWS"];
    const heroSheet   = wb.Sheets["HERO"];
    const colorsSheet = wb.Sheets["COLORS"];
    const themeSheet  = wb.Sheets["THEME"];
    const textsSheet  = wb.Sheets["TEXTS"];
    const app    = appSheet ? tableToDict(appSheet) : {};
    const views  = viewsSheet ? sheetToViews(viewsSheet) : {};
    const hero   = heroSheet ? sheetToHero(heroSheet) : { images: [], captions: [] };
    const colors = colorsSheet ? sheetToColors(colorsSheet) : [];
    const theme  = themeSheet ? sheetToTheme(themeSheet) : {};
    const texts  = textsSheet ? sheetToTexts(textsSheet) : [];
    return {
      favicon: app["favicon"] || "",
      hero_autoplay_ms: Number(app["hero_autoplay_ms"] || 0) || 0,
      default_view: app["default_view"] || "menu",
      views,
      hero_images: hero.images,
      hero_captions: hero.captions,
      colors,
      theme,
      texts
    };
  }
  function applyToSPA(cfg) {
    if (cfg.theme && Object.keys(cfg.theme).length) injectThemeVars(cfg.theme);
    if (Array.isArray(cfg.colors)) injectColorsTheme(cfg.colors);
    if (Array.isArray(cfg.hero_images) && cfg.hero_images.length) window.HERO_IMAGES = cfg.hero_images;
    if (Array.isArray(cfg.hero_captions) && cfg.hero_captions.length) window.HERO_CAPTIONS = cfg.hero_captions;
    if (Number.isFinite(cfg.hero_autoplay_ms)) window.HERO_AUTOPLAY_MS = cfg.hero_autoplay_ms;
    if (cfg.views && Object.keys(cfg.views).length) window.SPA_VIEWS = cfg.views;
    if (cfg.favicon && typeof window.setFavicon === "function") { try { window.setFavicon(cfg.favicon); } catch(_) {} }

    // Aplicar TEXTS cada vez que una vista termina de cargar
    document.addEventListener('spa:view-loaded', (ev) => {
      const key = ev && ev.detail && ev.detail.key ? ev.detail.key : "";
      const root = ev && ev.detail && ev.detail.root ? ev.detail.root : document;
      applyTexts(root, cfg.texts, key);
    });
    // Primer render (por si ya hay contenido)
    applyTexts(document, cfg.texts, "");

    if (!location.hash && (cfg.default_view || "").length) location.hash = "#/" + cfg.default_view;
  }
  window.ExcelConfig = { load: loadExcel, applyToSPA };
})();
