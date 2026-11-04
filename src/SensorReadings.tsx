import type { Sensor } from "./model";
import { number } from "./model";
import { syntheticReading } from "./extensions";
import { Badge, MethodLink } from "./ui";

export default function SensorReadings({ sensor }: { sensor: Sensor }) {
  const values = syntheticReading(sensor.id);
  return (
    <details className="sensor-reading">
      <summary>Consultar muestra hipotética · sensor {sensor.id}</summary>
      <div className="extension-body">
        <Badge kind="simulated">SENSOR SIMULADO — DATOS HIPOTÉTICOS</Badge>
        <p>Identificador S-{sensor.id} · Comuna {sensor.commune} ·
          coordenadas propuestas {number(sensor.lat, 5)}, {number(sensor.lng, 5)}.</p>
        <dl className="extension-metrics">
          <div><dt>PM10 sintético</dt><dd>{values.pm10} µg/m³</dd></div>
          <div><dt>Temperatura sintética</dt><dd>{values.temperature} °C</dd></div>
          <div><dt>Humedad relativa sintética</dt><dd>{values.humidity}%</dd></div>
        </dl>
        <p>Muestra fija reproducible, sin fecha ni ventana de medición real. No hay dispositivo físico ni transmisión IoT.
          Los valores se construyen solo desde el identificador; no describen esta ubicación ni provienen de estaciones oficiales.</p>
        <details><summary>Cómo se construye esta muestra</summary>
          <p>PM10 = 15 + 3 × (ID módulo 7); temperatura = 20 + (ID módulo 5);
            humedad = 45 + 4 × (ID módulo 6). Son constantes de demostración, no un modelo atmosférico.</p>
          <p>No se incorporan a series, promedios, disponibilidad oficial ni alertas.
            Una red real necesitaría equipos calibrados, fecha y ventana de medición,
            transmisión, conservación de datos crudos y comparación periódica con referencias.</p>
        </details>
        <MethodLink />
      </div>
    </details>
  );
}
