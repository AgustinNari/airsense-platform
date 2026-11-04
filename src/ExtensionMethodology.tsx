export default function ExtensionMethodology() {
  return (
    <details className="panel">
      <summary>06 · Herramientas complementarias y futura implementación</summary>
      <div>
        <p><strong>Territorio y recomendaciones:</strong> se utilizan únicamente límites,
          barrios y presencia de estaciones del catálogo local. Las comunas sin puntos se agrupan
          como oportunidades de estudio, sin ranking sanitario. Movilidad, interiores y arbolado
          son contextos elegidos como supuestos, no condiciones verificadas en una comuna.</p>
        <p><strong>Evolución anual:</strong> se evalúa la fórmula de supervivencia para cada año,
          incluido el año 0. Esa curva de arbolado no proyecta concentraciones, crecimiento ni costos recurrentes.
          La comparación de tránsito representa base y alternativa, sin asumir una trayectoria progresiva.</p>
        <p><strong>HEPA interior:</strong> volumen = superficie × altura; CADR total = cantidad × CADR;
          eACH = CADR total / volumen. Energía diaria = cantidad × W / 1.000 × horas;
          electricidad = kWh × tarifa; compra = cantidad × costo unitario. CADR y eACH expresan
          capacidad al funcionar, incluso si se eligen 0 horas diarias. Se asumen equipos idénticos
          y operación constante. No se predice una reducción porcentual de partículas ni se trata aire exterior.</p>
        <p><strong>Sensores hipotéticos:</strong> una muestra fija determinada por ID ilustra el formato
          de una futura recepción IoT. No tiene fecha ni período de medición real, no representa el sitio
          y no se mezcla con los datos observados. Las fichas explican sus constantes y fórmulas.</p>
        <p><strong>Comparación:</strong> hasta tres copias de los parámetros válidos actuales en memoria.
          Cada columna conserva su magnitud, unidad, línea base y horizonte. No hay un índice agregado
          de reducción ambiental en esta tabla. Recargar elimina las copias; restablecer el escenario actual no las elimina.</p>
        <p><strong>Proyección interactiva:</strong> año 0 = situación inicial hipotética. Las medidas se aplican en un año s elegido;
          edad a = t − s. Tránsito posterior = inicial × (1 − r/100); nuevos supervivientes N(a) = plantados × (supervivencia/100)^a.
          Los árboles iniciales se mantienen constantes como referencia. La curva básica de arbolado conserva su propio año 0 de plantación.</p>
        <p>NO₂ y PM10 se muestran como niveles relativos sintéticos, sin unidades físicas: 100 es la referencia del ejemplo.
          Nivel = B × max(0, 1 − α × r/100 − β × G), con G = min(N(a)/100,1) × min(a/10,1).
          NO₂ usa α=0,30 y β=0,05; PM10 usa α=0,15 y β=0,10. Antes de s no hay ajustes; con cero vehículos iniciales no hay término de tránsito.
          Son coeficientes arbitrarios, no relaciones verificadas para Buenos Aires, concentraciones, ICA/AQI ni riesgos sanitarios.</p>
        <p>Dos alternativas comparten situación ambiental, calendario y horizonte; las copias guardadas conservan sus parámetros básicos.
          HEPA actual y sensores no afectan las curvas exteriores. Costos = compras/plantación al llegar a s + electricidad diaria HEPA × 365 × a,
          sin inflación, mantenimiento ni reposición. Al instalar hay cero días de operación acumulados.
          Inicio, pausa, reanudación, velocidad y avance manual solo reproducen cálculos deterministas.
          Cambiar parámetros reinicia la ejecución; salir de la sección la pausa. Con movimiento reducido se usa avance manual.</p>
        <p><strong>Implementación real:</strong> exigiría sensores físicos y colocalización con referencias,
          datos históricos y meteorológicos, inventarios de emisiones, modelos atmosféricos,
          de crecimiento vegetal o de filtración según el caso, métodos estadísticos y numéricos,
          y validación posterior mediante mediciones. Estas herramientas no sustituyen esa evaluación.</p>
        <a className="method-link" href="https://www.epa.gov/air-sensor-toolbox/air-sensor-collocation" target="_blank" rel="noopener noreferrer">EPA · Comparación de sensores con referencias</a>
      </div>
    </details>
  );
}
