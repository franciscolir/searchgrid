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
  subZonesOverlay?: { polygon: [number, number][]; type: 'verde' | 'poblado' }[];
  mainPolygon?: [number, number][];
  editablePolygon?: [number, number][];
  onPolygonEdit?: (pts: [number, number][]) => void;
  mainPolygonColor?: string;
  editing?: boolean;
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

  const drawModeRef = useRef(props.drawMode);
  drawModeRef.current = props.drawMode;
  const onDrawPointRef = useRef(props.onDrawPoint);
  onDrawPointRef.current = props.onDrawPoint;
  const onSectorClickRef = useRef(props.onSectorClick);
  onSectorClickRef.current = props.onSectorClick;
  const sectorsRef = useRef(props.sectors);
  sectorsRef.current = props.sectors;

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
    subZoneLayer.current.addTo(map);
    if (props.interactive !== false) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (drawModeRef.current) {
          onDrawPointRef.current?.([e.latlng.lat, e.latlng.lng]);
        } else if (onSectorClickRef.current) {
          const pt = e.latlng;
          let closest: string | null = null;
          let minDist = Infinity;
          for (const s of sectorsRef.current || []) {
            const d = map.distance(pt, L.latLng(s.center[0], s.center[1]));
            if (d < minDist) { minDist = d; closest = s.id; }
          }
          if (closest && minDist < 200) onSectorClickRef.current(closest);
        }
      });
    }
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (mapRef.current && props.center)
      mapRef.current.setView(props.center, props.zoom || 13, { animate: true, duration: 0.5 });
  }, [props.center?.join(',')]);

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

  const mainPolyLayer = useRef<L.Polygon | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (mainPolyLayer.current) { map.removeLayer(mainPolyLayer.current); mainPolyLayer.current = null; }
    if (props.mainPolygon && props.mainPolygon.length >= 3) {
      mainPolyLayer.current = L.polygon(props.mainPolygon as any, {
        color: props.mainPolygonColor || '#1e3a5f', weight: 3, fillOpacity: 0.05, dashArray: '8,4',
      }).addTo(map);
    }
  }, [props.mainPolygon, props.mainPolygonColor]);

  const editMarkersRef = useRef<L.Marker[]>([]);
  const editPolyRef = useRef<L.Polygon | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    editMarkersRef.current.forEach(m => map.removeLayer(m));
    if (editPolyRef.current) { map.removeLayer(editPolyRef.current); editPolyRef.current = null; }
    editMarkersRef.current = [];
    if (props.editablePolygon && props.editablePolygon.length >= 3) {
      editPolyRef.current = L.polygon(props.editablePolygon as any, {
        color: '#3b82f6', weight: 2, fillOpacity: 0.1,
      }).addTo(map);
      const circleIcon = L.divIcon({
        className: '',
        html: '<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;cursor:grab;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      const currentPts = [...props.editablePolygon];
      props.editablePolygon.forEach((pt, i) => {
        const m = L.marker(pt as any, { icon: circleIcon, draggable: true }).addTo(map);
        m.on('dragstart', () => { if (mapRef.current) mapRef.current.dragging.disable(); });
        m.on('drag', () => {
          const pos = m.getLatLng();
          currentPts[i] = [pos.lat, pos.lng];
          if (editPolyRef.current) editPolyRef.current.setLatLngs(currentPts as any);
        });
        m.on('dragend', () => {
          if (mapRef.current) mapRef.current.dragging.enable();
          props.onPolygonEdit?.(currentPts.map(p => [p[0], p[1]] as [number, number]));
        });
        editMarkersRef.current.push(m);
      });
    }
  }, [props.editablePolygon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getContainer();
    c.style.cursor = '';
    c.onmouseenter = () => { if (props.drawMode && !props.editing) c.style.cursor = 'crosshair'; };
    c.onmouseleave = () => { c.style.cursor = ''; };
    return () => { c.onmouseenter = null; c.onmouseleave = null; };
  }, [props.editing, props.drawMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    sectorLayer.current.clearLayers();
    sectorMap.current.clear();
    for (const s of props.sectors || []) {
      const style = getSectorStyle(s.status, s.sector_type);
      const layer = s.sector_type === 'block' && s.nodes && s.nodes.length >= 3
        ? L.polygon(s.nodes as any, { ...style, interactive: !!props.onSectorClick })
        : s.sector_type === 'street' && s.nodes && s.nodes.length >= 2
        ? L.polyline(s.nodes as any, { ...style, interactive: !!props.onSectorClick })
        : L.rectangle(s.bounds as any, { ...style, interactive: !!props.onSectorClick });
      if (s.searched_by) {
        layer.bindTooltip(`${s.status} por ${s.searched_by}`, { sticky: true });
      }
      sectorLayer.current.addLayer(layer);
      sectorMap.current.set(s.id, layer as any);
    }
  }, [props.sectors, props.onSectorClick]);

  const subZoneLayer = useRef<L.LayerGroup>(L.layerGroup());
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    subZoneLayer.current.clearLayers();
    for (const z of props.subZonesOverlay || []) {
      const c = z.type === 'verde' ? '#22c55e' : '#eab308';
      L.polygon(z.polygon as any, { color: c, weight: 2, fillColor: c, fillOpacity: 0.15, dashArray: '6,4' }).addTo(subZoneLayer.current);
    }
    subZoneLayer.current.addTo(map);
  }, [props.subZonesOverlay]);

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
