export interface Sector {
  id: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  status: 'pendiente' | 'buscando' | 'revisado';
  sector_type?: 'street' | 'grid' | 'block';
  nodes?: [number, number][];
  searched_by?: string;
  timestamp?: string;
  sector_number?: number;
  sector_color?: string;
}

const COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9',
  '#e6beff', '#9A9A9A', '#f4cccc', '#d9ead3', '#cfe2f3',
  '#fff2cc', '#d9d9e9', '#ead1dc', '#b6d7a8', '#a2c4c9',
]

export function assignSectorColors(sectors: Sector[]): Sector[] {
  return sectors.map((s, i) => ({
    ...s,
    sector_number: i + 1,
    sector_color: COLORS[i % COLORS.length],
  }))
}

export function getSectorStyle(sector: Sector) {
  const base = sector.sector_color || '#94a3b8'
  if (sector.status === 'revisado') return { fillColor: base, weight: 2, opacity: 0.9, color: '#fff', fillOpacity: 0.5 }
  if (sector.status === 'buscando') return { fillColor: base, weight: 2, opacity: 0.9, color: '#fff', fillOpacity: 0.35 }
  return { fillColor: base, weight: 1, opacity: 0.7, color: base, fillOpacity: 0.2 }
}

export function getSectorLabelStyle(sector: Sector) {
  const bg = sector.sector_color || '#94a3b8'
  return {
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid rgba(255,255,255,0.8);box-shadow:0 1px 3px rgba(0,0,0,0.3)">${sector.sector_number || ''}</div>`,
    className: '',
    iconSize: [22, 22] as [number, number],
    iconAnchor: [11, 11] as [number, number],
  }
}

export function pointInPolygon([lat, lng]: [number, number], polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i]
    const [lat2, lng2] = polygon[j]
    if ((lng1 > lng) !== (lng2 > lng) && lat < ((lat2 - lat1) * (lng - lng1)) / (lng2 - lng1) + lat1) inside = !inside
  }
  return inside
}

export function getSectorAtPoint(sectors: Sector[], lat: number, lng: number): Sector | null {
  for (const s of sectors) {
    if (s.nodes && s.nodes.length >= 3) {
      if (pointInPolygon([lat, lng], s.nodes)) return s
    } else {
      const [b1, b2] = s.bounds
      if (lat >= b1[0] && lat <= b2[0] && lng >= b1[1] && lng <= b2[1]) return s
    }
  }
  return null
}
