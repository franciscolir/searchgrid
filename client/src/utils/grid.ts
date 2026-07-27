export interface Sector {
  id: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  status: 'pendiente' | 'buscando' | 'revisado';
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

export function polygonToSectors(
  polygon: [number, number][],
  cellSizeDeg = 0.001
): Sector[] {
  const lats = polygon.map(p => p[0]);
  const lngs = polygon.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const sectors: Sector[] = [];
  for (let lat = minLat; lat < maxLat; lat += cellSizeDeg) {
    for (let lng = minLng; lng < maxLng; lng += cellSizeDeg) {
      const centerLat = +(lat + cellSizeDeg / 2).toFixed(6);
      const centerLng = +(lng + cellSizeDeg / 2).toFixed(6);
      if (pointInPolygon([centerLat, centerLng], polygon)) {
        const row = Math.round((lat - minLat) / cellSizeDeg);
        const col = Math.round((lng - minLng) / cellSizeDeg);
        sectors.push({
          id: `${row}-${col}`,
          bounds: [[lat, lng], [lat + cellSizeDeg, lng + cellSizeDeg]],
          center: [centerLat, centerLng],
          status: 'pendiente',
        });
      }
    }
  }
  return sectors;
}

const STATUS_ORDER = { pendiente: 0, buscando: 1, revisado: 2 } as const;

export function getStatusColor(status: string): string {
  switch (status) {
    case 'revisado': return '#22c55e';
    case 'buscando': return '#eab308';
    default: return '#94a3b8';
  }
}

export function getSectorStyle(status: string) {
  return {
    fillColor: getStatusColor(status),
    weight: 1,
    opacity: 0.7,
    color: getStatusColor(status),
    fillOpacity: 0.3,
  };
}
