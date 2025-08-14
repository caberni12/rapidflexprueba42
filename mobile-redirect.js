/*! mobile-redirect.js - redirect mobile/tablet home to 'servicio' */
(function () {
  try {
    var w = window;
    var d = document;

    // Consider "mobile/tablet" up to 1024px OR common mobile UAs
    var isSmallWidth = Math.min(w.screen.width || 0, w.innerWidth || 0) <= 1024;
    var isMobileUA = /(Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini)/i.test(navigator.userAgent || '');
    var isMobile = isSmallWidth || isMobileUA;

    if (!isMobile) return;

    var onRoot = (location.pathname === '/' || /\/index\.html?$/i.test(location.pathname));
    var alreadyServicio = (/\/servicio(?:\/)?$/i.test(location.pathname) ||
                           /(^|#)\/?servicio/i.test(location.hash));

    // Avoid redirect loops
    if (!onRoot || alreadyServicio) return;

    // Choose route style:
    // - Path (default): /servicio
    // - Hash (if your SPA uses hash router): set window.__USE_HASH_ROUTER = true before including this file.
    var preferHash = (w.__USE_HASH_ROUTER === true);
    var dest = preferHash ? '#/servicio' : '/servicio';

    // Preserve query string if needed
    var qs = location.search || '';

    // Only redirect if not already at the destination
    if (!preferHash && location.pathname !== '/servicio') {
      location.replace(dest + qs);
      return;
    }
    if (preferHash && !/\/servicio/i.test(location.hash)) {
      location.replace(dest + qs);
      return;
    }
  } catch (e) {
    /* swallow */
  }
})();