// CDNs explainer: real geography (Natural Earth land dots), real-ish latencies, anchors from the spoken words.
import {random} from 'remotion';
import TL from './timeline.json';
import CAPS from './captions.json';
import WORLD from './worlddots.json';

export const FPS = 30;
export const S = TL;
export const COL = {
  bg: '#0a0e14',
  ink: '#e9eef5',
  dim: '#8b98a9',
  line: '#223044',
  req: '#39d0ff',
  ok: '#3ddc84',
  bad: '#ff4d5e',
  amber: '#ffb020',
  pink: '#ff6fb1',
  violet: '#a98bff',
};

export const word = (id: string, w: string, nth = 0) => {
  const l = CAPS.find((x) => x.id === id);
  const hits = l?.words.filter((x) => x.t.toLowerCase().startsWith(w.toLowerCase())) ?? [];
  if (!hits[nth]) throw new Error(`no word ${w} in ${id}`);
  return Math.round(hits[nth].s);
};

// ── map projection (equirectangular crop: Europe → Australia) ──
export const MAP = {x0: 60, y0: 600, w: 900};
export const mapH = (MAP.w * (WORLD.lat[0] - WORLD.lat[1])) / (WORLD.lon[1] - WORLD.lon[0]);
export const proj = (lon: number, lat: number) => ({
  x: MAP.x0 + ((lon - WORLD.lon[0]) / (WORLD.lon[1] - WORLD.lon[0])) * MAP.w,
  y: MAP.y0 + ((WORLD.lat[0] - lat) / (WORLD.lat[0] - WORLD.lat[1])) * mapH,
});
export const DOTS = WORLD.dots.map(([lon, lat]) => proj(lon, lat));

export const ORIGIN = {name: 'London', ...proj(-0.13, 51.5)};
export const EDGES = [
  {name: 'Frankfurt', lon: 8.7, lat: 50.1},
  {name: 'Dubai', lon: 55.3, lat: 25.2},
  {name: 'Mumbai', lon: 72.9, lat: 19.1},
  {name: 'Johannesburg', lon: 28.0, lat: -26.2},
  {name: 'Singapore', lon: 103.8, lat: 1.35},
  {name: 'Hong Kong', lon: 114.2, lat: 22.3},
  {name: 'Tokyo', lon: 139.7, lat: 35.7},
  {name: 'Sydney', lon: 151.2, lat: -33.9},
].map((e) => ({...e, ...proj(e.lon, e.lat)}));
export const edge = (name: string) => EDGES.find((e) => e.name === name)!;
export const SYDNEY_USER = {...proj(151.2, -33.9), x: proj(151.2, -33.9).x - 40, y: proj(151.2, -33.9).y + 46};
export const TOKYO = edge('Tokyo');

// real-world figures
export const RTT_ORIGIN_MS = 260; // Sydney ↔ London round trip, typical
export const RTT_EDGE_MS = 10; // Sydney ↔ a Sydney edge
export const TRIPS_PER_PAGE = 4; // TCP + TLS + HTML + assets, roughly

// ── anchors ──
export const A = {
  london: word('distance', 'london'),
  everyTrip: word('distance', 'every'),
  several: word('distance', 'several'),
  copies: word('fix', 'copies'),
  world: word('fix', 'world'),
  sydney2: word('fix', 'sydney', 1),
  first: word('edge', 'first'),
  fetches: word('edge', 'fetches'),
  keeps: word('edge', 'keeps'),
  everyone: word('edge', 'everyone'),
  heavy: word('offload', 'heavy'),
  spikes: word('offload', 'spikes'),
  changed: word('purge', 'changed'),
  purge: word('purge', 'purge'),
  rename: word('purge', 'new'),
};

// the slow round trip used in the hook and distance scenes (visual slow-motion; the label carries the real time)
export const TRIP = 46; // frames for one round trip on screen
/** spikes: users appear all over the map and go to their nearest edge */
export const SPIKE_USERS = Array.from({length: 46}, (_, i) => {
  const d = DOTS[Math.floor(random(`su${i}`) * DOTS.length)];
  let best = EDGES[0];
  let bd = Infinity;
  for (const e of EDGES) {
    const dd = (e.x - d.x) ** 2 + (e.y - d.y) ** 2;
    if (dd < bd) {
      bd = dd;
      best = e;
    }
  }
  return {x: d.x, y: d.y, edge: best, at: Math.floor(random(`sa${i}`) * 50)};
});
