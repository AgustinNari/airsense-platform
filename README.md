# AirSense

Prototipo académico de UADE · Seminario 2, Tecnología y Medio Ambiente. SPA pública en español: React 19 + TypeScript 6 + Vite 8, Leaflet 1.9.4 y gráficos SVG. Sin backend, autenticación, base de datos ni IA.

## Ejecutar

Node.js 24 LTS (validado con 24.15.0) y npm 11:

```sh
npm install
npm run dev
```

Abrir la URL local que informa Vite. Para una instalación reproducible desde el lockfile, usar `npm ci`. Los scripts de instalación de dependencias están bloqueados por `.npmrc`; la aplicación no requiere habilitarlos.

```sh
npm run typecheck
npm run lint
npm run check
npm run build
npm run preview
```

## Recorrido implementado

Inicio → Mapa territorial → Córdoba → Consultar mediciones → agregar un sensor simulado → Simulador → 20% de reducción de tránsito → costos y metodología.

- Mapa local con las 15 comunas y las tres estaciones del catálogo seleccionado. Selección por marcadores o botones; alta dentro de CABA y eliminación de sensores hipotéticos. Alternativa accesible por selector de comuna y punto interior validado.
- Análisis por estación, contaminante y fechas de enero de 2026, con gráfico, unidades, faltantes, mínimos/máximos, disponibilidad, tabla completa y descarga CSV. Las discontinuidades permanecen visibles.
- Catálogo de tránsito, arbolado, HEPA interior y monitoreo, con finalidades, limitaciones y fuentes EPA.
- Simulador de base/alternativa para actividad vehicular, supervivencia de árboles y dispositivos adicionales. Supuestos y costos editables; barras de la misma unidad, restablecimiento y subtotal ilustrativo.
- Metodología accesible desde resultados. Estación, filtros, escenario y sensores persisten al navegar; recargar reinicia el estado. Controles nativos, navegación por teclado, foco visible y estilos adaptables.

El recorrido carga archivos locales; no requiere una API en vivo ni internet tras instalar y arrancar el servidor. **No es una PWA ni garantiza uso sin un servidor local.** El fondo opcional OpenStreetMap requiere internet y solicita teselas a ese proveedor, con atribución visible. La geometría local sigue disponible si falla el fondo.

## Datos y límites científicos

Fuentes: [calidad del aire — Buenos Aires Data / APrA](https://data.buenosaires.gob.ar/dataset/calidad-aire) y [comunas — Buenos Aires Data](https://data.buenosaires.gob.ar/dataset/comunas). Recuperados el **03/11/2026**. Licencia [CC-BY-2.5-AR](https://creativecommons.org/licenses/by/2.5/ar/). Los originales completos, metadatos, extractos y trazabilidad están en `public/data/manifest.json`; incluye URLs, bytes, SHA-256 y transformaciones. `.gitattributes` desactiva la conversión de finales de línea para `public/data/**`, preservando sus bytes y hashes también en checkouts con `core.autocrlf=true`. El script `python scripts/prepare_data.py` reproduce los derivados con la biblioteca estándar de Python, sin red y sin reemplazar los originales.

El extracto conserva 744 filas de enero de 2026, 6.696 celdas de concentración y 25 valores nulos. Córdoba, Parque Centenario y La Boca conservan las coordenadas originales. Palermo se excluye porque el catálogo indica su desactivación; no se afirma que el catálogo sea la red vigente completa.

| Variable | Unidad | Ventana original |
| --- | --- | --- |
| CO | ppm | Promedio móvil de 8 horas |
| NO₂ | ppb | Promedio de los 60 minutos anteriores |
| PM10 | µg/m³ | Promedio móvil de 24 horas |

No hay PM2.5. Se conserva HORA 1–24 y la fecha de la fuente: la hora 24 no se reinterpreta como otro día. Los promedios móviles se superponen. Los nulos no se convierten en ceros ni se interpolan. No se clasifican riesgo sanitario ni cumplimiento legal.

Las **3/15 comunas con puntos** miden presencia territorial en este catálogo, no cobertura de calidad del aire, exposición o población beneficiada. La asignación depende de la precisión de coordenadas y límites; los puntos limítrofes pueden cambiar de comuna. No se extrapola concentración por cuadra ni se usan radios de alcance.

Los resultados distinguen OBSERVADO, CALCULADO, SUPUESTO y SIMULADO. Tránsito modela actividad, no concentración. La supervivencia supone tasa constante y ausencia de reposición. Los costos en ARS son ilustrativos: solo plantación y dispositivos; excluyen programa de tránsito, mantenimiento, instalación de sensores y operación. Los sensores hipotéticos no generan lecturas y el presupuesto de dispositivos es independiente del mapa. Validar eficacia requiere intervención física y medición posterior.

## Validación

El rediseño se verificó en navegador de escritorio (1440 × 1000) en las seis vistas. Desde Inicio, el enlace de La Boca abrió el mapa con esa estación seleccionada. La serie de Córdoba mostró 744/744 registros disponibles.

En el viewport móvil emulado (390 × 845) se verificaron Inicio, Mapa, Análisis, Intervenciones y Simulador. Escape cerró el menú y devolvió el foco al botón. Se agregó un sensor hipotético. Parque Centenario PM10 mostró 9/24 valores el 01/01 y la tabla indicó «Sin dato» en los faltantes. El período del 20/01 al 01/01 activó el error de fechas. Cuatro sensores a ARS 300.000 por unidad dieron un subtotal de ARS 6.200.000 con la plantación por defecto.

La configuración de Work deshabilitó el navegador local durante la revisión. Quedaron pendientes la vista de Metodología en móvil y la comprobación visual de los últimos ajustes de CSS. La emulación no cubre un teléfono físico ni una matriz de navegadores.

`typecheck`, `lint`, `check` y `build` pasaron tras el rediseño. El diff contra `320b744` confirma la conservación de datos, modelo, scripts, dependencias y atributos Git.

### Validación del prototipo original

Ejecutados satisfactoriamente: instalación con scripts bloqueados, `typecheck`, `lint`, `check`, `build` y `npm audit` (**0 vulnerabilidades**). El check focalizado protege 744 claves fecha/hora únicas, faltantes, cuatro hashes originales, presencia 3/15, fórmulas y cortes del gráfico. Revisión independiente comparó las 6.696 celdas del extracto con el CSV original sin diferencias.

Reproducibilidad Git: los ocho blobs de datos preparados en el índice coinciden byte a byte con los archivos locales. Se exportó un checkout nuevo desde ese índice con `core.autocrlf=true`: los ocho archivos conservaron sus bytes, los cuatro hashes y tamaños originales coincidieron con el manifiesto y `npm run check` pasó desde ese checkout.

Prueba física de escritorio (viewport final 1265 × 720): navegación por las seis vistas; marcadores La Boca/Córdoba y consulta de la estación seleccionada; cambio de contaminantes y fechas con controles nativos; Parque Centenario PM10 del 01/01 con 9/24 valores y 15 faltantes, NO₂ 24/24 y CO 23/24; tabla con nulos explícitos. Se verificaron alta de sensor por selector y clic, rechazo fuera de CABA, eliminación y persistencia al navegar; presencia oficial 3/15 sin cambios; fondo OSM con calles y atribución, y regreso al mapa local. El mapa final con la validación geográfica y la barra OSM corregidas se recargó sin errores.

En simulador: 35% de reducción produjo 6.500 vehículos/día; 200 árboles actualizaron costo a ARS 10.000.000; cuatro sensores a ARS 300.000 produjeron ARS 1.200.000 y subtotal ARS 11.200.000; regreso desde metodología conservó el escenario y restablecer recuperó valores por defecto y subtotal ARS 5.750.000. Se comprobaron acordeones de metodología y ausencia de errores/advertencias en consola durante el recorrido. No se realizaron pruebas en pantallas móviles por indicación del usuario. No se verificaron lectores de pantalla, todos los navegadores ni despliegue en hosting. La descarga CSV, el rechazo de períodos inválidos y los estados de carga/error/vacío están implementados, sin prueba física específica; no se inyectaron fallos de red/archivos.

Se fija `minimatch` 11.0.1 mediante `overrides` para corregir [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) en dependencias de lint. La ejecución real de ESLint valida el recorrido de archivos con esa versión; no cambia el bundle de la aplicación. TypeScript 6.0.3 respeta el rango soportado por typescript-eslint 8.72.1.

Referencias técnicas: [Vite](https://vite.dev/guide/), [React: sincronización con widgets y limpieza de efectos](https://react.dev/reference/react/useEffect#controlling-a-non-react-widget), [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html), [política de teselas OSM](https://operations.osmfoundation.org/policies/tiles/).
