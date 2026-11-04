import { useState } from "react";
import type { ReactNode } from "react";
import { useProjectionPlayback } from "./useProjectionPlayback";
import type { Scenario, HepaInputs } from "./extensions";
import type { Saved } from "./SimulationExtras";
import { money, number, seriesPath } from "./model";
import { projectionDefaults, projectionTimeline } from "./projection";
import type { ProjectionSetup } from "./projection";
import type { ProjectionPoint } from "./projection";
import { Badge, MethodLink } from "./ui";

function ScenarioView({ point }: { point: ProjectionPoint }) {
  const cars = Math.min(12, Math.ceil(point.vehicles / 1000));
  const trees = Math.min(12, Math.ceil(point.totalTrees / 10));
  const sensors = Math.min(5, point.sensors);
  return (
    <figure className="projection-visual">
      <svg viewBox="0 0 720 240" role="img"
        aria-label={`Zona conceptual, año ${point.year}: ${number(point.vehicles, 1)} vehículos por día, ${number(point.totalTrees, 2)} árboles totales esperados y ${point.sensors} dispositivos propuestos. No es un mapa geográfico.`}>
        <rect x="0" y="0" width="720" height="240" rx="12" fill="#eef3f5" />
        <rect x="20" y="100" width="680" height="60" rx="8" fill="#c9d9df" />
        <path d="M20 130H700" stroke="white" strokeWidth="3" strokeDasharray="15 15" />
        {Array.from({ length: cars }, (_, i) => <g key={`car-${i}`} transform={`translate(${36 + i * 54} 112)`}>
          <rect width="30" height="15" rx="4" fill="#0d5360" /><circle cx="6" cy="17" r="3" fill="#183c49" /><circle cx="24" cy="17" r="3" fill="#183c49" />
        </g>)}
        {Array.from({ length: trees }, (_, i) => <g key={`tree-${i}`} transform={`translate(${42 + i * 55} 58)`}>
          <path d="M0 0V28" stroke="#78949e" strokeWidth="5" /><circle cy="-3" r="16" fill="#8bbab0" />
        </g>)}
        {Array.from({ length: sensors }, (_, i) => <g key={`sensor-${i}`} transform={`translate(${38 + i * 38} 195)`}>
          <circle r="9" fill="#735a95" /><path d="M-4 0H4M0-4V4" stroke="white" strokeWidth="2" />
        </g>)}
        <rect x="465" y="175" width="225" height="45" rx="8" fill="white" stroke="#dce5e8" />
        <text x="577" y="203" textAnchor="middle" fill="#735a95" fontSize="18">Interior: {number(point.each, 2)} eACH</text>
      </svg>
      <figcaption>Zona demostrativa sin localización real. Iconos simbólicos y limitados, sin escala de cantidades.
        No representan calles, dispositivos instalados ni concentraciones espaciales.</figcaption>
    </figure>
  );
}

type Choice = "current" | "base" | Saved;
function PollutionChart({ points, comparison, year, title, other }: {
  points: ProjectionPoint[]; comparison: ProjectionPoint[]; year: number; title: string; other: string;
}) {
  const horizon = points.length - 1;
  const max = Math.max(points[0].no2, points[0].pm10, 1) * 1.1;
  const width = 540 * year / horizon;
  const path = (rows: ProjectionPoint[], key: "no2" | "pm10") => seriesPath(rows.slice(0, year + 1).map(p => p[key]), width, 180, max);
  return <>
    <div className="projection-legend"><span>NO₂ · verde azulado</span><span>PM10 · púrpura</span>
      <span>Línea continua: {title}</span><span>Discontinua: {other}</span></div>
    <svg className="extension-chart" viewBox="0 0 660 250" role="img"
      aria-label={`Evolución hipotética al año ${year}: NO₂ ${number(points[year].no2, 2)} y PM10 ${number(points[year].pm10, 2)} puntos relativos. Comparación ${other}. Sin unidades de concentración.`}>
      {[0, .5, 1].map(f => <g key={f}><line x1="100" x2="640" y1={200-f*180} y2={200-f*180} stroke="#dce5e8" />
        <text x="90" y={205-f*180} textAnchor="end">{number(max*f, 1)}</text></g>)}
      {(["no2", "pm10"] as const).map(key => <g key={key}>
        <path d={path(comparison, key)} transform="translate(100 20)" fill="none" stroke={key === "no2" ? "#087d7e" : "#735a95"} strokeWidth="2" strokeDasharray="7 5" />
        <path d={path(points, key)} transform="translate(100 20)" fill="none" stroke={key === "no2" ? "#087d7e" : "#735a95"} strokeWidth="3" />
        <circle cx={100+width} cy={200-points[year][key]/max*180} r={key === "no2" ? 6 : 3} fill={key === "no2" ? "#087d7e" : "#735a95"} />
      </g>)}
      <text x="100" y="240">Año 0</text><text x="640" y="240" textAnchor="end">Año {horizon}</text>
    </svg>
  </>;
}

export default function FutureProjection({ scenario, saved, hepa, mappedSensors, onHorizonChange, renderField, onExample, onOpenHepa, active }: {
  scenario: Scenario; saved: Saved[]; hepa: HepaInputs; mappedSensors: number; active: boolean;
  onHorizonChange: (years: number) => void; onExample: () => void; onOpenHepa: () => void;
  renderField: (key: keyof Scenario, label: string, max: number, unit: string, min?: number) => ReactNode;
}) {
  const [choice, setChoice] = useState<Choice>("current");
  const [compare, setCompare] = useState<Choice>("base");
  const [setup, setSetup] = useState<ProjectionSetup>(projectionDefaults);
  const [drafts, setDrafts] = useState<Partial<Record<keyof ProjectionSetup, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectionSetup, string>>>({});
  const [zone, setZone] = useState("Zona demostrativa");
  const [includeHepa, setIncludeHepa] = useState(false);
  const resolve = (value: Choice): Choice => typeof value === "string" || saved.includes(value) ? value : "current";
  const primary = resolve(choice), secondary = resolve(compare);
  const selected = typeof primary === "string" ? scenario : primary.inputs;
  const compared = typeof secondary === "string" ? (secondary === "base" ? selected : scenario) : secondary.inputs;
  const name = (value: Choice) => value === "base" ? "Sin intervención" : value === "current" ? "Configuración actual" : value.name;
  const value = (item: Choice) => typeof item === "string" ? item : `saved-${item.id}`;
  const fromValue = (text: string): Choice => text === "base" || text === "current" ? text : saved.find(s => `saved-${s.id}` === text) ?? "current";
  const horizon = scenario.years;
  const points = projectionTimeline(selected, horizon, includeHepa ? hepa : null, primary === "base", setup);
  const comparison = projectionTimeline(compared, horizon, includeHepa ? hepa : null, secondary === "base", setup);
  const signature = JSON.stringify([value(primary), value(secondary), selected, compared, setup, horizon, includeHepa ? hepa : null, zone]);
  const play = useProjectionPlayback(signature, horizon, active);
  const point = points[play.year], other = comparison[play.year];
  const stateLabel = { idle: "Lista para iniciar", running: "En reproducción", paused: "En pausa", complete: "Finalizada" }[play.status];
  function setupField(key: keyof ProjectionSetup, label: string, max: number) {
    return <label>{label}<input type="number" min="0" max={max} step="1" value={drafts[key] ?? setup[key]}
      aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `projection-${key}` : undefined}
      onChange={e => {
        const raw = e.target.value, next = Number(raw);
        setDrafts(current => ({ ...current, [key]: raw }));
        if (!raw || !Number.isInteger(next) || next < 0 || next > max) {
          setErrors(current => ({ ...current, [key]: `Ingresá un entero entre 0 y ${number(max)}. Se mantiene el último valor válido.` })); return;
        }
        setSetup(current => ({ ...current, [key]: next })); setErrors(current => ({ ...current, [key]: "" }));
      }} onBlur={() => { setDrafts(current => ({ ...current, [key]: undefined })); setErrors(current => ({ ...current, [key]: "" })); }} />
      {errors[key] && <small className="field-error" id={`projection-${key}`} role="alert">{errors[key]}</small>}
    </label>;
  }
  return <section className="panel extension-panel projection-panel" aria-label="Proyección interactiva">
    <div className="extension-body">
      <Badge kind="simulated">ESCENARIO HIPOTÉTICO · NO₂ Y PM10 SINTÉTICOS</Badge>
      <h2>Simulá la evolución de una zona</h2>
      <p className="projection-disclaimer">Escenario hipotético. Evolución ilustrativa basada en supuestos simplificados; no representa una predicción validada de la calidad del aire.</p>
      <div className="extension-actions"><button className="button secondary" onClick={() => {
        onExample(); setSetup(projectionDefaults); setDrafts({}); setErrors({}); setZone("Zona demostrativa");
        setChoice("current"); setCompare("base"); setIncludeHepa(false); play.reset();
      }}>Cargar ejemplo</button><MethodLink /></div>
      <div onChangeCapture={play.reset}>
      <details className="projection-step" open><summary>A · Situación inicial común</summary>
        <div className="extension-form">
          <label>Nombre de la zona hipotética<input type="text" maxLength={40} value={zone} onChange={e => setZone(e.target.value)} /></label>
          {primary === "current" ? renderField("vehicles", "Actividad vehicular inicial", 100000, "vehículos/día") : <label>Actividad inicial de la copia<input type="number" value={selected.vehicles} readOnly /></label>}
          {setupField("initialTrees", "Árboles iniciales supuestos", 10000)}
          {setupField("no2Initial", "Nivel inicial hipotético de NO₂ (puntos)", 300)}
          {setupField("pm10Initial", "Nivel inicial hipotético de PM10 (puntos)", 300)}
        </div>
        <p>Sin localización real ni mediciones oficiales. 100 puntos es la referencia sintética del ejemplo para cada contaminante;
          sus niveles iniciales son editables y no tienen unidades físicas. Los árboles iniciales se mantienen constantes como referencia.</p>
      </details>
      <details className="projection-step"><summary>B · Intervenciones del escenario actual</summary>
        <fieldset disabled={primary !== "current"}><legend>Parámetros compartidos con la simulación básica</legend>
          <div className="extension-form">
            {renderField("reduction", "Reducción de tránsito propuesta", 100, "%")}
            {renderField("trees", "Árboles nuevos", 10000, "ejemplares")}
            {renderField("survival", "Supervivencia anual supuesta", 100, "%")}
            {renderField("sensors", "Sensores adicionales propuestos", 100, "dispositivos")}
          </div>
          <details><summary>Costos iniciales supuestos</summary><div className="extension-form">
            {renderField("treeCost", "Costo por árbol plantado", 10000000, "ARS")}
            {renderField("sensorCost", "Costo unitario de sensor", 100000000, "ARS")}
          </div></details>
        </fieldset>
        {primary !== "current" && <p>La base y las copias son de consulta. Elegí Configuración actual para editar las intervenciones.</p>}
        <label className="projection-hepa-toggle"><input type="checkbox" checked={includeHepa} onChange={e => setIncludeHepa(e.target.checked)} /> Incluir HEPA interior</label>
        <p>HEPA actual: {hepa.quantity} equipos × {hepa.cadr} m³/h, {hepa.hours} h/día. Se usa por separado, sin modificar NO₂ ni PM10 exteriores.</p>
        <button className="button secondary" onClick={onOpenHepa}>Configurar filtración HEPA</button>
        <p>Podés guardar hasta tres alternativas con el comparador existente al final de esta sección. Las copias guardan parámetros básicos;
          situación inicial, calendario y HEPA opcional son condiciones comunes de esta comparación, no forman parte de esas copias.</p>
      </details>
      </div>
      <section className="projection-step"><h3>C · Horizonte y ejecución</h3>
        <div className="extension-form">
          <label>Escenario principal<select value={value(primary)} onChange={e => setChoice(fromValue(e.target.value))}>
            <option value="current">Configuración actual</option><option value="base">Sin intervención</option>
            {saved.map(s => <option value={`saved-${s.id}`} key={s.id}>{s.name}</option>)}</select></label>
          <label>Comparar con<select value={value(secondary)} onChange={e => setCompare(fromValue(e.target.value))}>
            <option value="base">Sin intervención</option><option value="current">Configuración actual</option>
            {saved.map(s => <option value={`saved-${s.id}`} key={s.id}>{s.name}</option>)}</select></label>
          <label>Horizonte común (años)<select value={horizon} onChange={e => onHorizonChange(Number(e.target.value))}>
            {Array.from({ length: 30 }, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label>
          <label>Año de aplicación de las medidas<select value={setup.startYear} onChange={e => setSetup(current => ({ ...current, startYear: Number(e.target.value) }))}>
            {Array.from({ length: 30 }, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label>
        </div>
        {setup.startYear > horizon && <p>Las medidas quedan fuera de este horizonte: la situación inicial se mantiene.</p>}
        <div className="extension-actions projection-playback">
          <button className="button" disabled={play.status === "running" || Object.values(errors).some(Boolean)} onClick={play.start}>Iniciar simulación</button>
          <button className="button secondary" disabled={play.status !== "running"} onClick={play.pause}>Pausar</button>
          <button className="button secondary" disabled={play.status !== "paused" || play.year >= horizon || play.reduced} onClick={play.resume}>Reanudar</button>
          <button className="button secondary" onClick={play.reset}>Reiniciar</button>
          <button className="button secondary" onClick={() => play.seek(horizon)}>Ver resultado final</button>
          <label>Velocidad<select value={play.speed} disabled={play.reduced} onChange={e => play.setSpeed(Number(e.target.value))}>
            <option value="400">Rápida · 400 ms/año</option><option value="600">Normal · 600 ms/año</option><option value="800">Pausada · 800 ms/año</option><option value="1500">Lenta · 1.500 ms/año</option>
          </select></label>
        </div>
        <p role="status">{stateLabel}{play.changed ? " · Configuración modificada: iniciá una nueva ejecución." : ""}</p>
        {play.reduced && <p>Movimiento reducido activo: no hay reproducción automática. Usá el año, los pasos manuales o el resultado final.</p>}
        <p>Cambiar parámetros detiene la ejecución y vuelve al año 0. Salir de esta sección la pausa. La velocidad no cambia los resultados.</p>
        <label className="range-field">Año de la vista: <strong>{play.year}</strong><input type="range" min="0" max={horizon} step="1" value={play.year} onChange={e => play.seek(Number(e.target.value))} />
          <span><small>0 · situación inicial</small><small>{horizon} años</small></span></label>
        <div className="extension-actions"><button className="button secondary small" disabled={play.year === 0} onClick={() => play.seek(play.year-1)}>Año anterior</button>
          <button className="button secondary small" disabled={play.year === horizon} onClick={() => play.seek(play.year+1)}>Año siguiente</button></div>
      </section>
      <section className="projection-step"><h3>D · {zone || "Zona hipotética"} · año {play.year}</h3>
        <PollutionChart points={points} comparison={comparison} year={play.year} title={name(primary)} other={name(secondary)} />
        <div className="extension-metrics" aria-label="Contaminación exterior hipotética">
          <div><span>NO₂ · nivel relativo</span><strong>{number(point.no2, 2)} puntos</strong><small>Inicial: {setup.no2Initial}. Cambio: {number(point.no2-setup.no2Initial, 2)} puntos. {name(secondary)}: {number(other.no2, 2)}.</small></div>
          <div><span>PM10 · nivel relativo</span><strong>{number(point.pm10, 2)} puntos</strong><small>Inicial: {setup.pm10Initial}. Cambio: {number(point.pm10-setup.pm10Initial, 2)} puntos. {name(secondary)}: {number(other.pm10, 2)}.</small></div>
        </div>
        <ScenarioView point={point} />
        <div className="extension-metrics" aria-label="Estado proyectado de la zona conceptual">
          <div><span>Actividad vehicular</span><strong>{number(point.vehicles, 1)} vehículos/día</strong><small>Inicial: {number(selected.vehicles)}. Cambio: {number(point.vehicles-selected.vehicles, 1)} vehículos/día.</small></div>
          <div><span>Arbolado esperado</span><strong>{number(point.totalTrees, 2)} ejemplares</strong><small>Iniciales: {setup.initialTrees}; nuevos supervivientes: {number(point.trees, 2)}.</small></div>
          <div><span>Costo incremental acumulado</span><strong>{money(point.cumulativeCost)}</strong><small>Compras/plantación: {money(point.initialCost)}. Electricidad: {money(point.electricityCost)}.</small></div>
          <div><span>Monitoreo propuesto</span><strong>{point.sensors} dispositivos</strong><small>No reduce contaminación ni certifica cobertura. Puntos hipotéticos del mapa: {mappedSensors}.</small></div>
          <div><span>Filtración interior separada</span><strong>{number(point.each, 2)} eACH</strong><small>CADR {number(point.totalCadr)} m³/h al funcionar, {point.operatingHours} h/día.</small></div>
          <div><span>Energía HEPA acumulada</span><strong>{number(point.energy, 2)} kWh</strong><small>Sin efecto sobre las curvas exteriores.</small></div>
        </div>
        <details><summary>Consultar tabla temporal integrada</summary><div className="table-scroll"><table className="comparison-table">
          <caption>{name(primary)} frente a {name(secondary)} · mismo calendario y horizonte</caption>
          <thead><tr>{["Año", "NO₂ relativo", "PM10 relativo", "NO₂ comparación", "PM10 comparación", "Vehículos/día", "Árboles totales", "Sensores", "Costo acumulado (ARS)", "HEPA (eACH)"].map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>{points.map((p,i) => <tr key={p.year} aria-current={p.year === play.year ? "true" : undefined}><th scope="row">{p.year}</th><td>{number(p.no2,2)}</td><td>{number(p.pm10,2)}</td><td>{number(comparison[i].no2,2)}</td><td>{number(comparison[i].pm10,2)}</td><td>{number(p.vehicles,1)}</td><td>{number(p.totalTrees,2)}</td><td>{p.sensors}</td><td>{money(p.cumulativeCost)}</td><td>{number(p.each,2)}</td></tr>)}</tbody>
        </table></div></details>
      </section>
      <details><summary>¿Cómo funciona esta simulación?</summary>
        <p>Año 0 = situación inicial, sin nuevas intervenciones. Al llegar al año de aplicación s se instala todo; edad a = t − s.
          Tránsito posterior = inicial × (1 − r/100). Nuevos supervivientes N(a) = plantados × (supervivencia/100)^a.
          Los árboles iniciales se conservan constantes como referencia; no se modela su mortalidad.</p>
        <p>Nivel relativo de cada contaminante = B × max(0, 1 − α × r/100 − β × G).
          G = min(N(a)/100, 1) × min(a/10, 1). Antes de s, r y G valen 0; con cero vehículos iniciales, el término de tránsito vale 0.
          NO₂: α = 0,30 y β = 0,05. PM10: α = 0,15 y β = 0,10.
          Son coeficientes arbitrarios para dar trayectorias diferentes, no relaciones empíricas verificadas para Buenos Aires ni conversiones de emisiones a concentración.
          La pérdida de árboles puede revertir parte del cambio. No se garantiza una mejora real.</p>
        <p>B es el nivel inicial sintético editable. 100 es la referencia del ejemplo, sin ppb ni µg/m³, sin período de medición real.
          No es ICA/AQI, evaluación sanitaria ni cumplimiento legal. Las dos curvas se calculan por separado, sin combinarlas en un índice.</p>
        <p>Costos = plantación y compras iniciales al llegar a s + electricidad HEPA diaria × 365 × a.
          Al instalar se acumulan cero días de electricidad; tarifa y operación constantes, sin inflación, mantenimiento ni reposición.
          HEPA mantiene sus fórmulas de CADR/volumen y energía; ni HEPA ni sensores afectan NO₂ o PM10 exteriores.
          No se usan lecturas de sensores hipotéticos para validar el modelo.</p>
        <p>La base conserva la actividad inicial de la alternativa principal. Otras copias conservan sus propias cantidades iniciales.
          Las curvas usan situación ambiental, calendario y horizonte comunes. Los parámetros guardados no se modifican al editar otra configuración.</p>
        <p>Un sistema real necesitaría sensores calibrados, datos históricos, meteorología, modelos de emisiones y dispersión,
          métodos estadísticos y numéricos, y calibración y validación mediante mediciones posteriores.</p>
      </details>
    </div>
  </section>;
}
