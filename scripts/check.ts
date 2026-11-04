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
console.log(
  "PASS: integridad oficial (744 fechas/horas, 6.696 celdas, faltantes, 4 hashes, presencia 3/15), fórmulas originales, evolución anual, escenarios, HEPA y casos límite, muestras sintéticas y criterios de monitoreo.",
);
