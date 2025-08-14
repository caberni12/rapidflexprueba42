(async () => {
  try {
    // Asegurar SheetJS (XLSX)
    if (typeof window.XLSX === 'undefined') {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('No se pudo cargar SheetJS (XLSX)'));
        document.head.appendChild(s);
      });
    }

    // Cargar Excel
    const resp = await fetch('datos_servicio.xlsx');
    if (!resp.ok) throw new Error(`No se pudo cargar el archivo Excel: ${resp.status} ${resp.statusText}`);
    const buf = await resp.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rows.length) throw new Error('La hoja de cálculo está vacía.');

    const head = rows[0].map(h => String(h).toLowerCase());
    const idIdx = head.indexOf('id');
    const ctIdx = head.indexOf('content');
    if (idIdx === -1 || ctIdx === -1) throw new Error('El Excel debe tener encabezados "id" y "content".');

    const values = {};
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]; if (!r) continue;
      const id = r[idIdx]; if (!id) continue;
      const raw = r[ctIdx] == null ? '' : String(r[ctIdx]);
      const html = raw
        .replace(/&lt;br\s*\/?\>/gi, '<br>')
        .replace(/<br\s*\/?\>/gi, '<br>')
        .replace(/\r?\n/g, '<br>');
      values[String(id).trim()] = html;
    }

    function applyValues(root = document) {
      for (const [id, html] of Object.entries(values)) {
        const el = document.getElementById(id) || (root && root.querySelector?.(`#${CSS?.escape ? CSS.escape(id) : id}`));
        if (el) el.innerHTML = html;
      }
    }

    // Intento inmediato (por si ya está la vista)
    applyValues(document.getElementById('app') || document);

    // Al cargar la vista 'servicio' en la SPA
    document.addEventListener('spa:view-loaded', (e) => {
      if (e?.detail?.key === 'servicio') applyValues(e.detail.root || document);
    });
  } catch (err) {
    console.error('Error al procesar el Excel de servicios:', err);
  }
})();
