import { useId, useState } from "react";
import { hepaDefaults, hepaFields, hepaResults } from "./extensions";
import type { HepaInputs } from "./extensions";
import { money, number } from "./model";
import { Badge, MethodLink } from "./ui";

export default function HepaPanel({ inputs, setInputs }: {
  inputs: HepaInputs; setInputs: (inputs: HepaInputs) => void;
}) {
  const [drafts, setDrafts] = useState<Partial<Record<keyof HepaInputs, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof HepaInputs, string>>>({});
  const prefix = useId();
  const result = hepaResults(inputs);
  return (
    <details className="panel extension-panel" open>
      <summary>Filtración HEPA interior · simulación complementaria</summary>
      <div className="extension-body">
        <Badge kind="simulated">CAPACIDAD TEÓRICA · INTERIOR HIPOTÉTICO</Badge>
        <p>Dimensioná un ambiente supuesto. Los valores iniciales son ejemplos editables, no especificaciones de equipos ni tarifas vigentes.</p>
        <div className="extension-form">
          {(Object.keys(hepaFields) as (keyof HepaInputs)[]).map(key => {
            const spec = hepaFields[key];
            return <label key={key}>{spec.label} ({spec.unit})
              <input type="number" min={spec.min} max={spec.max} step={spec.step}
                value={drafts[key] ?? inputs[key]} aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `${prefix}-${key}` : undefined}
                onChange={e => {
                  const raw = e.target.value;
                  setDrafts(current => ({ ...current, [key]: raw }));
                  const candidate = { ...inputs, [key]: Number(raw) };
                  try {
                    if (!raw) throw new Error("Campo vacío");
                    hepaResults(candidate);
                    setInputs(candidate); setErrors(current => ({ ...current, [key]: "" }));
                  } catch {
                    setErrors(current => ({ ...current, [key]: `Usá un valor entre ${number(spec.min)} y ${number(spec.max)}, en pasos de ${number(spec.step, 2)}. Se conserva el último resultado válido.` }));
                  }
                }}
                onBlur={() => {
                  setDrafts(current => ({ ...current, [key]: undefined }));
                  setErrors(current => ({ ...current, [key]: "" }));
                }} />
              {errors[key] && <small className="field-error" id={`${prefix}-${key}`} role="alert">{errors[key]}</small>}
            </label>;
          })}
        </div>
        <div className="extension-metrics" aria-label="Resultados de filtración">
          <div><span>Volumen</span><strong>{number(result.volume, 2)} m³</strong></div>
          <div><span>CADR total mientras funcionan</span><strong>{number(result.totalCadr)} m³/h</strong></div>
          <div><span>eACH mientras funcionan</span><strong>{number(result.each, 2)} h⁻¹</strong></div>
          <div><span>Energía diaria</span><strong>{number(result.energy, 3)} kWh/día</strong></div>
          <div><span>Electricidad supuesta</span><strong>ARS {number(result.dailyCost, 2)}/día</strong></div>
          <div><span>Compra inicial supuesta</span><strong>{money(result.purchase)}</strong></div>
        </div>
        {inputs.hours === 0 && <p role="status">Con 0 horas no hay operación diaria. CADR y eACH indican únicamente capacidad al encender los equipos.</p>}
        <div className="note">No calcula porcentajes de reducción de PM2.5 ni trata aire exterior.
          Estos costos son independientes del subtotal de plantación y sensores.</div>
        <details><summary>Cómo se calcula y qué limita el resultado</summary>
          <p>Volumen = superficie × altura. CADR total = equipos × CADR por equipo (m³/h).
            eACH = CADR total / volumen (h⁻¹). Se suman capacidades nominales de equipos idénticos;
            no equivale a ventilación con aire exterior. El CADR corresponde al caudal de aire limpio para partículas.</p>
          <p>Energía diaria = equipos × potencia (W) / 1.000 × horas.
            Electricidad diaria = kWh × tarifa. Compra inicial = equipos × costo unitario.
            Se asumen potencia y CADR constantes mientras funcionan; no se incluyen filtros de repuesto ni mantenimiento.</p>
          <p>El desempeño real depende de infiltración, ventilación, fuentes internas, ubicación y mantenimiento.
            Una implementación real necesitaría caracterizar el recinto, verificar el CADR para las partículas de interés y medir antes y después.</p>
          <a className="method-link" href="https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home" target="_blank" rel="noopener noreferrer">EPA · Filtración interior</a>
        </details>
        <div className="extension-actions">
          <button className="button secondary" onClick={() => { setInputs(hepaDefaults); setDrafts({}); setErrors({}); }}>Restablecer HEPA</button>
          <MethodLink />
        </div>
      </div>
    </details>
  );
}
