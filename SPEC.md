# AirSense — especificación canónica

## Objetivo y alcance
SPA pública en español para Seminario 2 de Tecnología y Medio Ambiente, UADE. React + TypeScript + Vite, sin backend, cuentas, base de datos ni IA. Demostración reproducible de 3–4 minutos. El repositorio público estaba vacío al inspeccionarlo el 2026-11-03. Se consultó el Google Doc indicado por el usuario; su propuesta coincide con las restricciones del pedido, que acota el prototipo.

## UX y arquitectura
Inicio, Mapa, Análisis, Intervenciones, Simulador y Metodología. Navegación por hash, estados React en memoria. Leaflet 1.9.4 con geometría local de las 15 comunas y estaciones oficiales; OpenStreetMap como fondo opcional en línea, nunca necesario para la demo. Gráfico SVG accesible equivalente liviano a una biblioteca de charts. Snapshots locales en public/data. Sin persistencia de datos personales, telemetría ni servicios adicionales. Fuentes externas son enlaces de consulta; solo el fondo OSM requiere red si se activa.

## Datos e invariantes científicos
- OBSERVADO: CO (ppm, promedio móvil 8 h), NO₂ (ppb, promedio horario), PM10 (µg/m³, promedio móvil 24 h), enero 2026, Buenos Aires Data/APrA. Conservar CSV original íntegro y extracto. No PM2.5 en el snapshot.
- Geometría y ubicaciones de fuentes oficiales verificadas. Palermo se excluye porque el catálogo la señala desactivada. No afirmar que el catálogo representa la red vigente completa.
- Faltantes = null, nunca cero. Mantener hora original 1–24 y fecha fuente; no inventar timestamps. Comparar solo la misma estación, contaminante y período. No interpolar concentración territorial ni convertir distancia en contaminación.
- CALCULADO: comunas con un punto oficial del catálogo seleccionado dentro de su polígono. Esto mide presencia territorial, no cobertura de medición, población beneficiada ni representatividad. No se cuantifica radio de cobertura.
- SIMULADO: sensores hipotéticos agregados por el usuario dentro de CABA, sin lecturas; no alteran estaciones oficiales ni indicador observado.
- SUPUESTO: actividad vehicular, costos ilustrativos en ARS sin cotización comercial, árboles, supervivencia anual, horizonte y sensores propuestos.
- SIMULADO/CALCULADO: vehículos finales = iniciales × (1 − reducción/100); árboles supervivientes = plantados × (supervivencia/100)^años; costo árboles = plantados × costo unitario; costo sensores = cantidad × costo unitario. No mezclar indicadores, no calcular concentración ni beneficio sanitario a partir de estos controles. Aclarar mantenimiento no incluido.
- No umbrales OMS/legales sin compatibilidad temporal y unidades; el prototipo no clasifica salud ni cumplimiento normativo.

## Aceptación
1. Abrir Inicio → Mapa → seleccionar Córdoba → consultar mediciones reales con selector de contaminante y fechas, gráfico, unidades, faltantes y fuente accesible.
2. Ver las comunas con y sin presencia de estaciones del catálogo y advertencia sobre representatividad; agregar y quitar un sensor simulado, también mediante controles accesibles sin mouse.
3. Simulador por defecto 20% de reducción, actividad base visible; comparar barras base/alternativa, cantidad de árboles supervivientes, costos y sensores. Controles validan valores finitos y rangos.
4. Catálogo: tránsito, arbolado, HEPA interior y monitoreo, con finalidad, beneficios y limitaciones.
5. Metodología desde resultados, fórmulas, incertidumbre, tres dimensiones (ambiental histórica, social presencia territorial, económica costo supuesto), línea base y objetivo. Sin afirmar eficacia sin intervención física y medición posterior.
6. Responsive, foco visible, controles etiquetados, textos legibles, estados carga/error/vacío, recorrido sin APIs en vivo.
7. npm install, npm run dev, typecheck, lint y build. Verificación física desktop/mobile y al menos un check focalizado de integridad científica si se justifica. README informa pruebas efectivas y pendientes.

## Referencias técnicas
https://vite.dev/guide/ · https://react.dev/reference/react/useEffect · https://leafletjs.com/reference-1.9.4.html
