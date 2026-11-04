import { finalTraffic, survivingTrees } from "./model.ts";

// These models never consume or modify official concentration measurements.
export type Scenario = {
  vehicles: number; reduction: number; trees: number; survival: number;
  years: number; treeCost: number; sensors: number; sensorCost: number;
};
export function bounded(value: number, min: number, max: number, integer = false) {
  return Number.isFinite(value) && value >= min && value <= max &&
    (!integer || Number.isInteger(value));
}
export function treeTimeline(planted: number, survival: number, years: number) {
  if (!bounded(planted, 0, 10000, true) || !bounded(survival, 0, 100) ||
      !bounded(years, 1, 30, true)) throw new Error("Parámetros de arbolado inválidos.");
  return Array.from({ length: years + 1 }, (_, year) => ({
    year, trees: survivingTrees(planted, survival, year),
  }));
}
export function scenarioResults(s: Scenario) {
  if (!bounded(s.vehicles, 0, 100000, true) || !bounded(s.reduction, 0, 100) ||
      !bounded(s.treeCost, 0, 10000000, true) || !bounded(s.sensors, 0, 100, true) ||
      !bounded(s.sensorCost, 0, 100000000, true))
    throw new Error("Escenario inválido.");
  const timeline = treeTimeline(s.trees, s.survival, s.years);
  return {
    traffic: finalTraffic(s.vehicles, s.reduction),
    survivors: timeline.at(-1)!.trees,
    treeCost: s.trees * s.treeCost, sensorCost: s.sensors * s.sensorCost,
  };
}
export type HepaInputs = {
  area: number; height: number; quantity: number; cadr: number;
  hours: number; watts: number; tariff: number; unitCost: number;
};
export const hepaFields = {
  area: { label: "Superficie del ambiente", unit: "m²", min: 1, max: 10000, step: 0.1 },
  height: { label: "Altura del ambiente", unit: "m", min: 1, max: 20, step: 0.1 },
  quantity: { label: "Cantidad de purificadores", unit: "equipos", min: 0, max: 100, step: 1 },
  cadr: { label: "CADR por equipo", unit: "m³/h", min: 0, max: 10000, step: 1 },
  hours: { label: "Funcionamiento diario", unit: "h/día", min: 0, max: 24, step: 0.5 },
  watts: { label: "Potencia por equipo", unit: "W", min: 0, max: 5000, step: 1 },
  tariff: { label: "Tarifa eléctrica supuesta", unit: "ARS/kWh", min: 0, max: 10000, step: 0.01 },
  unitCost: { label: "Costo de compra por equipo", unit: "ARS", min: 0, max: 100000000, step: 1 },
} as const;
export const hepaDefaults: HepaInputs = {
  area: 60, height: 3, quantity: 2, cadr: 300, hours: 8,
  watts: 50, tariff: 150, unitCost: 200000,
};
export function hepaResults(inputs: HepaInputs) {
  for (const key of Object.keys(hepaFields) as (keyof HepaInputs)[]) {
    const spec = hepaFields[key];
    if (!bounded(inputs[key], spec.min, spec.max) ||
        Math.abs((inputs[key] - spec.min) / spec.step -
          Math.round((inputs[key] - spec.min) / spec.step)) > 1e-6)
      throw new Error("Parámetros de filtración inválidos.");
  }
  const volume = inputs.area * inputs.height;
  const totalCadr = inputs.quantity * inputs.cadr;
  const energy = inputs.quantity * inputs.watts / 1000 * inputs.hours;
  return { volume, totalCadr, each: totalCadr / volume, energy,
    dailyCost: energy * inputs.tariff, purchase: inputs.quantity * inputs.unitCost };
}
export function syntheticReading(id: number) {
  if (!bounded(id, 1, Number.MAX_SAFE_INTEGER, true)) throw new Error("Sensor inválido.");
  // A fixed payload example based only on ID, never on location or official data.
  return { pm10: 15 + (id % 7) * 3, temperature: 20 + (id % 5), humidity: 45 + (id % 6) * 4 };
}
export function monitoringOpportunity(stationCount: number) {
  return stationCount === 0
    ? { title: "Explorar una campaña de medición", reason: "No hay puntos del catálogo seleccionado dentro de esta comuna.",
        limitation: "La ausencia de un punto no demuestra contaminación ni ausencia de otras mediciones. Hace falta definir pregunta, sitios, períodos y equipos." }
    : { title: "Evaluar representatividad y continuidad", reason: "Hay puntos del catálogo con series de enero de 2026 en esta comuna.",
        limitation: "Un punto no describe toda la comuna. Revisar faltantes y condiciones del sitio antes de decidir si hacen falta más mediciones." };
}
