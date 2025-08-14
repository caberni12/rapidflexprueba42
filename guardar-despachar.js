// guardar-despachar.js — envío ÚNICO + loader, SPA-safe, sin redirecciones
(() => {
  const ENDPOINT   = 'https://script.google.com/macros/s/AKfycbzhPW0E0oZsEZcRZ3y1gKTjcu47ROOTS12PkiGdMka2IilKsvNGMdzO4kGbdEy7tL-GNw/exec';
  const FORM_ID    = 'empresaForm';
  const LOADER_ID  = 'loaderEmpresa';
  const USE_ALERT  = true;
  const OK_MESSAGE = '✅ ¡Gracias! Tu solicitud fue enviada.';

  function showNotice(form, msg, ok = true) {
    let box = form.querySelector('.form-aviso');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-aviso';
      Object.assign(box.style, {
        marginTop:'10px', padding:'10px', borderRadius:'8px',
        textAlign:'center',
        background: ok ? '#e6ffef' : '#ffe6e6',
        border:     ok ? '1px solid #9ae6b4' : '1px solid #feb2b2',
        color:      ok ? '#065f46' : '#7a1f1f'
      });
      form.appendChild(box);
    }
    box.textContent = msg;
    if (USE_ALERT) alert(msg);
  }

  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!(form && form.id === FORM_ID)) return;

    // Bloquea la navegación y a otros handlers del SPA
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    // Evita doble clic / envíos repetidos
    if (form.dataset.submitting === '1') return;
    form.dataset.submitting = '1';

    // Blindaje por si el HTML tuviera action/target
    form.setAttribute('action', '#');
    form.setAttribute('method', 'POST');
    form.setAttribute('target', 'hidden_iframe');

    const loader    = document.getElementById(LOADER_ID);
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (loader) loader.style.display = 'block';

    try {
      const fd = new FormData(form);
      fd.append('_ts', new Date().toISOString());

      // ÚNICO envío: fetch con FormData (como tu snippet “que funciona”)
      const resp = await fetch(ENDPOINT, { method: 'POST', body: fd });

      if (resp.ok || resp.type === 'opaque') {
        showNotice(form, OK_MESSAGE, true);
        form.reset();
        const first = form.querySelector('input, textarea');
        if (first) first.focus();
      } else {
        let txt = '';
        try { txt = await resp.text(); } catch(_) {}
        showNotice(form, '⚠️ Error al enviar.' + (txt ? ('\n' + txt) : ''), false);
      }
    } catch (err) {
      showNotice(form, '❌ No se pudo enviar: ' + (err && err.message ? err.message : ''), false);
    } finally {
      if (loader) loader.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
      form.dataset.submitting = '0';
    }
  }, true); // capturing = true (gana al router)

  // Si tu SPA re-renderiza, no hay que re-enlazar porque usamos delegado a nivel documento
  // (este listener sigue activo entre vistas).
})();
