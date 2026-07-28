export interface Sector {
  id: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  status: 'pendiente' | 'buscando' | 'revisado';
  sector_type?: 'street' | 'grid' | 'block';
  nodes?: [number, number][];
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
  if (sectorType === 'block') {
    return { fillColor: color, weight: 2, opacity: 0.8, color: '#fff', fillOpacity: 0.25, dashArray: undefined };
  }
  if (sectorType === 'street') {
    return { fillColor: undefined, weight: 4, opacity: 0.9, color, fillOpacity: 0 };
  }
  return { fillColor: color, weight: 1, opacity: 0.7, color, fillOpacity: 0.3 };
}
