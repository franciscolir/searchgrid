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
  sector_letter?: string;
  sector_color?: string;
}

const NUM_COLORS = [
  '#e6194b', '#f58231', '#ffe119', '#4363d8', '#911eb4',
  '#42d4f4', '#f032e6', '#bfef45', '#9A6324', '#800000',
  '#000075', '#a9a9a9', '#e6beff', '#808000', '#ffd8b1',
  '#d9ead3', '#a2c4c9', '#fabed4', '#3cb44b', '#469990',
]

const LET_COLORS = [
  '#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac',
  '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
  '#166534', '#14532d', '#bbf7d0', '#dcfce7', '#2dd4bf',
  '#14b8a6', '#0d9488', '#5eead4', '#99f6e4', '#ccfbf1',
]

export function assignSectorColors(sectors: Sector[]): Sector[] {
  let numIdx = 0, letIdx = 0, letterCode = 65
  return sectors.map(s => {
    if (s.sector_type === 'grid' || s.id.startsWith('grid') || s.id.startsWith('zone') && s.sector_type !== 'block') {
      const l = String.fromCharCode(letterCode++)
      return { ...s, sector_letter: l, sector_color: LET_COLORS[(letIdx++) % LET_COLORS.length] }
    }
    return { ...s, sector_number: ++numIdx, sector_color: NUM_COLORS[(numIdx - 1) % NUM_COLORS.length] }
  })
}

export function getSectorStyle(sector: Sector) {
  const base = sector.sector_color || '#94a3b8'
  if (sector.status === 'revisado') return { fillColor: base, weight: 2, opacity: 0.9, color: '#fff', fillOpacity: 0.5 }
  if (sector.status === 'buscando') return { fillColor: base, weight: 2, opacity: 0.9, color: '#fff', fillOpacity: 0.35 }
  return { fillColor: base, weight: 1, opacity: 0.7, color: base, fillOpacity: 0.2 }
}

export function getSectorLabelStyle(sector: Sector) {
  const bg = sector.sector_color || '#94a3b8'
  const label = sector.sector_letter || sector.sector_number || ''
  const size = sector.sector_letter ? 24 : 22
  return {
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${sector.sector_letter ? 13 : 11}px;font-weight:bold;border:2px solid rgba(255,255,255,0.8);box-shadow:0 1px 3px rgba(0,0,0,0.3)">${label}</div>`,
    className: '',
    iconSize: [size, size] as [number, number],
    iconAnchor: [size / 2, size / 2] as [number, number],
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
