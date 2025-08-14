
RAPIDFLEX - Menú administrable (archivo separado)

Archivos:
- menu.html -> HTML del menú con IDs y SIN textos. Respeta tus estilos.
- clienteMenu.js -> Lee 'datos_menu.xlsx' (primera hoja) y aplica los textos por ID.
- datos_menu.xlsx -> Excel SEPARADO SOLO para el menú (columna 'id' y 'content').

Uso:
1) Sube estos 3 archivos a la misma carpeta de tu sitio.
2) Abre 'datos_menu.xlsx' y completa la columna 'content'. Puedes usar <br> para saltos de línea.
3) Asegúrate de que en menu.html estén estas etiquetas al final:
   <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
   <script src="clienteMenu.js"></script>
4) Si usas SPA, el script aplicará los textos cuando se dispare 'spa:view-loaded' con key 'menu'.
5) Evita abrir como file://. Usa servidor local o hosting para que 'fetch' del Excel funcione.
