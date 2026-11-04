import { useState } from "react";
import type { Row, Station, StationId, Territory } from "./model";
import { number, pollutants } from "./model";
import { monitoringOpportunity } from "./extensions";
import { Badge, MethodLink } from "./ui";

export default function TerritoryPanel({ territory, stations, rows, commune, setCommune, setSelected }: {
  territory: Territory[]; stations: Station[]; rows: Row[]; commune: number;
  setCommune: (commune: number) => void; setSelected: (id: StationId) => void;
}) {
  const [question, setQuestion] = useState("monitoring");
  const zone = territory.find(t => t.commune === commune)!;
  const points = stations.filter(s => zone.stations.includes(s.id));
  const opportunity = monitoringOpportunity(points.length);
  const missing = territory.filter(t => t.stations.length === 0).map(t => t.commune);
  const recommendations: Record<string, { title: string; reason: string; limitation: string }> = {
    monitoring: opportunity,
    traffic: { title: "Evaluar medidas de movilidad", reason: "Elegiste estudiar una reducción hipotética de actividad vehicular; no hay conteos de tránsito incorporados para esta comuna.", limitation: "Primero medir actividad, caracterizar flota y estudiar desvíos. La reducción de vehículos no equivale a una reducción igual de concentración." },
    indoor: { title: "Evaluar filtración y control de fuentes en interiores", reason: "Elegiste un ambiente interior hipotético. No se identificó una escuela u hospital real ni se midió su aire interior.", limitation: "Caracterizar recinto, fuentes y ventilación. HEPA trata partículas, no todos los gases; no actúa sobre emisiones de la comuna." },
    trees: { title: "Estudiar condiciones para una plantación", reason: "Elegiste explorar una intervención de arbolado supuesta. No hay inventario ni disponibilidad de suelo incorporados.", limitation: "Verificar espacio, especies, agua, mantenimiento y ventilación urbana. La supervivencia calculada no demuestra remoción de partículas." },
  };
  const recommendation = recommendations[question];
  return (
    <details className="panel extension-panel">
      <summary>Contexto territorial y oportunidades de medición</summary>
      <div className="extension-body">
        <div className="extension-actions">
          <label>Comuna para analizar
            <select value={commune} onChange={e => setCommune(Number(e.target.value))}>
              {[...territory].sort((a,b) => a.commune - b.commune).map(t => <option key={t.commune} value={t.commune}>Comuna {t.commune}</option>)}
            </select>
          </label>
          <Badge kind="calculated">CONTEXTO DEL CATÁLOGO LOCAL</Badge>
        </div>
        <h2>Comuna {commune}</h2>
        <p>{zone.neighborhoods}. También podés seleccionar una comuna haciendo clic en su polígono, fuera del modo de colocación.</p>
        <div className="extension-columns">
          <section><h3>Información disponible</h3>
            <p>Límites y barrios de Buenos Aires Data; {points.length} {points.length === 1 ? "punto" : "puntos"} del catálogo dentro del polígono.</p>
            {points.length ? points.map(station => <div key={station.id}>
              <button className="button secondary" onClick={() => setSelected(station.id)}>Seleccionar {station.name}</button>
              <p>Disponibilidad de enero de 2026: {Object.entries(pollutants).map(([key, spec]) =>
                `${spec.name}: ${number(rows.filter(r => r[station.id][key as keyof typeof pollutants] !== null).length)}/${rows.length}`
              ).join(" · ")} valores. <a className="method-link" href="#analisis" onClick={() => setSelected(station.id)}>Consultar esta estación</a></p>
            </div>) : <p>No hay series de una estación ubicada dentro de esta comuna en el catálogo.
              Podés consultar Córdoba, Parque Centenario o La Boca como mediciones de esos sitios, sin extrapolarlas a esta zona.</p>}
          </section>
          <section><h3>Información que falta</h3>
            <p>No se incorporaron establecimientos sensibles, conteos de tránsito, meteorología,
              vegetación ni exposición de la población. No es posible diagnosticar la calidad del aire de la comuna.</p>
            <MethodLink />
          </section>
        </div>
        <details><summary>Dónde explorar nuevas mediciones y con qué criterio</summary>
          <p><strong>Sin punto en el catálogo:</strong> comunas {missing.join(", ")}.
            Comparten una oportunidad de investigación, sin orden de peligrosidad.</p>
          <p><strong>Con puntos:</strong> comunas {territory.filter(t => t.stations.length).map(t => t.commune).sort((a,b) => a-b).join(", ")}.
            También pueden necesitar estudios de representatividad.</p>
          <p>Regla: comprobar presencia de coordenadas oficiales dentro del polígono.
            No se utilizan distancias como exposición ni se asignan puntajes ambientales.
            Antes de ubicar equipos hacen falta una pregunta de estudio, sitios verificados,
            períodos comparables y un plan de calibración.</p>
        </details>
        <div className="extension-recommendation">
          <label>Contexto a explorar
            <select value={question} onChange={e => setQuestion(e.target.value)}>
              <option value="monitoring">Monitoreo disponible en esta comuna</option>
              <option value="traffic">Movilidad · supuesto demostrativo</option>
              <option value="indoor">Ambiente interior · supuesto demostrativo</option>
              <option value="trees">Arbolado · supuesto demostrativo</option>
            </select>
          </label>
          <Badge kind={question === "monitoring" ? "calculated" : "assumed"}>{question === "monitoring" ? "CRITERIO DE INFORMACIÓN" : "CONTEXTO HIPOTÉTICO"}</Badge>
          <h3>{recommendation.title}</h3>
          <p><strong>Por qué:</strong> {recommendation.reason}</p>
          <details><summary>Limitaciones y datos necesarios</summary><p>{recommendation.limitation}</p></details>
          <a className="method-link" href="#intervenciones">Consultar medidas, fuentes y límites en el catálogo</a>
        </div>
      </div>
    </details>
  );
}
