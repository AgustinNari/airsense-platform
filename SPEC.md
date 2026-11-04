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
- SIMULADO: sensores hipotéticos agregados por el usuario dentro de CABA, sin mediciones reales. Su muestra sintética opcional se construye solo desde el ID, sin fecha ni ventana de medición real; no altera estaciones oficiales, series ni indicadores observados.
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

## Rediseño visual integral · noviembre 2026
Una fase sobre la base 320b744: sustituir la barra lateral y la ilustración decorativa por una cabecera compacta integrada, navegación horizontal y un lenguaje visual editorial de producto científico. Aplicar la misma jerarquía tipográfica, espaciado, formularios y componentes en las seis secciones. Paleta mineral clara, tinta azul petróleo, acento teal y púrpura reservado a simulaciones; sin recursos remotos ni nuevas dependencias.

El rediseño conserva íntegros datos, procedencia, validaciones, fórmulas, escalas/discontinuidades del gráfico, geometría, controles y estado al navegar. Solo cambia presentación, navegación visual y textos de interfaz que mantengan el significado científico. No modificar public/data, model, scripts, dependencias ni atributos Git.

Aceptación visual: escritorio, tablet y móvil sin desbordamiento horizontal; tipografía legible, controles táctiles de 44 px, foco visible y movimiento reducido. Cabecera proporcionada sin sidebar permanente; mapa integrado con inspector, gráfico y tabla utilizables, formularios y comparación de escenarios coherentes, metodología legible. Validar físicamente las seis vistas en escritorio y móvil, además de los checks existentes y revisión del diff científico.

## Ampliación funcional modular

Esta iteración amplía el alcance del rediseño anterior: permite módulos, pruebas y documentación nuevos, conservando datos oficiales, modelo original, valores predeterminados, dependencias, navegación y diseño general.

- Territorio: límites, barrios, puntos y disponibilidad local. Selección por polígono o selector; presencia no equivale a cobertura. Sin puntos = oportunidad de investigación, sin puntaje sanitario ni inferencias desde distancia.
- Recomendaciones: criterio de información desde el catálogo y contextos hipotéticos elegidos para movilidad, interiores y arbolado. Motivo y limitaciones visibles a pedido; reutilizar el catálogo.
- Arbolado: misma fórmula para años 0–horizonte, con gráfico y tabla. Sin proyección ficticia de costos recurrentes o concentración.
- HEPA: recinto hipotético, volumen, CADR, eACH, consumo diario y costos separados. Validar límites y pasos; nunca dividir por volumen cero ni estimar reducción ambiental porcentual.
- Sensores: ficha opcional con ID, coordenadas propuestas y valores sintéticos deterministas. No son lecturas físicas ni promedios oficiales; no se exportan al dataset.
- Comparación: tres copias temporales de configuraciones principales, con parámetros, unidades y horizontes explícitos. Eliminar/vaciar sin cambiar el escenario actual; recargar reinicia. HEPA permanece independiente.
- Paneles secundarios con límites de error propios; su fallo no debe impedir consultas oficiales ni el simulador principal. Estado solo en memoria.
- Aceptación: conservar el recorrido original; comprobar las ampliaciones, casos límite, desktop y móvil, typecheck/lint/check/build y ausencia de modificaciones en public/data o model.ts.

## Proyección interactiva

Evolucionar FutureProjection, sin duplicarlo. Secciones básica/proyección/HEPA, sin nuevas rutas. Parámetros básicos y copias compartidos; datos oficiales y dependencias intactos. Cuatro etapas: situación inicial común, intervenciones, ejecución y resultados. Ejemplo precargado editable; árboles iniciales y niveles NO₂/PM10 relativos 0–300, sin unidades físicas ni observaciones oficiales.

Año 0 previo a intervenciones; aplicación común en año s (1–30); a=t−s. Tránsito posterior = inicial×(1−r/100); nuevos árboles = plantados×(supervivencia/100)^a. Árboles iniciales constantes como referencia. Costos = compras al llegar a s + electricidad HEPA×365×a. Sin mantenimiento, inflación ni reposición. La curva básica conserva su año 0 de plantación.

NO₂/PM10 = B×max(0,1−α×r/100−β×G), G=min(N(a)/100,1)×min(a/10,1). Coeficientes arbitrarios: NO₂ (0,30;0,05), PM10 (0,15;0,10). Antes de s no hay ajustes; cero vehículos anula el término de tránsito. 100 es referencia sintética, no concentración ni ICA/AQI. HEPA/sensores nunca afectan esas curvas. Retirar protagonismo del índice genérico anterior.

Inicio/pausa/reanudación/reinicio/velocidad, pasos manuales y resultado final. Un intervalo con limpieza; deshabilitar inicios simultáneos. Parámetros nuevos invalidan la ejecución y vuelven a año 0. Salir pausa; movimiento reducido usa modo manual. Gráficos, tarjetas, tabla y vista SVG simbólica sincronizados. Dos alternativas en mismo calendario/horizonte; copias básicas inmutables, condiciones ambientales y HEPA comunes explícitos. Límite de errores conserva el resto del sitio.

Validar cálculos, extremos, reproducción, comparación, HEPA, móvil y recorrido académico. No commits ni push automáticos.
