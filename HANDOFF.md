# Estado

Proyección temporal interactiva implementada en `feat/airsense-visual-redesign`, conservando el rediseño, las ampliaciones y el recorrido anterior. [SPEC.md](SPEC.md) fija alcance e invariantes y [README.md](README.md) documenta métodos, recorrido y validaciones.

Nuevos paneles: contexto territorial y recomendaciones limitadas a información disponible/supuestos; evolución anual; hasta tres escenarios en memoria; HEPA interior independiente; fichas de sensores con muestras sintéticas. Ninguno modifica las concentraciones oficiales. Los errores de renderizado de paneles complementarios se aíslan del recorrido principal.

`FutureProjection` evoluciona el módulo existente, con situación inicial, intervenciones, ejecución y resultados. El Simulador separa básica/proyección/HEPA. `projection.ts` calcula niveles relativos hipotéticos de NO₂ y PM10 con coeficientes distintos y arbitrarios; retira el índice genérico de la vista. Año 0 previo a medidas; aplicación común en año elegido, supervivencia y costos desde instalación. HEPA y sensores no afectan el aire exterior.

`useProjectionPlayback` administra un intervalo con limpieza, pausa/reanudación, velocidad, reinicio, pasos y resultado final. Cambios de configuración invalidan la ejecución; salir de vista o ruta pausa. Movimiento reducido conserva inspección manual. Se reutilizan parámetros y copias básicas; las condiciones ambientales, calendario y HEPA son comunes y no se guardan en esas copias.

Typecheck, lint, check de integridad y cálculos (incluidos calendario y niveles NO₂/PM10), y build aprobados. Se comprobaron funciones nuevas y recorrido principal en navegador, con revisión móvil emulada. Pendientes: teléfono físico, proyector, lector de pantalla y fallos inducidos de los límites de error y emulación activa de movimiento reducido (lógica revisada en código). No se realizaron commits ni push en esta iteración. No se requieren servicios ni paquetes adicionales.
