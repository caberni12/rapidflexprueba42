(function () {
  const app = document.getElementById('app');
  const routeLoader = document.getElementById('route-loader');
  const STYLE_MARK = 'data-spa-style';

  // Rutas -> archivos y CSS asociados
  const VIEWS = {
    menu:     { url: 'menu.html',      css: ['estilos2.css'] },
    servicio: { url: 'servicio.html',  css: ['estilos-servicios.css'] },
    nosotros: { url: 'nosotros.html',  css: ['estilosnosotros.css'] }
  };

  // ---- Utilidades de estilos por vista ---- estilosnosotros.css,excel-to-css.js
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

  // Evita que vistas traigan sus propios modales duplicados
  function scrubModalDuplicates(doc) {
    try {
      doc.querySelectorAll('#modalEmpresa, #modalRepartidor').forEach(n => n.remove());
    } catch (_) {}
  }

  // ---- Carga de vistas ----
  async function loadView(key, view) {
    showRouteLoader();
    const safety = setTimeout(hideRouteLoader, 4000);
    try {
      const res = await withTimeout(fetch(view.url, { cache: 'no-store' }), 12000, 'Timeout cargando la vista');
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
      console.error('Error cargando vista:', err);
      if (app) app.innerHTML = '<div style="padding:24px"><h2>Error al cargar</h2><p>'
        + (err && err.message ? err.message : 'Inténtalo nuevamente.') +
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
    const view = VIEWS[key];
    if (view) loadView(key, view); else hideRouteLoader();
  }

  function bindInternalNav(root = document) {
    root.querySelectorAll('[data-view]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const view = a.getAttribute('data-view');
        if (view) location.hash = `#/${view}`;
      });
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
    }
  };
})();

// --- Favicon desde JS (con cache-bust y soporte SPA) ---
function setFavicon(src, opts = {}) {
  // Resuelve ruta relativa y rompe caché (puedes desactivar con {cacheBust:false})
  const href = new URL(src, location.href).href + (opts.cacheBust === false ? "" : `?v=${Date.now()}`);

  // <link rel="icon" ...>
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
  icon.type = opts.type || 'image/png';
  icon.sizes = opts.sizes || '';         // por si usas 16x16 / 32x32
  icon.href = href;

  // <link rel="shortcut icon" ...> (algunos navegadores antiguos)
  let shortcut = document.querySelector('link[rel="shortcut icon"]');
  if (!shortcut) { shortcut = document.createElement('link'); shortcut.rel = 'shortcut icon'; document.head.appendChild(shortcut); }
  shortcut.href = href;
}

// Llamadas automáticas
document.addEventListener('DOMContentLoaded', () => setFavicon('logo.png')); // o '/logo.png'
document.addEventListener('spa:view-loaded', () => setFavicon('logo.png'));
