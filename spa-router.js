(function () {
  const app = document.getElementById('app');
  const routeLoader = document.getElementById('route-loader');
  const STYLE_MARK = 'data-spa-style';

  // Vistas por defecto (si no hay SPA_VIEWS desde Excel)
  const VIEWS_DEFAULT = {
    menu:     { url: 'menu.html',     css: ['estilos2.css'] },
    servicio: { url: 'servicio.html', css: ['estilos-servicios.css'] },
    nosotros: { url: 'nosotros.html', css: ['estilosnosotros.css'] }
  };

  // Usa vistas de Excel si existen; si no, las de arriba.
  function getViews(){
    const v = (window.SPA_VIEWS && typeof window.SPA_VIEWS === 'object') ? window.SPA_VIEWS : null;
    return (v && Object.keys(v).length) ? v : VIEWS_DEFAULT;
  }

  // ---- Estilos por vista ----
  function ensureStyles(cssList) {
    try {
      document.querySelectorAll(`link[${STYLE_MARK}="1"]`).forEach(n => n.remove());
      (cssList || []).forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute(STYLE_MARK, '1');
        document.head.appendChild(link);
      });
    } catch (_) {}
  }

  // ---- Loader de transición ----
  function showRouteLoader() {
    if (!routeLoader) return;
    routeLoader.classList.remove('rf-hidden');
    routeLoader.style.removeProperty('display');
    routeLoader.classList.remove('rf-hide');
    routeLoader.style.setProperty('display', 'block', 'important');
    routeLoader.style.opacity = 1;
    routeLoader.style.pointerEvents = 'all';
  }
  function hideRouteLoader() {
    if (!routeLoader) return;
    routeLoader.classList.add('rf-hide');
    routeLoader.style.pointerEvents = 'none';
    setTimeout(() => {
      routeLoader.classList.add('rf-hidden');
      routeLoader.style.setProperty('display', 'none', 'important');
    }, 220);
  }

  // ---- Timeout helper ----
  function withTimeout(promise, ms, errMsg = 'Tiempo de espera agotado') {
    return Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error(errMsg)), ms))
    ]);
  }

  // Evita modales duplicados traídos por vistas
  function scrubModalDuplicates(doc) {
    try {
      doc.querySelectorAll('#modalEmpresa, #modalRepartidor').forEach(n => n.remove());
    } catch (_) {}
  }

  // ---- Carga de vistas (con abort en navegación rápida) ----
  let activeController = null;

  async function loadView(key, view) {
    showRouteLoader();

    // Aborta fetch anterior si existía
    if (activeController) try { activeController.abort(); } catch (_) {}
    activeController = new AbortController();

    const safety = setTimeout(hideRouteLoader, 4000);
    try {
      const res = await withTimeout(
        fetch(view.url, { cache: 'no-store', signal: activeController.signal }),
        12000,
        'Timeout cargando la vista'
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${view.url}`);

      const text = await res.text();
      const doc  = new DOMParser().parseFromString(text, 'text/html');

      scrubModalDuplicates(doc);
      app.innerHTML = doc.body ? doc.body.innerHTML : text;

      ensureStyles(view.css);
      bindInternalNav(app);
      initHero(app);
      window.scrollTo(0, 0);

      // ✨ Avisar que la vista quedó lista
      document.dispatchEvent(new CustomEvent('spa:view-loaded', {
        detail: { key, root: app }
      }));
    } catch (err) {
      if (err && err.name === 'AbortError') return; // navegación rápida: abortado
      console.error('Error cargando vista:', err);
      if (app) app.innerHTML =
        '<div style="padding:24px"><h2>Error al cargar</h2><p>' +
        (err && err.message ? err.message : 'Inténtalo nuevamente.') +
        '</p><p><small>Revisa que el archivo exista junto a index.html.</small></p></div>';
    } finally {
      clearTimeout(safety);
      hideRouteLoader();
      setTimeout(hideRouteLoader, 300);
    }
  }

  // ---- Router ----
  function resolveViewFromHash() {
    const h = (location.hash || '').toLowerCase();
    if (h.startsWith('#/servicio')) return 'servicio';
    if (h.startsWith('#/nosotros')) return 'nosotros';
    return 'menu';
  }

  function route() {
    const key = resolveViewFromHash();
    try { document.documentElement.setAttribute('data-route', key); } catch(_) {}
    const view = getViews()[key];
    if (view) loadView(key, view); else hideRouteLoader();
  }

  function bindInternalNav(root = document) {
    // a) Enlaces con data-view="..."
    root.querySelectorAll('[data-view]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const v = a.getAttribute('data-view');
        if (v) location.hash = `#/${v}`;
      }, { passive: false });
    });
    // b) Enlaces directos con href="#/..."
    root.querySelectorAll('a[href^="#/"]').forEach(a => {
      if (a.hasAttribute('data-view')) return; // ya manejado arriba
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const href = a.getAttribute('href');
        if (href) location.hash = href;
      }, { passive: false });
    });
  }

  const mo = new MutationObserver(() => hideRouteLoader());
  if (app) mo.observe(app, { childList: true, subtree: false });

  window.addEventListener('error', hideRouteLoader);
  window.addEventListener('unhandledrejection', hideRouteLoader);

  // ---- Carrusel / HERO ----
  let heroTimer = null; // evita timers apilados al cambiar de vista

  function initHero(root){
    try{
      if (!root) return;
      if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }

      const header  = root.querySelector('header');
      const heroBox = root.querySelector('.hero-text');

      const imgs = Array.isArray(window.HERO_IMAGES) ? window.HERO_IMAGES : [];
      const caps = Array.isArray(window.HERO_CAPTIONS) ? window.HERO_CAPTIONS : null;
      if (!header || !imgs.length) return;

      let i = 0;
      const shouldShowText = (idx) => {
        if (caps) return caps[idx] !== null;
        const src = imgs[idx] || "";
        return /(?:^|\/)banner\.png$/i.test(src);
      };

      const apply = () => {
        const src = imgs[i] || "";
        header.style.backgroundImage    = `url('${src}')`;
        header.style.backgroundSize     = 'cover';
        header.style.backgroundPosition = 'center';
        header.style.height             = '500px';

        if (heroBox) {
          const show = shouldShowText(i);
          heroBox.classList.toggle('is-hidden', !show);
          heroBox.style.display = show ? '' : 'none';
        }
      };

      apply();

      const left  = root.querySelector('.hero-arrow-left');
      const right = root.querySelector('.hero-arrow-right');
      if (left)  left.onclick  = () => { i = (i - 1 + imgs.length) % imgs.length; apply(); };
      if (right) right.onclick = () => { i = (i + 1) % imgs.length; apply(); };

      const ms = Number(window.HERO_AUTOPLAY_MS);
      if (Number.isFinite(ms) && ms > 0) {
        heroTimer = setInterval(() => { i = (i + 1) % imgs.length; apply(); }, ms);
      }
    }catch(_){}
  }

  // API pública
  window.SPARouter = {
    init() {
      bindInternalNav(document);
      window.addEventListener('hashchange', route);
      route();
    },
    route,   // por si quieres forzar navegación externa
    reload() {
      const key = resolveViewFromHash();
      const view = getViews()[key];
      if (view) loadView(key, view);
    }
  };
})();
  
// --- Favicon desde JS (con cache-bust y soporte SPA) ---
function setFavicon(src, opts = {}) {
  const href = new URL(src, location.href).href + (opts.cacheBust === false ? "" : `?v=${Date.now()}`);
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
  icon.type = opts.type || 'image/png';
  icon.sizes = opts.sizes || '';
  icon.href = href;

  let shortcut = document.querySelector('link[rel="shortcut icon"]');
  if (!shortcut) { shortcut = document.createElement('link'); shortcut.rel = 'shortcut icon'; document.head.appendChild(shortcut); }
  shortcut.href = href;
}

// Llamadas automáticas de favicon (opcional)
document.addEventListener('DOMContentLoaded', () => setFavicon('logo.png'));
document.addEventListener('spa:view-loaded', () => setFavicon('logo.png'));

// gmail

// ===== Mailto para el <span id="contacto_correo_texto"> dentro de su <a> =====
(function () {
  function buildMailto(to, subject, body){
    const qs = new URLSearchParams();
    if (subject) qs.set("subject", subject);
    if (body) qs.set("body", body);
    return `mailto:${to}${qs.toString() ? "?" + qs.toString() : ""}`;
  }
  function buildGmail(to, subject, body){
    return `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(to)}` +
      `&su=${encodeURIComponent(subject || "")}` +
      `&body=${encodeURIComponent(body || "")}`;
  }

  function wireMailto(){
    const span = document.getElementById("contacto_correo_texto");
    if (!span) return;

    const a = span.closest("a");
    if (!a) return;

    // Evita que el router intercepte (por si alguien puso data-view)
    a.removeAttribute("data-view");
    a.removeAttribute("target");          // mailto mejor en _self
    a.style.pointerEvents = "auto";

    // Obtén el destinatario: data-to > mailto del href > default
    let to = (a.dataset.to || "").trim();
    if (!to) {
      const m = (a.getAttribute("href") || "").match(/^mailto:([^?]+)/i);
      to = m && m[1] ? m[1] : "rapid@rapidflex.cl";
    }
    const subject = (a.dataset.subject || "").trim();
    const body    = (a.dataset.body    || "").trim();

    const mailto = buildMailto(to, subject, body);
    const gmail  = buildGmail(to, subject, body);

    a.href = mailto; // deja el mailto “natural”

    // Fallback: si tras 400ms seguimos con foco (no abrió cliente), abre Gmail
    a.addEventListener("click", function () {
      setTimeout(() => {
        try {
          if (document.hasFocus()) window.open(gmail, "_blank", "noopener");
        } catch (_) {}
      }, 400);
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", wireMailto);
  document.addEventListener("spa:view-loaded", wireMailto);
})();
