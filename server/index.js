const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function pointInPolygon(point, polygon) {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];
    if ((lng1 > lng) !== (lng2 > lng) && lat < ((lat2 - lat1) * (lng - lng1)) / (lng2 - lng1) + lat1) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonToSectors(polygon, mode = 'bosque', subZones = []) {
  const cellSize = mode === 'urbano' ? 0.002 : 0.001;
  const lats = polygon.map(p => p[0]);
  const lngs = polygon.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  function getSectorType(center) {
    for (const z of subZones) {
      if (pointInPolygon(center, z.polygon)) return z.type === 'verde' ? 'grid' : 'street';
    }
    return mode === 'urbano' ? 'street' : 'grid';
  }

  const sectors = [];
  for (let lat = minLat; lat < maxLat; lat += cellSize) {
    for (let lng = minLng; lng < maxLng; lng += cellSize) {
      const centerLat = +(lat + cellSize / 2).toFixed(6);
      const centerLng = +(lng + cellSize / 2).toFixed(6);
      if (pointInPolygon([centerLat, centerLng], polygon)) {
        const row = Math.round((lat - minLat) / cellSize);
        const col = Math.round((lng - minLng) / cellSize);
        const type = getSectorType([centerLat, centerLng]);
        sectors.push({
          id: `${type}-${row}-${col}`,
          bounds: JSON.stringify([[lat, lng], [lat + cellSize, lng + cellSize]]),
          center: JSON.stringify([centerLat, centerLng]),
          sector_type: type,
        });
      }
    }
  }
  return sectors;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hashPolygon(polygon) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(JSON.stringify(polygon)).digest('hex');
}

async function fetchStreets(polygon) {
  try {
    const lats = polygon.map(p => p[0]);
    const lngs = polygon.map(p => p[1]);
    const south = Math.min(...lats), north = Math.max(...lats);
    const west = Math.min(...lngs), east = Math.max(...lngs);
    const query = `[out:json];way["highway"](${south},${west},${north},${east});out geom 500;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'User-Agent': 'SearchGrid/1.0' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(40000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes('"elements"')) return null;
    return JSON.parse(text);
  } catch { return null; }
}

function processStreets(osmData) {
  const segments = [];
  let segId = 0;
  for (const el of osmData.elements || []) {
    if (el.type !== 'way') continue;
    const pts = el.geometry ? el.geometry.map(g => [g.lat, g.lon]) : null;
    if (!pts || pts.length < 2) continue;
    let current = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      current.push(pts[i]);
      const dist = haversine(current[0][0], current[0][1], pts[i][0], pts[i][1]);
      if (dist >= 80 || i === pts.length - 1) {
        const first = current[0];
        const last = current[current.length - 1];
        const mid = [(first[0] + last[0]) / 2, (first[1] + last[1]) / 2];
        segments.push({
          id: `street-${segId++}`,
          bounds: JSON.stringify([first, last]),
          center: JSON.stringify(mid),
          sector_type: 'street',
          nodes: JSON.stringify(current),
        });
        current = [pts[i]];
      }
    }
  }
  return segments;
}

app.get('/api/missions', (req, res) => {
  const missions = db.prepare('SELECT * FROM missions ORDER BY created_at DESC').all();
  res.json(missions.map(m => ({
    id: m.id, title: m.title, description: m.description,
    polygon: JSON.parse(m.polygon), status: m.status,
    has_keyword: !!m.require_keyword, mode: m.mode, created_at: m.created_at
  })));
});

app.get('/api/missions/:id', (req, res) => {
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(req.params.id);
  if (!mission) return res.status(404).json({ error: 'Mission not found' });
  mission.polygon = JSON.parse(mission.polygon);
  const searchers = db.prepare('SELECT * FROM searchers WHERE mission_id = ?').all(mission.id);
  const sectors = db.prepare('SELECT * FROM sectors WHERE mission_id = ?').all(mission.id);
  const { id, title, description, polygon, cell_size, status, created_at } = mission;
  res.json({ id, title, description, polygon, cell_size, status, created_at, mode: mission.mode,
    sub_zones: JSON.parse(mission.sub_zones || '[]'),
    has_keyword: !!mission.require_keyword, searchers,
    sectors: sectors.map(s => ({ ...s, nodes: s.nodes ? JSON.parse(s.nodes) : undefined })) });
});

app.post('/api/missions', async (req, res) => {
  const { title, description, polygon, keyword, requireKeyword, mode = 'bosque', subZones = [] } = req.body;
  const id = uuidv4();
  const rk = requireKeyword && keyword ? 1 : 0;
  const sz = JSON.stringify(subZones);
  db.prepare('INSERT INTO missions (id, title, description, polygon, cell_size, status, keyword, require_keyword, mode, sub_zones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, title, description || '', JSON.stringify(polygon), mode === 'urbano' ? 0.002 : 0.001, 'active', rk ? keyword : null, rk, mode, sz);

  let sectors;
  let streetCount = 0;
  if (mode === 'urbano') {
    const hash = hashPolygon(polygon);
    const cached = db.prepare('SELECT data FROM osm_cache WHERE poly_hash = ?').get(hash);
    let osmData = cached ? JSON.parse(cached.data) : null;
    if (!osmData) {
      try { osmData = await fetchStreets(polygon); } catch (e) {}
      if (osmData) db.prepare('INSERT OR REPLACE INTO osm_cache (poly_hash, data) VALUES (?, ?)').run(hash, JSON.stringify(osmData));
    }
    if (osmData) {
      sectors = processStreets(osmData);
      streetCount = sectors.length;
    }
    if (!sectors || sectors.length === 0) {
      sectors = polygonToSectors(polygon, mode, subZones);
    }
  } else {
    sectors = polygonToSectors(polygon, mode, subZones);
  }

  const insertSector = db.prepare('INSERT OR IGNORE INTO sectors (id, mission_id, bounds, center, status, sector_type, nodes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const txn = db.transaction(() => {
    for (const s of sectors) {
      insertSector.run(s.id, id, s.bounds, s.center, 'pendiente', s.sector_type, s.nodes || null);
    }
  });
  txn();

  const m = db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
  m.polygon = JSON.parse(m.polygon);
  const resBody = { id: m.id, title: m.title, description: m.description, polygon: m.polygon,
    cell_size: m.cell_size, status: m.status, created_at: m.created_at, mode: m.mode,
    sub_zones: JSON.parse(m.sub_zones || '[]'), street_count: streetCount,
    has_keyword: !!m.require_keyword, keyword: rk ? keyword : undefined };
  io.emit('mission:created', resBody);
  res.json(resBody);
});

app.post('/api/missions/:id/join', (req, res) => {
  const { name, keyword } = req.body;
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(req.params.id);
  if (!mission) return res.status(404).json({ error: 'Mision no encontrada' });
  if (mission.require_keyword && keyword !== mission.keyword)
    return res.status(403).json({ error: 'Palabra clave incorrecta' });
  const id = uuidv4();
  const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#a855f7', '#06b6d4', '#f97316'];
  const usedColors = db.prepare('SELECT color FROM searchers WHERE mission_id = ?').all(mission.id).map(s => s.color);
  const color = colors.find(c => !usedColors.includes(c)) || '#e63946';
  db.prepare('INSERT INTO searchers (id, mission_id, name, color) VALUES (?, ?, ?, ?)').run(id, mission.id, name, color);
  const searcher = db.prepare('SELECT * FROM searchers WHERE id = ?').get(id);
  io.to(`mission:${mission.id}`).emit('searcher:joined', searcher);
  res.json(searcher);
});

app.get('/api/missions/:id/info', (req, res) => {
  const m = db.prepare('SELECT id, title, description, require_keyword, status FROM missions WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Mision no encontrada' });
  res.json({ id: m.id, title: m.title, description: m.description, has_keyword: !!m.require_keyword, mode: m.mode, status: m.status });
});

app.get('/api/missions/:id/state', (req, res) => {
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(req.params.id);
  if (!mission) return res.status(404).json({ error: 'Mission not found' });
  mission.polygon = JSON.parse(mission.polygon);
  const searchers = db.prepare('SELECT * FROM searchers WHERE mission_id = ?').all(mission.id);
  const sectors = db.prepare('SELECT * FROM sectors WHERE mission_id = ?').all(mission.id);
  const { id, title, description, polygon, cell_size, status, created_at } = mission;
  res.json({ mission: { id, title, description, polygon, cell_size, status, created_at,
    mode: mission.mode, sub_zones: JSON.parse(mission.sub_zones || '[]'),
    has_keyword: !!mission.require_keyword },
    searchers, sectors: sectors.map(s => ({ ...s, bounds: JSON.parse(s.bounds), center: JSON.parse(s.center), nodes: s.nodes ? JSON.parse(s.nodes) : undefined })) });
});

app.post('/api/sync', (req, res) => {
  const { deviceId, missionId, operations } = req.body;
  const results = [];
  for (const op of operations) {
    try {
      if (op.type === 'location') {
        db.prepare('INSERT INTO location_updates (searcher_id, lat, lng, timestamp) VALUES (?, ?, ?, ?)').run(deviceId, op.lat, op.lng, op.timestamp);
        io.to(`mission:${missionId}`).emit('location:updated', { searcherId: deviceId, lat: op.lat, lng: op.lng, timestamp: op.timestamp });
        results.push({ ok: true, op });
      } else if (op.type === 'sector') {
        db.prepare('UPDATE sectors SET status = ?, searched_by = ?, timestamp = ? WHERE id = ? AND mission_id = ?').run(op.status, deviceId, op.timestamp, op.sectorId, missionId);
        db.prepare('INSERT INTO searched_zones (searcher_id, mission_id, sector_id, timestamp) VALUES (?, ?, ?, ?)').run(deviceId, missionId, op.sectorId, op.timestamp);
        io.to(`mission:${missionId}`).emit('sector:updated', { searcherId: deviceId, sectorId: op.sectorId, status: op.status, timestamp: op.timestamp });
        results.push({ ok: true, op });
      }
    } catch (e) {
      results.push({ ok: false, op, error: e.message });
    }
  }
  res.json({ processed: results.length, results });
});

io.on('connection', (socket) => {
  socket.on('join:mission', (missionId) => {
    socket.join(`mission:${missionId}`);
  });
  socket.on('leave:mission', (missionId) => {
    socket.leave(`mission:${missionId}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
