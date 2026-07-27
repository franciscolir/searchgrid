import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Sector, getSectorStyle } from '../utils/grid';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  polygon?: [number, number][];
  sectors?: Sector[];
  searchers?: { id: string; name: string; color: string; lat?: number; lng?: number }[];
  drawMode?: boolean;
  onDrawPoint?: (pt: [number, number]) => void;
  onFinishDraw?: () => void;
  drawPoints?: [number, number][];
  onSectorClick?: (sectorId: string) => void;
  currentLocation?: [number, number];
  height?: string;
  interactive?: boolean;
}

export default function MapView(props: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonLayer = useRef<L.Polygon | null>(null);
  const drawPolygonLayer = useRef<L.Polygon | null>(null);
  const drawMarkers = useRef<L.CircleMarker[]>([]);
  const sectorLayer = useRef<L.LayerGroup>(L.layerGroup());
  const searcherLayer = useRef<L.LayerGroup>(L.layerGroup());
  const locationMarker = useRef<L.CircleMarker | null>(null);
  const sectorMap = useRef<Map<string, L.Rectangle>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: props.center || [-33.4489, -70.6693],
      zoom: props.zoom || 13,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
    sectorLayer.current.addTo(map);
    searcherLayer.current.addTo(map);
    if (props.interactive !== false) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (props.drawMode) {
          props.onDrawPoint?.([e.latlng.lat, e.latlng.lng]);
        } else if (props.onSectorClick) {
          const pt = e.latlng;
          let closest: string | null = null;
          let minDist = Infinity;
          for (const s of props.sectors || []) {
            const d = map.distance(pt, L.latLng(s.center[0], s.center[1]));
            if (d < minDist) { minDist = d; closest = s.id; }
          }
          if (closest && minDist < 200) props.onSectorClick(closest);
        }
      });
    }
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (props.polygon) {
      if (polygonLayer.current) map.removeLayer(polygonLayer.current);
      polygonLayer.current = L.polygon(props.polygon as any, {
        color: '#1e3a5f', weight: 3, fillOpacity: 0.05,
      }).addTo(map);
      map.fitBounds(polygonLayer.current.getBounds().pad(0.1));
    } else if (polygonLayer.current) {
      map.removeLayer(polygonLayer.current);
      polygonLayer.current = null;
    }
  }, [props.polygon]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (props.drawPoints && props.drawPoints.length > 0) {
      if (drawPolygonLayer.current) map.removeLayer(drawPolygonLayer.current);
      drawPolygonLayer.current = L.polygon(props.drawPoints as any, {
        color: '#ef4444', weight: 2, fillOpacity: 0.1, dashArray: '5,10',
      }).addTo(map);

      drawMarkers.current.forEach(m => map.removeLayer(m));
      drawMarkers.current = props.drawPoints.map(p =>
        L.circleMarker(p as any, { radius: 6, color: '#ef4444', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(map)
      );
    }
  }, [props.drawPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    sectorLayer.current.clearLayers();
    sectorMap.current.clear();
    for (const s of props.sectors || []) {
      const style = getSectorStyle(s.status);
      const rect = L.rectangle(s.bounds as any, {
        ...style,
        interactive: !!props.onSectorClick,
      });
      if (s.searched_by) {
        rect.bindTooltip(`${s.status} por ${s.searched_by}`, { sticky: true });
      }
      sectorLayer.current.addLayer(rect);
      sectorMap.current.set(s.id, rect);
    }
  }, [props.sectors, props.onSectorClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    searcherLayer.current.clearLayers();
    for (const s of (props.searchers || []).filter(s => s.lat != null && s.lng != null)) {
      const m = L.circleMarker([s.lat!, s.lng!], {
        radius: 8, color: '#fff', weight: 2, fillColor: s.color, fillOpacity: 1,
      });
      m.bindTooltip(s.name, { permanent: true, direction: 'top', offset: L.point(0, -10) });
      searcherLayer.current.addLayer(m);
    }
  }, [props.searchers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (props.currentLocation) {
      if (locationMarker.current) map.removeLayer(locationMarker.current);
      locationMarker.current = L.circleMarker(props.currentLocation as any, {
        radius: 10, color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.4, weight: 3,
      }).addTo(map);
    }
  }, [props.currentLocation]);

  return <div ref={containerRef} style={{ width: '100%', height: props.height || '100%', minHeight: '300px' }} />;
}
