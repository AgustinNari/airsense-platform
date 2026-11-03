export type StationId = "cordoba" | "centenario" | "la_boca";
export type Pollutant = "co" | "no2" | "pm10";
export type Reading = Record<Pollutant, number | null>;
export type Row = { date: string; hour: number } & Record<StationId, Reading>;
export type Station = {
  id: StationId;
  name: string;
  address: string;
  lat: number;
  lng: number;
  commune: number;
};
export type Territory = {
  commune: number;
  neighborhoods: string;
  stations: StationId[];
};
export type Sensor = { id: number; lat: number; lng: number; commune: number };
export const pollutants = {
  pm10: { name: "PM10", unit: "µg/m³", window: "Promedio móvil de 24 horas" },
  no2: { name: "NO₂", unit: "ppb", window: "Promedio horario" },
  co: { name: "CO", unit: "ppm", window: "Promedio móvil de 8 horas" },
};
export const stationIds: StationId[] = ["cordoba", "centenario", "la_boca"];
export const number = (n: number, digits = 0) =>
  n.toLocaleString("es-AR", { maximumFractionDigits: digits });
export const money = (n: number) => `ARS ${number(n)}`;
export const finalTraffic = (base: number, reduction: number) =>
  base * (1 - reduction / 100);
export const survivingTrees = (
  planted: number,
  survival: number,
  years: number,
) => planted * (survival / 100) ** years;
export function seriesPath(
  values: (number | null)[],
  width = 1000,
  height = 240,
  max = 1,
) {
  let drawing = false;
  return values
    .map((value, index) => {
      if (value === null) {
        drawing = false;
        return "";
      }
      const point = `${values.length === 1 ? width / 2 : (index / (values.length - 1)) * width},${height - (value / max) * height}`;
      const command = drawing ? "L" : "M";
      drawing = true;
      return `${command}${point}`;
    })
    .join(" ");
}
// Validate the snapshot at its fetch boundary; missing readings remain null.
export function validateRows(input: unknown): Row[] {
  if (!Array.isArray(input) || input.length !== 744)
    throw new Error("Snapshot de mediciones inválido.");
  const keys = new Set<string>();
  for (const row of input) {
    if (
      !row ||
      typeof row !== "object" ||
      !/^2026-01-(0[1-9]|[12]\d|3[01])$/.test(row.date) ||
      !Number.isInteger(row.hour) ||
      row.hour < 1 ||
      row.hour > 24
    )
      throw new Error("Fecha u hora inválida en el snapshot.");
    const key = `${row.date}-${row.hour}`;
    if (keys.has(key)) throw new Error("Registros duplicados en el snapshot.");
    keys.add(key);
    for (const id of stationIds)
      for (const p of ["co", "no2", "pm10"]) {
        const v = row[id]?.[p];
        if (
          v !== null &&
          (typeof v !== "number" || !Number.isFinite(v) || v < 0)
        )
          throw new Error("Lectura inválida en el snapshot.");
      }
  }
  return (input as Row[]).sort(
    (a, b) => a.date.localeCompare(b.date) || a.hour - b.hour,
  );
}
