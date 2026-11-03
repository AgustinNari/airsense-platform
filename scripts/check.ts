import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  finalTraffic,
  survivingTrees,
  seriesPath,
  validateRows,
} from "../src/model.ts";
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
console.log(
  "PASS: 744 fechas/horas, 6.696 celdas y faltantes, 4 hashes originales, presencia 3/15, fórmulas y discontinuidades.",
);
