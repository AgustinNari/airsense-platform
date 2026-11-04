# Estado

Ampliación funcional implementada en `feat/airsense-visual-redesign`, conservando el rediseño y las correcciones previas. [SPEC.md](SPEC.md) fija alcance e invariantes y [README.md](README.md) documenta métodos, recorrido y validaciones.

Nuevos paneles: contexto territorial y recomendaciones limitadas a información disponible/supuestos; evolución anual; hasta tres escenarios en memoria; HEPA interior independiente; fichas de sensores con muestras sintéticas. Ninguno modifica las concentraciones oficiales. Los errores de renderizado de paneles complementarios se aíslan del recorrido principal.

Typecheck, lint, check de integridad y cálculos, y build aprobados. Se comprobaron funciones nuevas y recorrido principal en navegador, con revisión móvil emulada. Pendientes: teléfono físico, proyector, lector de pantalla y fallos inducidos de los límites de error. No se realizaron commits ni push en esta iteración. No se requieren servicios ni paquetes adicionales.
