import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import {
  ArrowUpRight,
  Layers,
  LocateFixed,
  MapPin,
  Plus,
  Radio,
  Trash2,
} from "lucide-react";
import type { Row, Sensor, Station, StationId, Territory } from "./model";
import { Badge, MethodLink } from "./ui";
import ExtensionBoundary from "./ExtensionBoundary";
import SensorReadings from "./SensorReadings";
import TerritoryPanel from "./TerritoryPanel";

type Geometry = Polygon | MultiPolygon;
type CommuneFeature = Feature<Geometry, { comuna: number }>;
export type Communes = FeatureCollection<Geometry, { comuna: number }>;
function inRing(point: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
export function insideGeometry(lng: number, lat: number, geometry: Geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(
    (rings) =>
      inRing([lng, lat], rings[0]) &&
      !rings.slice(1).some((ring) => inRing([lng, lat], ring)),
  );
}
function interiorPoint(feature: CommuneFeature): L.LatLng {
  const bounds = L.geoJSON(feature).getBounds(),
    center = bounds.getCenter();
  if (insideGeometry(center.lng, center.lat, feature.geometry)) return center;
  for (let y = 1; y < 30; y++)
    for (let x = 1; x < 30; x++) {
      const lat =
        bounds.getSouth() + ((bounds.getNorth() - bounds.getSouth()) * y) / 30;
      const lng =
        bounds.getWest() + ((bounds.getEast() - bounds.getWest()) * x) / 30;
      if (insideGeometry(lng, lat, feature.geometry)) return L.latLng(lat, lng);
    }
  throw new Error("No se encontró un punto interior.");
}
type Props = {
  rows: Row[];
  stations: Station[];
  territory: Territory[];
  communes: Communes;
  selected: StationId;
  setSelected: (id: StationId) => void;
  sensors: Sensor[];
  setSensors: React.Dispatch<React.SetStateAction<Sensor[]>>;
};
export default function MapView({
  rows,
  stations,
  territory,
  communes,
  selected,
  setSelected,
  sensors,
  setSensors,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [contextCommune, setContextCommune] = useState(stations.find(s => s.id === selected)!.commune);
  const viewport = useRef<{ center: L.LatLng; zoom: number } | null>(null);
  const [osm, setOsm] = useState(false),
    [adding, setAdding] = useState(false),
    [commune, setCommune] = useState(2),
    [message, setMessage] = useState("");
  const station = stations.find((s) => s.id === selected)!;
  // Leaflet owns this subtree; clean up external listeners and layers on changes/unmount.
  // https://react.dev/reference/react/useEffect#controlling-a-non-react-widget
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, {
      scrollWheelZoom: false,
      zoomSnap: 0.25,
      minZoom: 10,
      maxZoom: 17,
    });
    const occupied = new Set(
      territory.filter((t) => t.stations.length).map((t) => t.commune),
    );
    const polygons = L.geoJSON(communes, {
      style: (feature) => ({
        color: "#71a49a",
        weight: 1.3,
        fillColor: occupied.has(feature?.properties.comuna)
          ? "#8bbab0"
          : "#dde7dd",
        fillOpacity: 0.7,
      }),
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          if (!adding) setContextCommune(Number(feature.properties.comuna));
        });
        const communeLabel = document.createElement("span");
        communeLabel.textContent = `C${feature.properties.comuna}`;
        communeLabel.setAttribute(
          "aria-label",
          `Comuna ${feature.properties.comuna}`,
        );
        layer.bindTooltip(communeLabel, {
          permanent: true,
          direction: "center",
          className: "commune-label",
        });
      },
    }).addTo(map);
    if (viewport.current)
      map.setView(viewport.current.center, viewport.current.zoom, { animate: false });
    else map.fitBounds(polygons.getBounds(), { padding: [28, 28] });
    if (osm) {
      const tiles = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          opacity: 0.55,
        },
      ).addTo(map);
      tiles.on("tileerror", () =>
        setMessage(
          "No se pudo cargar el fondo OSM. La geometría local y las estaciones siguen disponibles.",
        ),
      );
      tiles.bringToBack();
    }
    map.attributionControl.addAttribution(
      "Comunas: Buenos Aires Data · CC-BY-2.5-AR",
    );
    for (const s of stations) {
      const marker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: "station-pin",
          html: `<span class="pin-dot ${selected === s.id ? "selected" : ""}"></span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        title: `Seleccionar estación ${s.name}`,
        alt: s.name,
        keyboard: true,
      }).addTo(map);
      const stationLabel = document.createElement("span");
      stationLabel.textContent = s.name;
      marker.bindTooltip(stationLabel, {
        direction: "top",
        offset: [0, -10],
        permanent: selected === s.id,
        className: "station-tooltip",
      });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        setSelected(s.id);
      });
    }
    for (const sensor of sensors)
      L.marker([sensor.lat, sensor.lng], {
        icon: L.divIcon({
          className: "sensor-pin",
          html: "<span>+</span>",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        title: `Sensor simulado ${sensor.id}, comuna ${sensor.commune}`,
      })
        .addTo(map)
        .bindTooltip(`SIMULADO · Muestra hipotética en la ficha · Comuna ${sensor.commune}`);
    map.on("click", (event) => {
      if (!adding) return;
      const feature = communes.features.find((f) =>
        insideGeometry(event.latlng.lng, event.latlng.lat, f.geometry),
      );
      if (!feature) {
        setMessage("Elegí un punto dentro del límite de CABA.");
        return;
      }
      setSensors((current) => [
        ...current,
        {
          id: Math.max(0, ...current.map((s) => s.id)) + 1,
          lat: event.latlng.lat,
          lng: event.latlng.lng,
          commune: Number(feature.properties.comuna),
        },
      ]);
      setAdding(false);
      setMessage(
        `Sensor hipotético agregado en comuna ${feature.properties.comuna}. No genera mediciones reales.`,
      );
    });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      viewport.current = { center: map.getCenter(), zoom: map.getZoom() };
      observer.disconnect();
      map.remove();
    };
  }, [
    stations,
    territory,
    communes,
    selected,
    setSelected,
    sensors,
    setSensors,
    osm,
    adding,
  ]);
  function addAccessible() {
    const feature = communes.features.find(
      (f) => Number(f.properties.comuna) === commune,
    )!;
    const point = interiorPoint(feature);
    setAdding(false);
    setSensors((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((s) => s.id)) + 1,
        lat: point.lat,
        lng: point.lng,
        commune,
      },
    ]);
    setMessage(
      `Sensor hipotético agregado en un punto interior de la comuna ${commune}. No genera mediciones reales.`,
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DIMENSIÓN TERRITORIAL</div>
          <h1>Estaciones y territorio</h1>
          <p>
            Explorá dónde se encuentran los puntos del catálogo y pensá nuevas
            ubicaciones.
          </p>
        </div>
        <Badge kind="calculated">CALCULADO · PRESENCIA TERRITORIAL</Badge>
      </div>
      <div className="map-layout panel">
        <section className="map-panel" aria-label="Mapa de las comunas de CABA">
          <div className="panel-toolbar">
            <div className="toolbar-title">
              <MapPin size={18} />
              <strong>Ciudad de Buenos Aires</strong>
              <span className="subtle">15 comunas · contexto C{contextCommune}</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={osm}
                onChange={(e) => setOsm(e.target.checked)}
              />
              <Layers size={16} /> Calles OSM{" "}
              <span className="subtle">(en línea)</span>
            </label>
          </div>
          <div
            className={`map-canvas ${adding ? "adding" : ""}`}
            ref={container}
            role="region"
            aria-label="Mapa interactivo. Alternativa accesible: lista de estaciones y selector de comuna."
          />
          <div className="map-legend">
            <span>
              <i className="legend-dot" /> Punto del catálogo
            </span>
            <span>
              <i className="legend-square" /> Comuna con punto
            </span>
            <span>
              <i className="legend-dot purple" /> Sensor simulado
            </span>
          </div>
          <button
            className={`button map-add ${adding ? "purple-button" : ""}`}
            onClick={() => {
              setAdding(!adding);
              setMessage("");
            }}
          >
            <Plus size={16} />
            {adding ? "Cancelar ubicación" : "Agregar sensor simulado"}
          </button>
          {adding && (
            <div className="map-hint" role="status">
              Hacé clic dentro de CABA para ubicarlo.
            </div>
          )}
        </section>
        <aside className="map-side">
          <section className="station-card">
            <div className="eyebrow">ESTACIÓN SELECCIONADA</div>
            <div className="station-symbol">
              <Radio size={26} />
              <span>APrA · Buenos Aires Data</span>
            </div>
            <h2>{station.name}</h2>
            <p>
              <MapPin size={14} /> {station.address}
            </p>
            <div className="station-meta">
              <span>
                Comuna <strong>{station.commune}</strong>
              </span>
              <span>
                Serie local <strong>Ene 2026</strong>
              </span>
            </div>
            <div className="pill-row">
              <span>CO</span>
              <span>NO₂</span>
              <span>PM10</span>
            </div>
            <a className="button full" href="#analisis">
              Consultar mediciones <ArrowUpRight size={17} />
            </a>
            <div className="station-switch" aria-label="Seleccionar estación">
              {stations.map((s) => (
                <button
                  key={s.id}
                  aria-pressed={selected === s.id}
                  className={selected === s.id ? "active" : ""}
                  onClick={() => setSelected(s.id)}
                >
                  <span className="small-dot" />
                  {s.name}
                  <span>C{s.commune}</span>
                </button>
              ))}
            </div>
            <small>
              Ubicaciones del catálogo oficial. No implica que la red vigente
              esté completa.
            </small>
          </section>
        </aside>
      </div>
      <div className="territory-sensor-layout">
        <section className="territorial-card">
          <div className="eyebrow">LEER EL TERRITORIO</div>
          <div className="territory-stat">
            {territory.filter((t) => t.stations.length).length}
            <span>/ {territory.length}</span>
          </div>
          <strong>comunas con puntos del catálogo</strong>
          <div
            className="commune-grid"
            aria-label="Comunas con puntos: 1, 4 y 6"
          >
            {territory.map((t) => (
              <span
                key={t.commune}
                className={t.stations.length ? "occupied" : ""}
                title={`Comuna ${t.commune}: ${t.stations.length ? "con punto" : "sin punto en este catálogo"}`}
              >
                {t.commune}
              </span>
            ))}
          </div>
          <p>
            Presencia territorial, no cobertura de calidad del aire. Las otras
            12 comunas no tienen puntos en este catálogo seleccionado.
          </p>
          <MethodLink />
        </section>
        <section className="panel sensor-controls">
          <div>
            <Badge kind="simulated">SIMULADO</Badge>
            <h2>Proponé un punto de monitoreo</h2>
            <p>
              Puntos hipotéticos con una muestra sintética opcional. No hay dispositivos físicos ni mediciones reales.
            </p>
          </div>
          <div className="sensor-form">
            <label>
              Comuna para ubicar el sensor
              <select
                value={commune}
                onChange={(e) => setCommune(Number(e.target.value))}
              >
                {territory.map((t) => (
                  <option key={t.commune} value={t.commune}>
                    Comuna {t.commune} · {t.neighborhoods}
                  </option>
                ))}
              </select>
            </label>
            <button className="button secondary" onClick={addAccessible}>
              <LocateFixed size={17} /> Ubicar en esta comuna
            </button>
          </div>
          <div className="status-message" role="status">
            {message ||
              `${sensors.length} sensores hipotéticos en el mapa. Se conservan mientras navegás.`}
          </div>
          {sensors.length > 0 && (
            <div className="sensor-list">
              {sensors.map((s) => (
                <div key={s.id}>
                  <span>
                    <i className="legend-dot purple" /> Sensor {s.id} ·
                    Comuna {s.commune} <small>SIMULADO · datos hipotéticos</small>
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Eliminar sensor ${s.id}`}
                    onClick={() =>
                      setSensors((current) =>
                        current.filter((item) => item.id !== s.id),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                  <ExtensionBoundary><SensorReadings sensor={s} /></ExtensionBoundary>
                </div>
              ))}
              <button
                className="text-button"
                onClick={() => {
                  setSensors([]);
                  setMessage("Se quitaron todos los sensores hipotéticos.");
                }}
              >
                Quitar todos
              </button>
            </div>
          )}
        </section>
      </div>
      <ExtensionBoundary>
        <TerritoryPanel territory={territory} stations={stations} rows={rows}
          commune={contextCommune} setCommune={setContextCommune} setSelected={setSelected} />
      </ExtensionBoundary>
      <div className="note">
        <strong>Una brecha de información no demuestra contaminación.</strong>{" "}
        Estos puntos no permiten inferir la calidad del aire de cada barrio ni
        cuántas personas están representadas. <MethodLink />
      </div>
    </>
  );
}
