import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  finalTraffic,
  survivingTrees,
  seriesPath,
  validateRows,
} from "../src/model.ts";
import {
  hepaDefaults, hepaResults, monitoringOpportunity, scenarioResults,
  syntheticReading, treeTimeline,
} from "../src/extensions.ts";
import { projectionDefaults, projectionTimeline } from "../src/projection.ts";
const root = new URL("../public/data/", import.meta.url);
const read = (name: string) => readFileSync(new URL(name, root));
const json = (name: string) => JSON.parse(read(name).toString("utf8"));
const rows = validateRows(json("measurements.json"));
assert.equal(rows.length, 31 * 24);
assert.equal(new Set(rows.map((r) => `${r.date}-${r.hour}`)).size, 744);
assert.equal(rows.at(-1)?.date, "2026-01-31");
assert.equal(rows.at(-1)?.hour, 24);
const manifest = json("manifest.json");
for (const file of manifest.files) {
  const bytes = read(file.file);
  assert.equal(bytes.length, file.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256);
}
let cells = 0;
for (const id of ["cordoba", "centenario", "la_boca"] as const)
  for (const p of ["co", "no2", "pm10"] as const) {
    assert.equal(
      rows.filter((r) => r[id][p] === null).length,
      manifest.missingCounts[id][p],
    );
    cells += rows.length;
  }
assert.equal(cells, 6696);
assert.equal(
  json("territory.json").filter(
    (t: { stations: string[] }) => t.stations.length,
  ).length,
  3,
);
assert.equal(json("territory.json").length, 15);
assert.equal(finalTraffic(10000, 20), 8000);
assert.equal(finalTraffic(10000, 100), 0);
assert.ok(Math.abs(survivingTrees(100, 90, 5) - 59.049) < 1e-10);
assert.equal(survivingTrees(100, 0, 5), 0);
assert.equal(survivingTrees(100, 100, 5), 100);
assert.equal((seriesPath([1, null, 2]).match(/M/g) ?? []).length, 2);
assert.ok(!seriesPath([0, null, 0], 1000, 240, 1).includes("NaN"));
assert.throws(() => validateRows(rows.slice(1)));
assert.throws(() => validateRows([...rows.slice(0, -1), rows[0]]));
const timeline = treeTimeline(100, 90, 5);
assert.equal(timeline.length, 6);
assert.deepEqual(timeline[0], { year: 0, trees: 100 });
assert.equal(timeline.at(-1)!.trees, survivingTrees(100, 90, 5));
assert.ok(timeline.every((p, i) => i === 0 || p.trees <= timeline[i - 1].trees));
assert.deepEqual(treeTimeline(100, 0, 1).map(p => p.trees), [100, 0]);
assert.ok(treeTimeline(0, 100, 30).every(p => p.trees === 0));
assert.ok(treeTimeline(100, 100, 30).every(p => p.trees === 100));
for (const invalid of [-1, NaN, Infinity]) {
  assert.throws(() => treeTimeline(invalid, 90, 5));
  assert.throws(() => treeTimeline(100, invalid, 5));
  assert.throws(() => treeTimeline(100, 90, invalid));
}
for (const invalid of [0, 1.5, 31]) assert.throws(() => treeTimeline(100, 90, invalid));
const scenario = { vehicles: 10000, reduction: 20, trees: 100, survival: 90,
  years: 5, treeCost: 50000, sensors: 3, sensorCost: 250000 };
assert.deepEqual(scenarioResults(scenario), { traffic: 8000, survivors: 59.04900000000001,
  treeCost: 5000000, sensorCost: 750000 });
assert.equal(scenarioResults({ ...scenario, reduction: 10 }).traffic, 9000);
assert.equal(scenarioResults({ ...scenario, reduction: 30 }).traffic, 7000);
for (const key of Object.keys(scenario) as (keyof typeof scenario)[]) {
  for (const value of [-1, NaN, Infinity]) assert.throws(() => scenarioResults({ ...scenario, [key]: value }));
}
const hepa = hepaResults(hepaDefaults);
assert.equal(hepa.volume, 180);
assert.equal(hepa.totalCadr, 600);
assert.equal(hepa.each, 600 / 180);
assert.equal(hepa.energy, 0.8);
assert.equal(hepa.dailyCost, 120);
assert.equal(hepa.purchase, 400000);
assert.equal(hepaResults({ ...hepaDefaults, quantity: 0 }).each, 0);
assert.equal(hepaResults({ ...hepaDefaults, quantity: 0 }).purchase, 0);
assert.equal(hepaResults({ ...hepaDefaults, hours: 0 }).energy, 0);
assert.equal(hepaResults({ ...hepaDefaults, hours: 0 }).each, hepa.each);
assert.equal(hepaResults({ ...hepaDefaults, cadr: 0 }).each, 0);
assert.equal(hepaResults({ ...hepaDefaults, tariff: 0 }).dailyCost, 0);
assert.equal(hepaResults({ ...hepaDefaults, area: 1, height: 1, quantity: 100, cadr: 10000 }).each, 1000000);
for (const key of Object.keys(hepaDefaults) as (keyof typeof hepaDefaults)[]) {
  for (const value of [-1, NaN, Infinity, 1e12]) assert.throws(() => hepaResults({ ...hepaDefaults, [key]: value }));
}
for (const invalid of [0, 0.5]) assert.throws(() => hepaResults({ ...hepaDefaults, area: invalid }));
assert.throws(() => hepaResults({ ...hepaDefaults, height: 0 }));
assert.throws(() => hepaResults({ ...hepaDefaults, quantity: 0.5 }));
assert.throws(() => hepaResults({ ...hepaDefaults, hours: 24.5 }));
assert.deepEqual(syntheticReading(1), { pm10: 18, temperature: 21, humidity: 49 });
assert.deepEqual(syntheticReading(1), syntheticReading(1));
for (const invalid of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => syntheticReading(invalid));
assert.notEqual(monitoringOpportunity(0).title, monitoringOpportunity(1).title);
const projected = projectionTimeline(scenario, 5);
assert.equal(projected.length, 6);
assert.equal(projected[0].trees, 0);
assert.equal(projected[0].totalTrees, 50);
assert.equal(projected[0].vehicles, 10000);
assert.equal(projected[0].no2, 100);
assert.equal(projected[0].pm10, 100);
assert.equal(projected[0].cumulativeCost, 0);
assert.equal(projected[1].trees, 100);
assert.equal(projected[1].vehicles, 8000);
assert.equal(projected[1].no2, 94);
assert.equal(projected[1].pm10, 97);
assert.ok(Math.abs(projected[5].no2 - 92.6878) < 1e-8);
assert.ok(Math.abs(projected[5].pm10 - 94.3756) < 1e-8);
assert.equal(projected[5].trees, survivingTrees(100, 90, 4));
assert.ok(projected.slice(1).every(p => p.cumulativeCost === 5750000));
const withHepa = projectionTimeline(scenario, 5, hepaDefaults);
assert.equal(withHepa[1].initialCost, 6150000);
assert.equal(withHepa[1].energy, 0);
assert.equal(withHepa[5].electricityCost, 175200);
assert.equal(withHepa[5].cumulativeCost, 6325200);
assert.equal(withHepa[5].energy, 1168);
assert.equal(withHepa[5].each, hepa.each);
const levels = (points: ReturnType<typeof projectionTimeline>) => points.map(p => [p.no2, p.pm10]);
assert.deepEqual(levels(withHepa), levels(projected));
assert.deepEqual(levels(projectionTimeline({ ...scenario, sensors: 100 }, 5)), levels(projected));
assert.ok(projectionTimeline(scenario, 5, hepaDefaults, true).every(p =>
  p.vehicles === 10000 && p.trees === 0 && p.totalTrees === 50 && p.sensors === 0 && p.no2 === 100 && p.pm10 === 100 &&
  p.cumulativeCost === 0 && p.each === 0 && p.energy === 0));
assert.equal(projectionTimeline({ ...scenario, vehicles: 0, reduction: 100, trees: 0 }, 1)[1].no2, 100);
assert.equal(projectionTimeline({ ...scenario, trees: 0, sensors: 0 }, 1)[1].initialCost, 0);
assert.ok(projectionTimeline(scenario, 5, { ...hepaDefaults, hours: 0 }).every(p => p.electricityCost === 0 && p.energy === 0));
assert.ok(projectionTimeline(scenario, 5, { ...hepaDefaults, quantity: 0 }).every(p => p.each === 0 && p.energy === 0));
const delayed = projectionTimeline(scenario, 5, hepaDefaults, false, { ...projectionDefaults, startYear: 3 });
assert.ok(delayed.slice(0,3).every(p => p.no2 === 100 && p.pm10 === 100 && p.trees === 0 && p.cumulativeCost === 0 && p.sensors === 0));
assert.equal(delayed[3].trees, 100);
assert.equal(delayed[3].electricityCost, 0);
assert.equal(delayed[4].trees, 90);
assert.equal(delayed[4].electricityCost, 43800);
assert.ok(projectionTimeline(scenario, 1, hepaDefaults, false, { ...projectionDefaults, startYear: 30 }).every(p => p.cumulativeCost === 0 && p.no2 === 100));
assert.equal(projectionTimeline({ ...scenario, survival: 0 }, 3)[2].trees, 0);
assert.ok(projectionTimeline(scenario, 5, null, false, { ...projectionDefaults, no2Initial: 0, pm10Initial: 0 }).every(p => p.no2 === 0 && p.pm10 === 0));
const inputSnapshot = JSON.stringify(scenario);
assert.equal(projectionTimeline(scenario, 30).length, 31);
assert.equal(JSON.stringify(scenario), inputSnapshot);
assert.equal(scenario.years, 5);
for (const invalid of [-1, 0, 1.5, 31, NaN, Infinity]) assert.throws(() => projectionTimeline(scenario, invalid));
for (const key of Object.keys(projectionDefaults) as (keyof typeof projectionDefaults)[]) {
  for (const invalid of [-1, NaN, Infinity, 1e12]) assert.throws(() => projectionTimeline(scenario, 5, null, false, { ...projectionDefaults, [key]: invalid }));
}
assert.throws(() => projectionTimeline(scenario, 5, null, false, { ...projectionDefaults, startYear: 0 }));
assert.throws(() => projectionTimeline({ ...scenario, reduction: 101 }, 5));
assert.throws(() => projectionTimeline(scenario, 5, { ...hepaDefaults, height: 0 }));
const extremeProjection = projectionTimeline({ vehicles: 100000, reduction: 100, trees: 10000,
  survival: 100, years: 30, treeCost: 10000000, sensors: 100, sensorCost: 100000000 }, 30,
  { area: 1, height: 1, quantity: 100, cadr: 10000, hours: 24, watts: 5000, tariff: 10000, unitCost: 100000000 });
assert.ok(extremeProjection.every((p, i) => Object.values(p).every(Number.isFinite) &&
  p.no2 >= 0 && p.no2 <= 100 && p.pm10 >= 0 && p.pm10 <= 100 &&
  (i === 0 || p.cumulativeCost >= extremeProjection[i - 1].cumulativeCost)));
assert.equal(extremeProjection[0].vehicles, 100000);
assert.equal(extremeProjection[30].vehicles, 0);
assert.ok(Math.abs(extremeProjection[30].no2 - 65) < 1e-10);
assert.ok(Math.abs(extremeProjection[30].pm10 - 75) < 1e-10);
console.log("PASS: integridad oficial, fórmulas originales, HEPA, escenarios, muestras sintéticas y proyección NO₂/PM10 (situación inicial, calendario, costos, independencia, extremos).");
