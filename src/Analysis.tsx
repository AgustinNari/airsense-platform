import { useState } from "react";
import { CalendarDays, Download, Info, TrendingUp } from "lucide-react";
import { number, pollutants, seriesPath } from "./model";
import type { Pollutant, Row, Station, StationId } from "./model";
import { Badge, MethodLink, SourceLink } from "./ui";
export default function Analysis({
  rows,
  stations,
  selected,
  setSelected,
}: {
  rows: Row[];
  stations: Station[];
  selected: StationId;
  setSelected: (id: StationId) => void;
}) {
  const [pollutant, setPollutant] = useState<Pollutant>("pm10"),
    [start, setStart] = useState("2026-01-01"),
    [end, setEnd] = useState("2026-01-31");
  const validDates =
    /^2026-01-(0[1-9]|[12]\d|3[01])$/.test(start) &&
    /^2026-01-(0[1-9]|[12]\d|3[01])$/.test(end) &&
    start <= end;
  const filtered = validDates
    ? rows.filter((r) => r.date >= start && r.date <= end)
    : [];
  const values = filtered.map((r) => r[selected][pollutant]),
    available = values.filter((v): v is number => v !== null);
  const expected = validDates
    ? (Number(end.slice(-2)) - Number(start.slice(-2)) + 1) * 24
    : 0;
  const spec = pollutants[pollutant],
    station = stations.find((s) => s.id === selected)!;
  const highest = available.length ? Math.max(...available) : 0,
    lowest = available.length ? Math.min(...available) : 0;
  const maximum = highest > 0 ? highest * 1.15 : 1;
  const path = seriesPath(values, 1000, 240, maximum);
  const sourceDate = (date: string) => `${date.slice(8)}/${date.slice(5, 7)}`;
  function download() {
    const content = `FECHA,HORA,ESTACION,CONTAMINANTE,UNIDAD,VALOR\r\n${filtered.map((r) => `${r.date},${r.hour},${selected},${pollutant},${spec.unit},${r[selected][pollutant] ?? ""}`).join("\r\n")}`;
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `airsense-${selected}-${pollutant}-${start}-${end}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DIMENSIÓN AMBIENTAL</div>
          <h1>Análisis de mediciones</h1>
          <p>
            Leé la serie histórica de una estación, con sus unidades y sus
            límites.
          </p>
        </div>
        <Badge>OBSERVADO · ENERO 2026</Badge>
      </div>
      <section className="panel filters">
        <label>
          Estación
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as StationId)}
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contaminante
          <select
            value={pollutant}
            onChange={(e) => setPollutant(e.target.value as Pollutant)}
          >
            {(Object.keys(pollutants) as Pollutant[]).map((p) => (
              <option key={p} value={p}>
                {pollutants[p].name} · {pollutants[p].unit}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </section>
      {!validDates ? (
        <div className="error-state" role="alert">
          <Info size={22} />
          <div>
            <strong>Revisá el período</strong>
            <p>
              Elegí fechas entre el 1 y el 31 de enero de 2026. La fecha inicial
              debe ser anterior o igual a la final.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="analysis-stats">
            <div className="stat">
              <span>REGISTROS DISPONIBLES</span>
              <strong>
                {number(available.length)} <small>/ {number(expected)}</small>
              </strong>
              <p>
                <Badge kind="calculated">CALCULADO</Badge>{" "}
                {number(expected ? (available.length / expected) * 100 : 0, 1)}%
                del período
              </p>
            </div>
            <div className="stat">
              <span>MÍNIMO REPORTADO</span>
              <strong>
                {available.length ? number(lowest, 2) : "—"}{" "}
                <small>{spec.unit}</small>
              </strong>
              <p>
                <Badge kind="calculated">CALCULADO</Badge> sobre valores
                disponibles
              </p>
            </div>
            <div className="stat">
              <span>MÁXIMO REPORTADO</span>
              <strong>
                {available.length ? number(highest, 2) : "—"}{" "}
                <small>{spec.unit}</small>
              </strong>
              <p>
                <Badge kind="calculated">CALCULADO</Badge> sobre valores
                disponibles
              </p>
            </div>
          </div>
          <section className="panel chart-panel">
            <div className="panel-toolbar">
              <div>
                <div className="eyebrow">SERIE HISTÓRICA</div>
                <h2>
                  {spec.name} en {station.name}
                </h2>
                <p>
                  {spec.window} · {spec.unit}
                </p>
              </div>
              <button
                disabled={!filtered.length}
                className="button secondary small"
                onClick={download}
              >
                <Download size={16} /> Descargar CSV
              </button>
            </div>
            {available.length ? (
              <>
                <div className="chart-legend">
                  <span>
                    <i className="legend-dot" /> Valores oficiales reportados
                  </span>
                  <span>
                    <CalendarDays size={14} /> {sourceDate(start)} —{" "}
                    {sourceDate(end)} / 2026
                  </span>
                </div>
                <div className="chart-wrap">
                  <div className="chart-y" aria-hidden="true">
                    {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                      <span key={f}>
                        {number(maximum * f, pollutant === "co" ? 2 : 0)}
                      </span>
                    ))}
                  </div>
                  <svg
                    className="series-chart"
                    viewBox="-4 -8 1008 256"
                    role="img"
                    aria-label={`Serie ${spec.name}, ${station.name}. ${available.length} de ${expected} valores disponibles. Mínimo ${number(lowest, 2)}, máximo ${number(highest, 2)} ${spec.unit}. Los faltantes no se conectan. Datos en la tabla siguiente.`}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="chart-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0"
                          stopColor="#178577"
                          stopOpacity="0.12"
                        />
                        <stop offset="1" stopColor="#178577" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 60, 120, 180, 240].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="1000"
                        y2={y}
                        stroke="#e8eeeb"
                        strokeDasharray="3 5"
                      />
                    ))}
                    <path
                      d={path}
                      fill="none"
                      stroke="#218778"
                      strokeWidth="2.2"
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                    />
                    {values.map((v, i) =>
                      v !== null &&
                      values[i - 1] == null &&
                      values[i + 1] == null ? (
                        <circle
                          key={i}
                          cx={
                            values.length === 1
                              ? 500
                              : (i / (values.length - 1)) * 1000
                          }
                          cy={240 - (v / maximum) * 240}
                          r="3"
                          fill="#218778"
                        />
                      ) : null,
                    )}
                  </svg>
                  <div className="chart-x" aria-hidden="true">
                    <span>{sourceDate(start)} · H1</span>
                    <span>Fecha y hora originales de la fuente (H1–H24)</span>
                    <span>{sourceDate(end)} · H24</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <TrendingUp size={30} />
                <h3>Sin lecturas disponibles</h3>
                <p>
                  No hay valores reportados para esta selección. Probá otra
                  estación o período.
                </p>
              </div>
            )}
            <div className="chart-footer">
              <span>
                <Info size={15} /> {number(expected - available.length)}{" "}
                faltantes
              </span>
              <MethodLink />
            </div>
          </section>
          <details className="panel data-table">
            <summary>
              Consultar tabla accesible · {filtered.length} registros
            </summary>
            <div className="table-scroll">
              <table>
                <caption>
                  {station.name} · {spec.name} ({spec.unit}) · {spec.window}.
                  HORA original 1–24.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Hora fuente</th>
                    <th scope="col">Valor ({spec.unit})</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`${r.date}-${r.hour}`}>
                      <td>{r.date}</td>
                      <td>{r.hour}</td>
                      <td>
                        {r[selected][pollutant] === null
                          ? "Sin dato"
                          : number(r[selected][pollutant]!, 2)}
                      </td>
                      <td>
                        {r[selected][pollutant] === null
                          ? "No disponible"
                          : "OBSERVADO"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      <div className="note">
        <Info size={20} />
        <div>
          <strong>No utilizar esta información sin entender el contexto.</strong>
          <p>
            Los promedios móviles se superponen. Este prototipo no clasifica riesgo
            sanitario ni cumplimiento normativo.
          </p>
        </div>
      </div>
      <div className="source-line">
        <span>
          Fuente: <SourceLink /> · Snapshot recuperado el 03/11/2026 ·
          CC-BY-2.5-AR
        </span>
        <MethodLink />
      </div>
    </>
  );
}
