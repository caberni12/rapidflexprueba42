/*! mobile-redirect.servicio.js
 * Redirige MÓVIL/TABLET al hash-route de "servicio" en GitHub Pages
 * Destino: https://caberni12.github.io/rapidflexprueba40/#/servicio
 * Cómo usar: <script src="/mobile-redirect.servicio.js"></script> en el <head>
 * (Cárgalo en /rapidflexprueba40/ index.html y páginas base)
 */
(function () {
  try {
    if (window.__DISABLE_MOBILE_REDIRECT__) return; // bandera para desactivar si hace falta

    var TARGET = "https://caberni12.github.io/rapidflexprueba40/#/servicio";

    // Consideramos móvil/tablet si ancho <=1024px o UA móvil
    var isSmall = Math.min(screen.width || 0, innerWidth || 0) <= 1024;
    var isUA    = /(Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini)/i.test(navigator.userAgent || "");
    var isMobile = isSmall || isUA;
    if (!isMobile) return;

    // Solo redirigir cuando estamos en el sitio de GitHub Pages del repo rapidflexprueba40
    var isRepo = (location.origin === "https://caberni12.github.io") &&
                 (location.pathname.indexOf("/rapidflexprueba40/") === 0);

    // Consideramos "inicio" si el hash está vacío / # / #/
    var hash = location.hash || "";
    var isHomeHashEmpty = (hash === "" || hash === "#" || hash === "#/" ||
                           /^#\/(home|inicio)?$/i.test(hash));

    // Si ya estamos en #/servicio, no hacer nada
    var alreadyAtServicio = /#\/servicio\b/i.test(location.hash);

    if (isRepo && isHomeHashEmpty && !alreadyAtServicio) {
      var qs = location.search || "";
      location.replace(TARGET + qs);
    }
  } catch (e) {
    /* no-op */
  }
})();