import { useState } from "react";
import {
  ArrowRight,
  CarFront,
  Info,
  Radio,
  RotateCcw,
  Trees,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { finalTraffic, money, number, survivingTrees } from "./model";
import { Badge, MethodLink } from "./ui";
const defaults = {
  vehicles: 10000,
  reduction: 20,
  trees: 100,
  survival: 90,
  years: 5,
  treeCost: 50000,
  sensors: 3,
  sensorCost: 250000,
};
type Scenario = typeof defaults;
function CompareBars({
  base,
  alternative,
  unit,
  labels = ["Línea base", "Escenario alternativo"],
}: {
  base: number;
  alternative: number;
  unit: string;
  labels?: string[];
}) {
  const maximum = Math.max(base, alternative, 1);
  return (
    <div className="compare-bars">
      {[base, alternative].map((value, i) => (
        <div key={i}>
          <div>
            <span>{labels[i]}</span>
            <strong>
              {number(value, 1)} <small>{unit}</small>
            </strong>
          </div>
          <div className="bar-track">
            <div
              className={i ? "alternative-bar" : "base-bar"}
              style={{ width: `${(value / maximum) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
export default function Simulator({
  mappedSensors,
}: {
  mappedSensors: number;
}) {
  const [scenario, setScenario] = useState<Scenario>(defaults),
    [tab, setTab] = useState("traffic");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const traffic = finalTraffic(scenario.vehicles, scenario.reduction),
    survivors = survivingTrees(
      scenario.trees,
      scenario.survival,
      scenario.years,
    );
  const treeTotal = scenario.trees * scenario.treeCost,
    sensorTotal = scenario.sensors * scenario.sensorCost;
  const tabs: { id: string; label: string; Icon: LucideIcon }[] = [
    { id: "traffic", label: "Tránsito", Icon: CarFront },
    { id: "trees", label: "Arbolado", Icon: Trees },
    { id: "sensors", label: "Sensores", Icon: Radio },
  ];
  function field(
    key: keyof Scenario,
    label: string,
    max: number,
    unit: string,
    min = 0,
  ) {
    return (
      <label className="number-field">
        {label}
        <div>
          <input
            type="number"
            min={min}
            max={max}
            step="1"
            value={scenario[key]}
            aria-invalid={!!errors[key]}
            aria-describedby={errors[key] ? `${key}-error` : undefined}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (
                e.target.value === "" ||
                !Number.isFinite(value) ||
                !Number.isInteger(value) ||
                value < min ||
                value > max
              ) {
                setErrors((current) => ({
                  ...current,
                  [key]: `Ingresá un entero entre ${number(min)} y ${number(max)}. Se mantiene el último valor válido.`,
                }));
                return;
              }
              setScenario((current) => ({ ...current, [key]: value }));
              setErrors((current) => ({ ...current, [key]: "" }));
            }}
          />
          <span>{unit}</span>
        </div>
        {errors[key] && (
          <small id={`${key}-error`} className="field-error" role="alert">
            {errors[key]}
          </small>
        )}
      </label>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">LABORATORIO DE ESCENARIOS</div>
          <h1>Simulador de intervenciones</h1>
          <p>
            Compará supuestos transparentes. 
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            setScenario(defaults);
            setErrors({});
          }}
        >
          <RotateCcw size={16} /> Restablecer escenario
        </button>
      </div>
      <div className="simulation-banner">
        <span className="simulation-icon">
          <Info size={22} />
        </span>
        <div>
          <strong>MODELO ILUSTRATIVO</strong>
          <p>
            Los controles son no preditivos. Costos expresados en ARS.
          </p>
        </div>
        <Badge kind="simulated">SIMULADO</Badge>
      </div>
      <div
        className="simulation-tabs"
        role="group"
        aria-label="Tipo de escenario"
      >
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-pressed={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </div>
      <div className="simulator-layout">
        <section className="panel scenario-controls">
          <div className="eyebrow">PARÁMETROS DEL ESCENARIO</div>
          <Badge kind="assumed">SUPUESTOS EDITABLES</Badge>
          {tab === "traffic" ? (
            <>
              <h2>Menos actividad vehicular</h2>
              <p>Un indicador de tránsito, expresado en vehículos por día.</p>
              {field(
                "vehicles",
                "Actividad vehicular inicial",
                100000,
                "vehículos/día",
              )}
              <label className="range-field">
                Reducción propuesta <strong>{scenario.reduction}%</strong>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={scenario.reduction}
                  onChange={(e) =>
                    setScenario((current) => ({
                      ...current,
                      reduction: Number(e.target.value),
                    }))
                  }
                />
                <span>
                  <small>0% · sin reducción</small>
                  <small>100%</small>
                </span>
              </label>
              <div className="formula">
                Vehículos finales = iniciales × (1 − reducción / 100)
              </div>
            </>
          ) : tab === "trees" ? (
            <>
              <h2>Arbolado a futuro</h2>
              <p>Proyección de supervivencia con una tasa anual constante.</p>
              {field("trees", "Árboles a plantar", 10000, "ejemplares")}
              {field("survival", "Supervivencia anual supuesta", 100, "%")}
              {field("years", "Horizonte", 30, "años", 1)}
              {field("treeCost", "Costo por árbol plantado", 10000000, "ARS")}
              <div className="formula">
                Supervivientes esperados = plantados × (supervivencia / 100)
                <sup>años</sup>
              </div>
            </>
          ) : (
            <>
              <h2>Más información ambiental</h2>
              <p>
                Presupuesto de dispositivos hipotéticos. Sin mediciones
                asociadas.
              </p>
              {field(
                "sensors",
                "Sensores adicionales propuestos",
                100,
                "dispositivos",
              )}
              {field("sensorCost", "Costo unitario supuesto", 100000000, "ARS")}
              <div className="formula">
                Costo de sensores = cantidad adicional × costo unitario
              </div>
              <small>
                Esta propuesta presupuestaria es independiente de los puntos
                simulados del mapa (cantidad actual: {mappedSensors}).
              </small>
            </>
          )}
          <MethodLink />
        </section>
        <section className="panel scenario-results">
          <div className="panel-toolbar">
            <div className="eyebrow">BASE Y ALTERNATIVA</div>
            <Badge kind="simulated">SIMULADO / CALCULADO</Badge>
          </div>
          {tab === "traffic" ? (
            <>
              <div className="result-icon">
                <CarFront size={26} />
              </div>
              <h2>Actividad vehicular resultante</h2>
              <p>La concentración del aire requiere medición propia.</p>
              <div className="big-result">
                {number(traffic)}
                <span>vehículos/día en el escenario alternativo</span>
              </div>
              <CompareBars
                base={scenario.vehicles}
                alternative={traffic}
                unit="vehículos/día"
              />
              <div className="result-callout">
                <strong>
                  {number(scenario.vehicles - traffic)} vehículos/día menos
                </strong>
                <span>
                  Reducción de actividad de {scenario.reduction}%. No equivale a{" "}
                  {scenario.reduction}% menos de contaminación.
                </span>
              </div>
            </>
          ) : tab === "trees" ? (
            <>
              <div className="result-icon">
                <Trees size={26} />
              </div>
              <h2>Proyección de supervivencia.</h2>
              <p>Sin plantación de reposición y con supervivencia constante.</p>
              <div className="big-result">
                ≈ {number(survivors, 1)}
                <span>supervivientes esperados al año {scenario.years}</span>
              </div>
              <CompareBars
                base={0}
                alternative={survivors}
                unit="ejemplares"
                labels={[
                  "Base · sin nueva plantación",
                  `Alternativa · año ${scenario.years}`,
                ]}
              />
              <div className="result-callout">
                <strong>{money(treeTotal)} de plantación</strong>
                <span>
                  {number(scenario.trees)} árboles × {money(scenario.treeCost)}.
                  El valor esperado no es un conteo real de árboles.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="result-icon">
                <Radio size={26} />
              </div>
              <h2>Sensores adicionales</h2>
              <p>Los puntos hipotéticos no reemplazan estaciones oficiales.</p>
              <div className="big-result">
                {money(sensorTotal)}
                <span>presupuesto de sensores adicionales</span>
              </div>
              <CompareBars
                base={0}
                alternative={scenario.sensors}
                unit="sensores nuevos"
                labels={[
                  "Base · sin compra adicional",
                  "Alternativa · dispositivos propuestos",
                ]}
              />
              <div className="result-callout">
                <strong>3 estaciones del catálogo oficial, sin cambios</strong>
                <span>
                  {scenario.sensors} dispositivos propuestos para presupuestar.
                  No implica comparabilidad, calibración ni cobertura
                  territorial.
                </span>
              </div>
            </>
          )}
          <div className="result-footer">
            Las barras comparan una misma magnitud y unidad. <MethodLink />
          </div>
        </section>
      </div>
      <section className="panel budget-summary">
        <div>
          <div className="eyebrow">DIMENSIÓN ECONÓMICA · ESCENARIO ACTUAL</div>
          <h2>Presupuesto del escenario</h2>
          <p>
            Solo plantación y dispositivos. No incluye programa de tránsito,
            mantenimiento, instalación de sensores ni operación.
          </p>
        </div>
        <div className="budget-items">
          <div>
            <span>Plantación</span>
            <strong>{money(treeTotal)}</strong>
          </div>
          <span>+</span>
          <div>
            <span>Sensores</span>
            <strong>{money(sensorTotal)}</strong>
          </div>
          <ArrowRight size={18} />
          <div>
            <Badge kind="simulated">SUBTOTAL ILUSTRATIVO</Badge>
            <strong>{money(treeTotal + sensorTotal)}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
