# Estado

SPA completa implementada conforme a SPEC.md. Base inicial vacía local `1492a98`; main apunta a esa base y feat/airsense-prototype contiene los archivos de aplicación preparados en el índice, aún sin commit de aplicación ni push. PLAN.md conserva pendientes de entrega.

Parent gestiona entrega Git: commit de la aplicación en feat/airsense-prototype, push normal de ambas ramas y PR, pendiente. No force push, merge ni reemplazo de contenido existente. Revalidar remoto antes de crear refs. `.gitattributes` fija `public/data/** -text` para conservar bytes/hashes independientemente de autocrlf.

Se reindexaron los datos con esos atributos: los ocho blobs del índice igualan los bytes locales. Checkout nuevo del índice bajo work/airsense-staged-checkout con core.autocrlf=true conserva los ocho archivos y cuatro hashes/tamaños originales; npm run check aprobado allí. No se cambió configuración global Git ni se hizo commit/push.

Dev local activo en http://127.0.0.1:5173 mediante proceso Node oculto PID 20752. Prueba física de escritorio completada por parent; evidencia concreta en README. No probar pantallas móviles por indicación del usuario. Estación, filtros, escenario y sensores conservan estado durante navegación. Recarga reinicia estado.

Instalación, typecheck, lint, check científico y build aprobados; npm audit 0 tras override minimatch 11.0.1 solo tooling. TypeScript 6.0.3 compatible con typescript-eslint. README explica fuentes, límites y evidencia. Endurecimiento final: coordenadas GeoJSON validadas antes de renderizar; tooltip de estación con textContent; toolbar de OSM alineada horizontalmente.

Fuentes originales intactas en public/data, con hashes y manifiesto. Comparación independiente de 6.696 celdas y coordenadas aprobada. Córdoba cae junto al límite entre comunas 1/2; se conserva asignación geométrica 1 y se documenta dependencia de precisión. No leer .env ni credenciales.
