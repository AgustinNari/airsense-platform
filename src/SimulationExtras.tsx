import { useState } from "react";
import { money, number, seriesPath } from "./model";
import { scenarioResults, treeTimeline } from "./extensions";
import type { Scenario } from "./extensions";
import { Badge } from "./ui";

export function TreeEvolution({ planted, survival, years }: {
  planted: number; survival: number; years: number;
}) {
  const points = treeTimeline(planted, survival, years);
  const max = Math.max(planted, 1);
  return (
    <details className="panel extension-panel">
      <summary>Evolución del arbolado · año 0 a {years}</summary>
      <div className="extension-body">
        <Badge kind="simulated">EVOLUCIÓN ILUSTRATIVA</Badge>
        <p>Supervivencia anual constante del {number(survival, 1)}%, sin reposición.
          El año 0 representa la plantación, no una medición.</p>
        <svg className="extension-chart" viewBox="0 0 660 240" role="img"
          aria-label={`Árboles esperados: ${planted} al año 0 y ${number(points.at(-1)!.trees, 1)} al año ${years}. Tabla anual a continuación.`}>
          {[0, 0.5, 1].map(f => <g key={f}>
            <line x1="100" x2="640" y1={200 - f * 180} y2={200 - f * 180} stroke="#dce5e8" />
            <text x="90" y={205 - f * 180} textAnchor="end">{number(max * f, 1)}</text>
          </g>)}
          <path d={seriesPath(points.map(p => p.trees), 540, 180, max)} transform="translate(100 20)"
            fill="none" stroke="#735a95" strokeWidth="3" />
          <text x="100" y="230">Año 0</text>
          <text x="640" y="230" textAnchor="end">Año {years}</text>
        </svg>
        <div className="table-scroll">
          <table><caption>Supervivientes esperados, en ejemplares</caption>
            <thead><tr><th scope="col">Año</th><th scope="col">Árboles esperados</th></tr></thead>
            <tbody>{points.map(p => <tr key={p.year}><th scope="row">{p.year}</th><td>{number(p.trees, 2)}</td></tr>)}</tbody>
          </table>
        </div>
        <p>Plantados × (supervivencia / 100)<sup>año</sup>. Los valores pueden ser fraccionarios.
          No se modelan crecimiento, captura de partículas ni beneficios sanitarios.
          El costo existente es inicial; no hay datos para proyectar mantenimiento.</p>
      </div>
    </details>
  );
}

type Saved = { id: number; name: string; inputs: Scenario };
export function ScenarioComparison({ scenario, tab, invalid }: {
  scenario: Scenario; tab: string; invalid: boolean;
}) {
  const [saved, setSaved] = useState<Saved[]>([]);
  const [name, setName] = useState("");
  const [nextId, setNextId] = useState(1);
  const [message, setMessage] = useState("");
  const columns = tab === "traffic"
    ? ["Base (vehículos/día)", "Reducción (%)", "Alternativa (vehículos/día)"]
    : tab === "trees"
      ? ["Plantados", "Supervivencia anual (%)", "Horizonte (años)", "Supervivientes esperados", "Plantación (ARS)"]
      : ["Dispositivos", "Costo unitario (ARS)", "Compra (ARS)"];
  const cells = (s: Scenario) => {
    const result = scenarioResults(s);
    return tab === "traffic" ? [number(s.vehicles), number(s.reduction), number(result.traffic, 1)]
      : tab === "trees" ? [number(s.trees), number(s.survival), number(s.years), number(result.survivors, 2), money(result.treeCost)]
        : [number(s.sensors), money(s.sensorCost), money(result.sensorCost)];
  };
  function save() {
    if (invalid || saved.length >= 3) return;
    scenarioResults(scenario);
    setSaved(current => [...current, { id: nextId, name: name.trim() || `Escenario ${nextId}`, inputs: { ...scenario } }]);
    setNextId(current => current + 1);
    setName("");
    setMessage("Escenario guardado en memoria. Podés cambiar los parámetros y guardar otra alternativa.");
  }
  return (
    <details className="panel extension-panel">
      <summary>Comparar alternativas · {saved.length}/3 guardadas</summary>
      <div className="extension-body">
        <Badge kind="simulated">ESCENARIOS HIPOTÉTICOS</Badge>
        <p>Guardá hasta tres configuraciones completas. La tabla muestra las métricas de la pestaña activa.
          Cada alternativa conserva sus propios parámetros, incluso su línea base y horizonte.</p>
        <div className="extension-actions">
          <label>Nombre del escenario (opcional)
            <input value={name} maxLength={40} onChange={e => setName(e.target.value)} />
          </label>
          <button className="button secondary" disabled={invalid || saved.length >= 3} onClick={save}>Guardar escenario actual</button>
          <button className="text-button" disabled={!saved.length} onClick={() => {
            setSaved([]); setNextId(1); setMessage("Comparación vaciada. Los parámetros actuales se conservan.");
          }}>Vaciar comparación</button>
        </div>
        <div role="status">{message}</div>
        <div className="table-scroll">
          <table className="comparison-table"><caption>Comparación de {tab === "traffic" ? "actividad vehicular" : tab === "trees" ? "arbolado" : "sensores"}; resultados calculados por separado</caption>
            <thead><tr><th scope="col">Configuración</th>{columns.map(c => <th scope="col" key={c}>{c}</th>)}<th scope="col">Acción</th></tr></thead>
            <tbody>
              <tr><th scope="row">Actual · sin guardar</th>{cells(scenario).map((c, i) => <td key={i}>{c}</td>)}<td>—</td></tr>
              {saved.map(s => <tr key={s.id}><th scope="row">{s.name}</th>{cells(s.inputs).map((c, i) => <td key={i}>{c}</td>)}
                <td><button className="text-button" aria-label={`Eliminar ${s.name}`} onClick={() => {
                  setSaved(current => current.filter(item => item.id !== s.id)); setMessage(`${s.name} eliminado de la comparación.`);
                }}>Eliminar</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <p>Recargar borra las alternativas. No se suman beneficios ambientales de magnitudes diferentes.
          Restablecer el escenario actual no elimina las alternativas guardadas.</p>
      </div>
    </details>
  );
}
