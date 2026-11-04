import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CarFront,
  ChartNoAxesCombined,
  CircleHelp,
  FlaskConical,
  House,
  Info,
  Leaf,
  Map,
  Menu,
  Radio,
  ShieldCheck,
  Trees,
  Wind,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { validateRows } from "./model";
import type { Row, Sensor, Station, StationId, Territory } from "./model";
import MapView from "./MapView";
import type { Communes } from "./MapView";
import Analysis from "./Analysis";
import Simulator from "./Simulator";
import { Badge, MethodLink, SourceLink } from "./ui";
import ExtensionBoundary from "./ExtensionBoundary";
import ExtensionMethodology from "./ExtensionMethodology";
type Page =
  | "inicio"
  | "mapa"
  | "analisis"
  | "intervenciones"
  | "simulador"
  | "metodologia";
const navigation: { id: Page; label: string; Icon: LucideIcon }[] = [
  { id: "inicio", label: "Inicio", Icon: House },
  { id: "mapa", label: "Mapa", Icon: Map },
  { id: "analisis", label: "Análisis", Icon: ChartNoAxesCombined },
  { id: "intervenciones", label: "Intervenciones", Icon: Leaf },
  { id: "simulador", label: "Simulador", Icon: FlaskConical },
  { id: "metodologia", label: "Metodología", Icon: BookOpen },
];
function currentPage(): Page {
  const hash = window.location.hash.slice(1);
  return navigation.some((n) => n.id === hash) ? (hash as Page) : "inicio";
}
type Data = {
  rows: Row[];
  stations: Station[];
  territory: Territory[];
  communes: Communes;
};
async function jsonFile(name: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${name}`, {
    signal,
  });
  if (!response.ok) throw new Error("No se pudo cargar el archivo local.");
  return response.json();
}
function validateData(
  rows: unknown,
  stations: unknown,
  territory: unknown,
  communes: unknown,
): Data {
  const parsedRows = validateRows(rows);
  if (
    !Array.isArray(stations) ||
    stations.length !== 3 ||
    !stations.every(
      (s) =>
        s &&
        ["cordoba", "centenario", "la_boca"].includes(s.id) &&
        typeof s.name === "string" &&
        typeof s.address === "string" &&
        Number.isFinite(s.lat) &&
        s.lat > -35 &&
        s.lat < -34 &&
        Number.isFinite(s.lng) &&
        s.lng > -59 &&
        s.lng < -58 &&
        Number.isInteger(s.commune) &&
        s.commune >= 1 &&
        s.commune <= 15,
    ) ||
    new Set(stations.map((s) => s.id)).size !== 3
  )
    throw new Error("Catálogo de estaciones inválido.");
  if (
    !Array.isArray(territory) ||
    territory.length !== 15 ||
    !territory.every(
      (t) =>
        t &&
        Number.isInteger(t.commune) &&
        t.commune >= 1 &&
        t.commune <= 15 &&
        typeof t.neighborhoods === "string" &&
        Array.isArray(t.stations) &&
        t.stations.every(
          (id: unknown) =>
            typeof id === "string" && stations.some((s) => s.id === id),
        ),
    ) ||
    new Set(territory.map((t) => t.commune)).size !== 15
  )
    throw new Error("Indicador territorial inválido.");
  const validRing = (ring: unknown) =>
    Array.isArray(ring) &&
    ring.length >= 4 &&
    ring.every(
      (point: unknown) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === "number" &&
        Number.isFinite(point[0]) &&
        point[0] > -59 &&
        point[0] < -58 &&
        typeof point[1] === "number" &&
        Number.isFinite(point[1]) &&
        point[1] > -35 &&
        point[1] < -34,
    ) &&
    ring[0][0] === ring.at(-1)[0] &&
    ring[0][1] === ring.at(-1)[1];
  const validPolygon = (polygon: unknown) =>
    Array.isArray(polygon) && polygon.length > 0 && polygon.every(validRing);
  const geo = communes as Communes;
  if (
    !geo ||
    geo.type !== "FeatureCollection" ||
    !Array.isArray(geo.features) ||
    geo.features.length !== 15 ||
    !geo.features.every(
      (f) =>
        f?.type === "Feature" &&
        Number.isInteger(f.properties?.comuna) &&
        f.properties.comuna >= 1 &&
        f.properties.comuna <= 15 &&
        (f.geometry?.type === "Polygon"
          ? validPolygon(f.geometry.coordinates)
          : f.geometry?.type === "MultiPolygon" &&
            Array.isArray(f.geometry.coordinates) &&
            f.geometry.coordinates.length > 0 &&
            f.geometry.coordinates.every(validPolygon)),
    ) ||
    new Set(geo.features.map((f) => f.properties.comuna)).size !== 15
  )
    throw new Error("Geometría territorial inválida.");
  return { rows: parsedRows, stations, territory, communes: geo };
}
export default function App() {
  const [page, setPage] = useState<Page>(currentPage),
    [mobile, setMobile] = useState(false),
    [selected, setSelected] = useState<StationId>("cordoba"),
    [sensors, setSensors] = useState<Sensor[]>([]);
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const main = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const change = () => {
      setPage(currentPage());
      setMobile(false);
      main.current?.focus();
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  // Local files provide a repeatable snapshot; abort prevents stale fetch completion.
  // https://react.dev/reference/react/useEffect#fetching-data-with-effects
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      [
        "measurements.json",
        "stations.json",
        "territory.json",
        "comunas.geojson",
      ].map((name) => jsonFile(name, controller.signal)),
    )
      .then(([rows, stations, territory, communes]) =>
        setData(validateData(rows, stations, territory, communes)),
      )
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [retry]);
  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <header
        className={`app-header ${mobile ? "menu-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setMobile(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className="header-inner">
          <a className="brand" href="#inicio" aria-label="AirSense · Inicio">
            <Wind size={30} strokeWidth={1.7} />
            <span>
              AirSense<small>OBSERVATORIO CABA</small>
            </span>
          </a>
          <button
            ref={menuButton}
            className="mobile-menu"
            aria-label={mobile ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobile}
            aria-controls="main-navigation"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X size={22} /> : <Menu size={22} />}
            <span>Menú</span>
          </button>
          <nav id="main-navigation" aria-label="Navegación principal">
            {navigation.map(({ id, label, Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setMobile(false)}
                aria-current={page === id ? "page" : undefined}
                className={page === id ? "active" : ""}
              >
                <Icon size={17} />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <a
            className="header-source"
            href="#metodologia"
            aria-label="Fuentes y metodología"
          >
            <CircleHelp size={19} />
            <span>Fuentes</span>
          </a>
        </div>
        <div className="context-strip">
          <div>
            <span>Ciudad de Buenos Aires</span>
            <span>
              <i /> Enero 2026 · datos históricos locales
            </span>
          </div>
        </div>
      </header>
      <div className="workspace">
        <main id="main" ref={main} tabIndex={-1}>
          {error ? (
            <section className="panel empty-state" role="alert">
              <Info size={34} />
              <h1>No pudimos abrir el snapshot local.</h1>
              <p>
                Comprobá que la aplicación incluya su carpeta de datos y volvé a
                intentar.
              </p>
              <button
                className="button"
                onClick={() => {
                  setError(false);
                  setRetry((v) => v + 1);
                }}
              >
                Reintentar carga
              </button>
            </section>
          ) : !data ? (
            <section className="panel empty-state" role="status">
              <span className="loader" />
              <h1>Preparando el observatorio…</h1>
              <p>Cargando el snapshot local y la geometría de CABA.</p>
            </section>
          ) : (
            <>
              {page === "inicio" && (
                <Home data={data} setSelected={setSelected} />
              )}
              {page === "mapa" && (
                <MapView
                  {...data}
                  selected={selected}
                  setSelected={setSelected}
                  sensors={sensors}
                  setSensors={setSensors}
                />
              )}
              <div hidden={page !== "analisis"}>
                <Analysis
                  rows={data.rows}
                  stations={data.stations}
                  selected={selected}
                  setSelected={setSelected}
                />
              </div>
              {page === "intervenciones" && <Interventions />}
              <div hidden={page !== "simulador"}>
                <Simulator mappedSensors={sensors.length} active={page === "simulador"} />
              </div>
              {page === "metodologia" && <Methodology />}
            </>
          )}
          <footer className="footer">
            <span>
              <Wind size={17} /> AirSense{" "}
              <span className="footer-separator">/</span> Aire Urbano Inteligente
            </span>
            <a href="#metodologia">
              Fuentes, supuestos y límites <ArrowUpRight size={13} />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
function Home({
  data,
  setSelected,
}: {
  data: Data;
  setSelected: (id: StationId) => void;
}) {
  return (
    <>
      <div className="page-heading home-heading">
        <div>
          <div className="eyebrow">OBSERVATORIO AMBIENTAL · CABA</div>
          <h1>
            Calidad del aire
            <br />
            en Buenos Aires
          </h1>
          <p>
            Explorá mediciones oficiales, reconocé los límites del monitoreo y
            compará intervenciones con supuestos a la vista.
          </p>
        </div>
        <div className="home-actions">
          <a className="button" href="#mapa">
            Explorar mapa <ArrowRight size={18} />
          </a>
          <a className="button secondary" href="#analisis">
            Consultar series <ChartNoAxesCombined size={18} />
          </a>
        </div>
      </div>
      <section
        className="home-overview"
        aria-label="Datos disponibles del observatorio"
      >
        <div className="overview-section station-overview">
          <div className="overview-heading">
            <Radio size={21} />
            <h2>Estaciones del catálogo</h2>
            <Badge>OBSERVADO</Badge>
          </div>
          <p className="overview-lead">
            <strong>{data.stations.length}</strong> puntos con series históricas
            locales
          </p>
          <div className="home-stations">
            {data.stations.map((s) => (
              <a href="#mapa" key={s.id} onClick={() => setSelected(s.id)}>
                <span className="station-index">
                  <Radio size={17} />
                </span>
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.address}</small>
                </span>
                <span className="station-commune">C{s.commune}</span>
                <ArrowUpRight size={17} />
              </a>
            ))}
          </div>
          <p className="overview-footnote">
            Catálogo seleccionado; no representa necesariamente la red vigente
            completa.
          </p>
        </div>
        <div className="overview-section pollutant-overview">
          <div className="overview-heading">
            <Wind size={21} />
            <h2>Series de enero 2026</h2>
          </div>
          <p className="overview-lead">
            Tres contaminantes.
          </p>
          <div className="pollutant-list">
            <div>
              <strong>
                CO <span>ppm</span>
              </strong>
              <span>Promedio móvil de 8 horas</span>
            </div>
            <div>
              <strong>
                NO₂ <span>ppb</span>
              </strong>
              <span>Promedio horario</span>
            </div>
            <div>
              <strong>
                PM10 <span>µg/m³</span>
              </strong>
              <span>Promedio móvil de 24 horas</span>
            </div>
          </div>
          <a className="method-link" href="#analisis">
            Ver series y disponibilidad <ArrowRight size={16} />
          </a>
        </div>
        <div className="overview-section territory-overview">
          <div className="overview-heading">
            <Map size={21} />
            <h2>Presencia territorial</h2>
          </div>
          <div className="home-territory-value">
            {data.territory.filter((t) => t.stations.length).length}
            <span>/ {data.territory.length}</span>
            <Badge kind="calculated">CALCULADO</Badge>
          </div>
          <p>comunas con puntos del catálogo</p>
          <div
            className="commune-grid"
            aria-label="Comunas con puntos: 1, 4 y 6"
          >
            {data.territory.map((t) => (
              <span
                key={t.commune}
                className={t.stations.length ? "occupied" : ""}
                title={`Comuna ${t.commune}: ${t.stations.length ? "con punto" : "sin punto del catálogo"}`}
              >
                {t.commune}
              </span>
            ))}
          </div>
          <p className="overview-footnote">
            Presencia de puntos, no cobertura de calidad del aire ni exposición
            de la población.
          </p>
          <a className="method-link" href="#mapa">
            Explorar el territorio <ArrowRight size={16} />
          </a>
        </div>
      </section>
      <section className="demo-route">
        <div className="section-title">
          <div>
            <div className="eyebrow">RECORRIDO GUIADO</div>
            <h2>De los datos al escenario</h2>
          </div>
          <a href="#metodologia">
            Cómo leer los resultados <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="route-steps">
          {[
            {
              id: "mapa",
              title: "Ubicá una estación",
              description: "Explorá CABA y seleccioná una estación, por ejemplo Córdoba.",
              Icon: Map,
            },
            {
              id: "analisis",
              title: "Consultá las mediciones",
              description: "Elegí contaminante, fechas y unidades.",
              Icon: ChartNoAxesCombined,
            },
            {
              id: "mapa",
              title: "Proponé un sensor",
              description: "Ubicá un punto simulado con una muestra hipotética opcional.",
              Icon: Radio,
            },
            {
              id: "simulador",
              title: "Compará una intervención",
              description: "Probá una reducción del tránsito del 20%.",
              Icon: FlaskConical,
            },
          ].map(({ id, title, description, Icon }, i) => (
            <a href={`#${id}`} key={title}>
              <span className="step-number">0{i + 1}</span>
              <Icon size={23} />
              <strong>{title}</strong>
              <p>{description}</p>
              <ArrowUpRight size={17} />
            </a>
          ))}
        </div>
      </section>
      <div className="home-context">
        <div>
          <Info size={21} />
          <div>
            <h3>Medir no es extrapolar</h3>
            <p>
              Las estaciones aportan información localizada. No permiten inferir
              la concentración de cada cuadra ni clasificar el riesgo sanitario
              desde este prototipo.
            </p>
          </div>
        </div>
        <div>
          <FlaskConical size={21} />
          <div>
            <h3>Simular no es predecir</h3>
            <p>
              Tránsito, arbolado y sensores son ejercicios con parámetros
              editables. Los resultados no predicen concentraciones ni
              beneficios sanitarios.
            </p>
          </div>
        </div>
      </div>
      <div className="source-line">
        <span>
          <ShieldCheck size={17} /> Fuente: <SourceLink /> · CC-BY-2.5-AR
        </span>
        <span>Snapshot histórico · recuperado el 03/11/2026</span>
      </div>
    </>
  );
}
function Interventions() {
  const cards = [
    {
      Icon: CarFront,
      title: "Reducir actividad vehicular",
      tag: "ACTUAR SOBRE LAS EMISIONES",
      body: "Menos viajes motorizados pueden reducir actividad de las fuentes. Promover transporte público, movilidad activa y gestión de viajes son opciones a evaluar.",
      benefit: "Objetivo: reducir emisiones asociadas a la movilidad.",
      limit:
        "Un 20% menos de vehículos no demuestra un 20% menos de concentración. Influyen flota, combustibles, clima y otras fuentes.",
      href: "https://www.epa.gov/transportation-air-pollution-and-climate-change/what-you-can-do-reduce-pollution-vehicles-and",
      source: "EPA · Transporte y contaminación",
    },
    {
      Icon: Trees,
      title: "Planificar el arbolado urbano",
      tag: "DISEÑAR CON EL TERRITORIO",
      body: "El arbolado ofrece sombra y otros servicios ecosistémicos. Una intervención debe considerar especies, sitio, agua, supervivencia y mantenimiento.",
      benefit:
        "Objetivo: mejorar el entorno urbano con una plantación planificada.",
      limit:
        "La vegetación puede alterar la ventilación en cañones urbanos. No se estima remoción de partículas ni beneficio sanitario en este modelo.",
      href: "https://www.epa.gov/air-research/recommendations-constructing-roadside-vegetation-barriers-improve-near-road-air",
      source: "EPA · Vegetación y calidad del aire",
    },
    {
      Icon: Wind,
      title: "Filtrar partículas en interiores",
      tag: "ACTUAR SOBRE LA EXPOSICIÓN",
      body: "La filtración HEPA puede complementar el control de fuentes y la ventilación para disminuir partículas en un espacio interior adecuado.",
      benefit: "Objetivo: reducir partículas en el aire interior tratado.",
      limit:
        "HEPA no es una solución para gases ni limpia el aire exterior. El desempeño depende del equipo, el ambiente y su mantenimiento.",
      href: "https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home",
      source: "EPA · Filtración del aire interior",
    },
    {
      Icon: Radio,
      title: "Ampliar el monitoreo",
      tag: "MEJORAR LA INFORMACIÓN",
      body: "Nuevos puntos pueden aportar información localizada si se planifican con criterios de ubicación, calibración, calidad y comparabilidad.",
      benefit:
        "Objetivo: responder preguntas que el catálogo seleccionado no resuelve.",
      limit:
        "Instalar sensores no reduce contaminación por sí mismo. Un sensor de bajo costo no equivale automáticamente a una estación de referencia.",
      href: "https://www.epa.gov/air-sensor-toolbox",
      source: "EPA · Air Sensor Toolbox",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CATÁLOGO DE INTERVENCIONES</div>
          <h1>Intervenciones ambientales</h1>
          <p>
            Reducir emisiones, reducir exposición y mejorar información son
            finalidades distintas.
          </p>
        </div>
      </div>
      <div className="intervention-grid">
        {cards.map(({ Icon, ...card }, i) => (
          <article className="panel intervention-card" key={card.title}>
            <div className="intervention-top">
              <span className={`card-icon ${i === 3 ? "purple-icon" : ""}`}>
                <Icon size={28} />
              </span>
              <span>0{i + 1}</span>
            </div>
            <div className="eyebrow">{card.tag}</div>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <div className="benefit">
              <strong>Finalidad</strong>
              <p>{card.benefit}</p>
            </div>
            <div className="limitation">
              <Info size={17} />
              <div>
                <strong>Alcance y límites</strong>
                <p>{card.limit}</p>
              </div>
            </div>
            <a
              className="method-link"
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {card.source}
              <ArrowUpRight size={14} />
            </a>
          </article>
        ))}
      </div>
      <div className="note">
        <FlaskConical size={23} />
        <div>
          <strong>Explorá los supuestos de cada intervención</strong>
          <p>
            El simulador permite explorar actividad vehicular, supervivencia de
            árboles y presupuestos. Validar eficacia requiere una intervención
            física y medición posterior.
          </p>
          <a className="method-link" href="#simulador">
            Abrir simulador <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </>
  );
}
function Methodology() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">TRANSPARENCIA Y REPRODUCIBILIDAD</div>
          <h1>Fuentes y metodología</h1>
          <p>
            Qué observamos, qué calculamos y qué todavía no podemos afirmar.
          </p>
        </div>
        <Badge>SNAPSHOT · 03 NOV 2026</Badge>
      </div>
      <section className="panel methodology-intro">
        <BookOpen size={30} />
        <div>
          <h2>Alcance del prototipo</h2>
          <p>
            AirSense conecta datos oficiales históricos con un ejercicio
            territorial y escenarios ilustrativos. La línea base es enero de
            2026; el objetivo es mejorar la comprensión y la planificación, sin
            atribuir beneficios que todavía no se midieron.
          </p>
        </div>
      </section>
      <div className="method-dimensions">
        <div className="panel">
          <Badge>OBSERVADO</Badge>
          <h3>Ambiental</h3>
          <p>
            Concentraciones históricas reportadas en tres estaciones. No se
            predicen valores futuros.
          </p>
        </div>
        <div className="panel">
          <Badge kind="calculated">CALCULADO</Badge>
          <h3>Social / territorial</h3>
          <p>
            Comunas con puntos del catálogo. No mide población beneficiada,
            exposición ni cobertura.
          </p>
        </div>
        <div className="panel">
          <Badge kind="assumed">SUPUESTO → SIMULADO</Badge>
          <h3>Económica</h3>
          <p>
            Costos editables en ARS. No son precios de mercado ni presupuestos
            técnicos.
          </p>
        </div>
      </div>
      <section className="method-accordions">
        <details className="panel" open>
          <summary>01 · Fuentes, procedencia y licencia</summary>
          <div>
            <p>
              <strong>Mediciones:</strong> Buenos Aires Data / Agencia de
              Protección Ambiental (APrA). Archivo original conservado y
              extracto de enero de 2026: 744 filas, con fecha y HORA 1–24
              originales. Descarga del 03/11/2026. La hora 24 permanece en su
              fecha fuente; no se transforma en un timestamp.
            </p>
            <p>
              <strong>Ubicaciones:</strong> catálogo de estaciones ambientales.
              Córdoba, Parque Centenario y La Boca. Se excluye Palermo porque el
              catálogo la señala desactivada desde 2010. No se afirma que este
              catálogo describa la red vigente completa.
            </p>
            <p>
              <strong>Límites:</strong> GeoJSON oficial de las 15 comunas. El
              conteo depende de las coordenadas y la versión de los límites;
              puntos limítrofes pueden cambiar de asignación.
            </p>
            <div className="source-buttons">
              <SourceLink />
              <a
                href="https://data.buenosaires.gob.ar/dataset/comunas"
                target="_blank"
                rel="noopener noreferrer"
              >
                Buenos Aires Data · Comunas <ArrowUpRight size={13} />
              </a>
              <a
                href="https://creativecommons.org/licenses/by/2.5/ar/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Licencia CC-BY-2.5-AR <ArrowUpRight size={13} />
              </a>
              <a href="data/manifest.json" download>
                Manifiesto de trazabilidad ↗
              </a>
            </div>
            <p>
              Los archivos originales, hashes SHA-256, transformaciones,
              unidades y faltantes se conservan en el manifiesto local.{" "}
              <a href="data/calidad-aire.csv" download>
                Descargar CSV original
              </a>
              .
            </p>
          </div>
        </details>
        <details className="panel" open>
          <summary>02 · Contaminantes y ventanas de agregación</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Variable</th>
                  <th scope="col">Unidad original</th>
                  <th scope="col">Ventana reportada</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CO</td>
                  <td>ppm</td>
                  <td>Promedio móvil de las 8 horas anteriores</td>
                </tr>
                <tr>
                  <td>NO₂</td>
                  <td>ppb</td>
                  <td>Promedio de los 60 minutos anteriores</td>
                </tr>
                <tr>
                  <td>PM10</td>
                  <td>µg/m³</td>
                  <td>Promedio móvil de las 24 horas anteriores</td>
                </tr>
              </tbody>
            </table>
            <p>
              No hay PM2.5 en este snapshot. Los promedios móviles se superponen
              y no equivalen a promedios diarios independientes. Los faltantes
              permanecen nulos: no se reemplazan por cero ni se interpolan.
            </p>
            <p>
              El gráfico compara una misma estación, contaminante y período. Los
              mínimos y máximos se calculan sobre valores disponibles.
              Disponibilidad = valores no nulos / horas esperadas del período.
            </p>
          </div>
        </details>
        <details className="panel">
          <summary>03 · Presencia territorial y sensores hipotéticos</summary>
          <div>
            <p>
              Se comprueba si cada coordenada oficial está dentro de un polígono
              de comuna. Resultado: 3 de 15 comunas con puntos del catálogo
              seleccionado (1, 4 y 6); 12 sin esos puntos.
            </p>
            <p>
              <strong>Esto no representa cobertura de calidad del aire.</strong>{" "}
              No hay radios de alcance, mapas de calor, estimaciones por cuadra
              ni inferencias sobre zonas contaminadas. Tampoco demuestra
              ausencia de toda medición en las demás comunas.
            </p>
            <p>
              Los sensores simulados se ubican dentro de CABA y no generan
              mediciones reales. Su ficha opcional muestra un ejemplo sintético de datos, sin relación con la ubicación.
              El selector accesible propone un punto interior validado
              de la comuna elegida; no es una recomendación técnica de sitio. Se
              conservan en memoria mientras se navega y se pueden quitar.
            </p>
          </div>
        </details>
        <details className="panel">
          <summary>04 · Fórmulas y supuestos del simulador</summary>
          <div>
            <p>
              <strong>Tránsito:</strong> vehículos finales = vehículos iniciales
              × (1 − reducción / 100). Base inicial: 10.000 vehículos/día
              supuestos; reducción por defecto: 20%; alternativa: 8.000
              vehículos/día. No se calcula concentración atmosférica.
            </p>
            <p>
              <strong>Arbolado:</strong> supervivientes esperados = árboles
              plantados × (supervivencia anual / 100)<sup>años</sup>. Se asumen
              tasa constante y ausencia de reposición. Base: sin nueva
              plantación. El valor esperado puede ser fraccionario; no es un
              conteo observado.
            </p>
            <p>
              <strong>Costos:</strong> plantación = cantidad × costo por árbol;
              sensores = dispositivos adicionales × costo unitario. Subtotal =
              plantación + dispositivos. Costos ilustrativos, sin programa de
              tránsito, mantenimiento, instalación de sensores ni operación. Los
              parámetros son editables y no constituyen una cotización.
            </p>
            <p>
              La cantidad presupuestada de sensores es independiente de los
              puntos hipotéticos del mapa. No se altera el número de estaciones
              oficiales. Los escenarios no se guardan al recargar la página.
            </p>
          </div>
        </details>
        <details className="panel">
          <summary>05 · Incertidumbre, objetivo y validación futura</summary>
          <div>
            <p>
              La calidad del aire depende de emisiones, meteorología,
              transformaciones químicas y forma urbana. Tres estaciones no
              describen cada barrio. Este snapshot histórico no es un servicio
              en tiempo real.
            </p>
            <p>
              No se usan umbrales sanitarios ni legales y no se infiere
              cumplimiento normativo. Una guía de salud y un límite legal tienen
              propósitos diferentes y requieren ventanas y unidades compatibles.
            </p>
            <p>
              Comprobar eficacia exige implementar una intervención, definir
              métricas comparables y medir después, considerando un diseño de
              evaluación y las condiciones meteorológicas. El prototipo no
              cuantifica remoción de partículas, ahorro sanitario ni población
              beneficiada.
            </p>
          </div>
        </details>
        <ExtensionBoundary><ExtensionMethodology /></ExtensionBoundary>
      </section>
      <div className="note">
        <ShieldCheck size={22} />
        <div>
          <strong>Demo local y reproducible.</strong>
          <p>
            El recorrido usa archivos incluidos en la aplicación. El fondo de
            calles OpenStreetMap es opcional y requiere internet; al activarlo,
            el navegador solicita teselas a OpenStreetMap. No hay cuentas,
            telemetría ni backend.
          </p>
        </div>
        <MethodLink />
      </div>
    </>
  );
}
