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
          incluido el año 0. No se proyectan concentraciones, crecimiento ni costos recurrentes.
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
          de reducción ambiental. Recargar elimina las copias; restablecer el escenario actual no las elimina.</p>
        <p><strong>Implementación real:</strong> exigiría sensores físicos y colocalización con referencias,
          datos históricos y meteorológicos, inventarios de emisiones, modelos atmosféricos,
          de crecimiento vegetal o de filtración según el caso, métodos estadísticos y numéricos,
          y validación posterior mediante mediciones. Estas herramientas no sustituyen esa evaluación.</p>
        <a className="method-link" href="https://www.epa.gov/air-sensor-toolbox/air-sensor-collocation" target="_blank" rel="noopener noreferrer">EPA · Comparación de sensores con referencias</a>
      </div>
    </details>
  );
}
