"""Reproduce the bundled January 2026 extract from preserved public originals.

Run from the repository root: python scripts/prepare_data.py
No network access; never replaces the original source files.
"""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'data'
BASE = 'https://cdn.buenosaires.gob.ar/datosabiertos/datasets/'
AIR = BASE + 'agencia-de-proteccion-ambiental/calidad-aire/'
STATION_KEYS = {'CORDOBA': 'cordoba', 'CENTENARIO': 'centenario', 'LA BOCA': 'la_boca'}


def number(value):
    if not value or value.strip().lower() in {'s/d', 'nan', '-'}:
        return None
    return float(value.replace(',', '.'))


def inside_ring(x, y, ring):
    inside = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0]-a[0]) * (y-a[1]) / (b[1]-a[1]) + a[0]:
            inside = not inside
    return inside


def inside_geometry(x, y, geometry):
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    return any(inside_ring(x, y, p[0]) and not any(inside_ring(x, y, hole) for hole in p[1:]) for p in polygons)


def dump(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')


def prepare():
    with (ROOT / 'calidad-aire.csv').open(encoding='utf-8-sig', newline='') as f:
        raw = [r for r in csv.DictReader(f) if r['FECHA'][2:9] == 'JAN2026']
    assert len(raw) == 744
    assert len({(r['FECHA'], r['HORA']) for r in raw}) == 744
    rows = []
    for r in raw:
        row = {'date': f"2026-01-{r['FECHA'][:2]}", 'hour': int(r['HORA'])}
        assert 1 <= row['hour'] <= 24
        for suffix in STATION_KEYS.values():
            row[suffix] = {p: number(r[f'{p}_{suffix}'.upper()]) for p in ['co', 'no2', 'pm10']}
        rows.append(row)
    rows.sort(key=lambda r: (r['date'], r['hour']))
    dump('measurements.json', rows)
    with (ROOT / 'estaciones-ambientales.csv').open(encoding='utf-8-sig', newline='') as f:
        station_rows = list(csv.DictReader(f, delimiter=';'))
    communes = json.loads((ROOT / 'comunas.geojson').read_text(encoding='utf-8-sig'))
    stations = []
    names = {'cordoba': 'Córdoba', 'centenario': 'Parque Centenario', 'la_boca': 'La Boca'}
    addresses = {'cordoba': 'Av. Córdoba y Rodríguez Peña', 'centenario': 'Ramos Mejía 800', 'la_boca': 'Av. Brasil 100'}
    for r in station_rows:
        if r['nombre'] not in STATION_KEYS:
            continue
        key = STATION_KEYS[r['nombre']]
        lat, lng = number(r['lat']), number(r['long'])
        matches = [f['properties']['comuna'] for f in communes['features'] if inside_geometry(lng, lat, f['geometry'])]
        assert len(matches) == 1, (key, matches)
        stations.append({'id': key, 'name': names[key], 'address': addresses[key], 'lat': lat, 'lng': lng, 'commune': matches[0]})
    dump('stations.json', stations)
    presence = [{'commune': f['properties']['comuna'], 'neighborhoods': f['properties']['barrios'], 'stations': [s['id'] for s in stations if s['commune'] == f['properties']['comuna']]} for f in communes['features']]
    dump('territory.json', presence)
    urls = {'calidad-aire.csv': AIR+'calidad-aire.csv', 'estaciones-ambientales.csv': AIR+'estaciones-ambientales.csv', 'contaminantes.csv': AIR+'contaminantes.csv', 'comunas.geojson': BASE+'ministerio-de-educacion/comunas/comunas.geojson'}
    manifest = {
        'retrievedOn': '2026-11-03', 'period': {'start': '2026-01-01', 'end': '2026-01-31'},
        'publisher': 'Gobierno de la Ciudad Autónoma de Buenos Aires / Buenos Aires Data; calidad del aire: APrA',
        'license': 'CC-BY-2.5-AR', 'licenseUrl': 'https://creativecommons.org/licenses/by/2.5/ar/',
        'catalogs': ['https://data.buenosaires.gob.ar/dataset/calidad-aire', 'https://data.buenosaires.gob.ar/dataset/comunas'],
        'files': [{'file': name, 'url': url, 'bytes': (ROOT/name).stat().st_size, 'sha256': hashlib.sha256((ROOT/name).read_bytes()).hexdigest()} for name, url in urls.items()],
        'transformations': ['Filtrar FECHA con mes JAN2026; ordenar por fecha y HORA sin reinterpretar hora 24.', 'Renombrar columnas a objetos por estación; s/d y vacíos a null; números de unidades originales.', 'Estaciones: conservar coordenadas originales. Normalizar solo nombres y direcciones con errores de codificación visibles en el original.', 'Excluir Palermo: catálogo indica estación desactivada desde 30/06/2010.', 'Presencia territorial: punto en polígono con anillos y huecos del GeoJSON; no es radio ni cobertura de exposición.'],
        'pollutants': {'co': {'label': 'CO', 'unit': 'ppm', 'window': 'Promedio móvil de las 8 horas anteriores'}, 'no2': {'label': 'NO₂', 'unit': 'ppb', 'window': 'Promedio horario de los 60 minutos anteriores'}, 'pm10': {'label': 'PM10', 'unit': 'µg/m³', 'window': 'Promedio móvil de las 24 horas anteriores'}},
        'rowCount': len(rows), 'missingCounts': {s: {p: sum(r[s][p] is None for r in rows) for p in ['co','no2','pm10']} for s in STATION_KEYS.values()},
        'limitations': ['Snapshot histórico, no lectura en vivo ni red vigente completa.', 'No hay PM2.5 en este archivo.', 'No se hace clasificación sanitaria ni comparación con guías OMS o límites legales.', 'Las ventanas móviles se superponen: sus medias no equivalen a promedios diarios independientes.', 'Conteo de presencia territorial no demuestra cobertura, exposición ni población beneficiada.']
    }
    dump('manifest.json', manifest)
    print(json.dumps({'rows':len(rows), 'stations':stations, 'communesWithStation':sum(bool(p['stations']) for p in presence), 'missing':manifest['missingCounts']}, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    prepare()
