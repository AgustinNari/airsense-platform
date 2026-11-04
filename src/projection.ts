import { bounded, hepaResults, scenarioResults } from "./extensions.ts";
import type { HepaInputs, Scenario } from "./extensions.ts";
import { survivingTrees } from "./model.ts";

// Arbitrary coefficients for relative synthetic levels, never fitted to observations.
export const projectionConvention = {
  no2Traffic: 0.30, pm10Traffic: 0.15, no2Trees: 0.05, pm10Trees: 0.10,
  referenceTrees: 100, rampYears: 10, daysPerYear: 365,
} as const;
export type ProjectionSetup = { initialTrees: number; no2Initial: number; pm10Initial: number; startYear: number };
export const projectionDefaults: ProjectionSetup = { initialTrees: 50, no2Initial: 100, pm10Initial: 100, startYear: 1 };

export function projectionTimeline(
  scenario: Scenario, horizon: number, hepa: HepaInputs | null = null,
  baseline = false, setup: ProjectionSetup = projectionDefaults,
) {
  if (!bounded(horizon, 1, 30, true) || !bounded(setup.initialTrees, 0, 10000, true) ||
      !bounded(setup.no2Initial, 0, 300, true) || !bounded(setup.pm10Initial, 0, 300, true) ||
      !bounded(setup.startYear, 1, 30, true)) throw new Error("Configuración temporal inválida.");
  const main = scenarioResults(scenario);
  const filtration = hepa && !baseline ? hepaResults(hepa) : null;
  return Array.from({ length: horizon + 1 }, (_, year) => {
    const applied = !baseline && year >= setup.startYear;
    const age = applied ? year - setup.startYear : 0;
    const trees = applied ? survivingTrees(scenario.trees, scenario.survival, age) : 0;
    const r = applied && scenario.vehicles > 0 ? scenario.reduction / 100 : 0;
    const g = Math.min(trees / projectionConvention.referenceTrees, 1) * Math.min(age / projectionConvention.rampYears, 1);
    const initialCost = applied ? main.treeCost + main.sensorCost + (filtration?.purchase ?? 0) : 0;
    const days = age * projectionConvention.daysPerYear;
    const electricityCost = applied ? (filtration?.dailyCost ?? 0) * days : 0;
    return {
      year, vehicles: applied ? main.traffic : scenario.vehicles,
      trees, totalTrees: setup.initialTrees + trees, sensors: applied ? scenario.sensors : 0,
      no2: setup.no2Initial * Math.max(0, 1 - projectionConvention.no2Traffic * r - projectionConvention.no2Trees * g),
      pm10: setup.pm10Initial * Math.max(0, 1 - projectionConvention.pm10Traffic * r - projectionConvention.pm10Trees * g),
      initialCost, electricityCost, cumulativeCost: initialCost + electricityCost,
      energy: applied ? (filtration?.energy ?? 0) * days : 0,
      each: applied ? filtration?.each ?? 0 : 0,
      totalCadr: applied ? filtration?.totalCadr ?? 0 : 0,
      operatingHours: applied && filtration ? hepa!.hours : 0,
    };
  });
}

export type ProjectionPoint = ReturnType<typeof projectionTimeline>[number];
