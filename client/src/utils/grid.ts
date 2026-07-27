export interface Sector {
  id: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  status: 'pendiente' | 'buscando' | 'revisado';
  sector_type?: 'street' | 'grid';
  searched_by?: string;
  timestamp?: string;
}

export function pointInPolygon([lat, lng]: [number, number], polygon: [number, number][]): boolean {
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

export function getStatusColor(status: string): string {
  switch (status) {
    case 'revisado': return '#22c55e';
    case 'buscando': return '#eab308';
    default: return '#94a3b8';
  }
}

export function getSectorStyle(status: string, sectorType = 'grid') {
  const color = getStatusColor(status);
  return {
    fillColor: color,
    weight: sectorType === 'street' ? 2 : 1,
    opacity: 0.8,
    color: sectorType === 'street' ? '#fff' : color,
    fillOpacity: sectorType === 'street' ? 0.4 : 0.3,
    dashArray: sectorType === 'street' ? '4,4' : undefined,
  };
}
