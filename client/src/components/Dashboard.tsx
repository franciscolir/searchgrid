import { useEffect, useState, useCallback } from 'preact/hooks';
import MapView from './MapView';
import CreateWizard from './CreateWizard';
import { connect, joinMission, leaveMission, disconnect } from '../services/socket';
import { Sector, assignSectorColors, getSectorAtPoint } from '../utils/grid';
import { getRegionById, getCommuneCoords } from '../data/chile';

const API = '/api';

interface Mission { id: string; title: string; description: string; polygon: [number, number][]; status: string; created_at: string; }
interface Searcher { id: string; name: string; color: string; lat?: number; lng?: number; }

export default function Dashboard({ id }: { id?: string }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionId, setMissionId] = useState<string>(id || '');
  const [mission, setMission] = useState<any>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [searchers, setSearchers] = useState<Searcher[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ total: 0, pendiente: 0, buscando: 0, revisado: 0 });
  const [sectorCounts, setSectorCounts] = useState<{ [sectorId: string]: number }>({});
  const [creating, setCreating] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [drawMode, setDrawMode] = useState<'polygon' | 'zone_poblado' | 'zone_verde' | null>(null);
  const [editingPoly, setEditingPoly] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.4489, -70.6693]);
  const [mainPolygon, setMainPolygon] = useState<[number, number][]>([]);
  const [editablePolygon, setEditablePolygon] = useState<[number, number][]>([]);
  const [zones, setZones] = useState<{ polygon: [number, number][]; type: 'poblado' | 'verde' }[]>([]);
  const [wizardStep, setWizardStep] = useState(0);

  useEffect(() => {
    fetch(`${API}/missions`).then(r => r.json()).then(setMissions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!missionId) return;
    const s = connect();
    joinMission(missionId);
    s.on('searcher:joined', (se: Searcher) => setSearchers(prev => [...prev.filter(x => x.id !== se.id), se]));
    s.on('location:updated', ({ searcherId, lat, lng }: any) =>
      setSearchers(prev => prev.map(x => x.id === searcherId ? { ...x, lat, lng } : x)));
    s.on('sector:updated', ({ sectorId, status, searchedBy, timestamp }: any) =>
      setSectors(prev => prev.map(x => x.id === sectorId ? { ...x, status, searched_by: searchedBy, timestamp } : x)));
    loadMission();
    return () => { s.off('searcher:joined'); s.off('location:updated'); s.off('sector:updated'); leaveMission(missionId); };
  }, [missionId]);

  function loadMission() {
    fetch(`${API}/missions/${missionId}`).then(r => r.json()).then(data => {
      setMission(data);
      setShareUrl(`${window.location.origin}/searcher/${missionId}`);
      const parsed = data.sectors.map((s: any) => ({ ...s, bounds: JSON.parse(s.bounds), center: JSON.parse(s.center) }));
      setSectors(assignSectorColors(parsed));
      setSearchers(data.searchers);
    }).catch(() => {});
  }

  useEffect(() => {
    const total = sectors.length;
    const pendiente = sectors.filter(s => s.status === 'pendiente').length;
    const buscando = sectors.filter(s => s.status === 'buscando').length;
    const revisado = sectors.filter(s => s.status === 'revisado').length;
    setStats({ total, pendiente, buscando, revisado });
    const counts: { [id: string]: number } = {};
    for (const sc of searchers) {
      if (sc.lat != null && sc.lng != null) {
        const sec = getSectorAtPoint(sectors, sc.lat, sc.lng);
        if (sec) counts[sec.id] = (counts[sec.id] || 0) + 1;
      }
    }
    setSectorCounts(counts);
  }, [sectors, searchers]);

  const handleWizardState = useCallback((state: {
    step: number, region?: string, commune?: string, editing?: boolean,
    drawPoints?: [number, number][], drawMode?: 'polygon' | 'zone_poblado' | 'zone_verde' | null,
    polygon?: [number, number][], zones?: { polygon: [number, number][]; type: 'poblado' | 'verde' }[]
  }) => {
    if (state.step !== undefined) setWizardStep(state.step);
    if (state.drawPoints !== undefined) setDrawPoints(state.drawPoints);
    if (state.drawMode !== undefined) { setDrawMode(state.drawMode); setEditingPoly(false); }
    if (state.editing !== undefined) setEditingPoly(state.editing);
    if (state.polygon !== undefined) { setMainPolygon(state.polygon); setEditablePolygon(state.polygon); }
    if (state.zones !== undefined) setZones(state.zones);
    if (state.region && state.commune) {
      const c = getCommuneCoords(state.region, state.commune);
      if (c) setMapCenter([c.lat, c.lng]);
    } else if (state.region) {
      const r = getRegionById(state.region);
      if (r) setMapCenter([r.lat, r.lng]);
    }
  }, []);

  async function handleWizardComplete(data: { title: string, polygon: [number, number][], zones: { polygon: [number, number][], type: 'poblado' | 'verde' }[] }) {
    const subZones = data.zones.map(z => ({ polygon: z.polygon, type: z.type === 'poblado' ? 'poblado' as const : 'verde' as const }));
    const body: any = { title: data.title, description: '', polygon: data.polygon, mode: 'urbano', subZones };
    const res = await fetch(`${API}/missions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const m = await res.json();
      setMissions(prev => [m, ...prev]);
      setCreating(false);
      setMissionId(m.id);
    }
  }

  function copyUrl() {
    const input = document.createElement('input');
    input.value = shareUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Unete a la busqueda: ${shareUrl}${mission?.keyword ? `\nClave: ${mission.keyword}` : ''}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  if (creating) {
    return (
      <div class="dashboard-creating">
        <div class="map-area">
          <MapView center={mapCenter} zoom={13} interactive={true}
            drawMode={!!drawMode && !editingPoly} drawPoints={editingPoly ? [] : drawPoints}
            onDrawPoint={(pt) => setDrawPoints(prev => [...prev, pt])}
            mainPolygon={wizardStep >= 2 ? mainPolygon : undefined}
            mainPolygonColor="#1e3a5f"
            editing={editingPoly}
            editablePolygon={editingPoly && mainPolygon.length >= 3 ? mainPolygon : drawMode === 'polygon' && drawPoints.length >= 3 && !editingPoly ? drawPoints : undefined}
            onPolygonEdit={(pts) => { setMainPolygon(pts); setDrawPoints(pts); setEditablePolygon(pts); }}
            subZonesOverlay={zones.map(z => ({ polygon: z.polygon, type: z.type }))} />
        </div>
        <div class="wizard-area">
          <CreateWizard onComplete={handleWizardComplete} onCancel={() => setCreating(false)}
            drawPoints={drawPoints} drawMode={drawMode}
            onStartDraw={(mode, clear) => { setDrawMode(mode); if (clear) setDrawPoints([]); }}
            onFinishDraw={() => { setDrawPoints([]); setDrawMode(null); }}
            onClearDraw={() => setDrawPoints([])}
            onStateChange={handleWizardState} />
        </div>
      </div>
    );
  }

  if (!missionId) {
    return (
      <div class="container">
        <h1>Dashboard</h1>
        <a href="/" class="back-link">&larr; Inicio</a>
        <button class="btn btn-primary" onClick={() => setCreating(true)}>+ Nueva busqueda</button>
        <div class="card" style="margin-top:1rem">
          <h2>Misiones Activas</h2>
          {missions.length === 0 && <p class="muted">No hay misiones activas</p>}
          {missions.map(m => (
            <div key={m.id} class="mission-item" onClick={() => { setMissionId(m.id); }}>
              <strong>{m.title}</strong>
              <span class="badge" style={(m as any).mode === 'urbano' ? 'background:#3b82f6' : 'background:#16a34a'}>{(m as any).mode === 'urbano' ? 'Urbano' : 'Bosque'}</span>
              <br /><small class="muted">{new Date(m.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div class="container">
      <h1>{mission?.title || 'Cargando...'}</h1>
      <button class="btn btn-sm" onClick={() => { setMissionId(''); disconnect(); setShareUrl(''); }}>&larr; Volver</button>
      {shareUrl && (
        <div class="card share-card" style="margin-top:0.5rem">
          <h2>Compartir busqueda</h2>
          <p class="share-url">{shareUrl}</p>
          <div class="share-actions">
            <button class="btn btn-sm btn-primary" onClick={copyUrl}>{copied ? 'Copiado!' : 'Copiar enlace'}</button>
            <button class="btn btn-sm btn-secondary" onClick={shareWhatsApp}>Compartir WhatsApp</button>
          </div>
        </div>
      )}
      {mission?.mode && <p class="muted" style="margin-bottom:0.5rem">Modo: <strong>{mission.mode === 'urbano' ? 'Urbano' : 'Bosque'}</strong> {mission.zone_count > 0 && `| ${mission.zone_count} sectores`}</p>}
      <div class="stats-bar">
        <span>Total: <strong>{stats.total}</strong></span>
        <span class="stat-pendiente">Pendiente: <strong>{stats.pendiente}</strong></span>
        <span class="stat-buscando">Buscando: <strong>{stats.buscando}</strong></span>
        <span class="stat-revisado">Revisado: <strong>{stats.revisado}</strong></span>
        <span>Progreso: <strong>{stats.total > 0 ? Math.round((stats.revisado / stats.total) * 100) : 0}%</strong></span>
      </div>
      <div class="searcher-list">
        {searchers.map(s => (
          <span key={s.id} class="searcher-chip" style={{ borderColor: s.color }}>
            <span class="dot" style={{ background: s.color }} />{s.name}
          </span>
        ))}
      </div>
      <div class="mission-map-area">
        <div class="map-container" style={{ flex: 1, border: '2px solid #1e3a5f', borderRadius: '8px', overflow: 'hidden' }}>
          <MapView polygon={mission?.polygon} sectors={sectors} searchers={searchers.filter(s => s.lat)} subZonesOverlay={mission?.sub_zones} />
        </div>
        <div class="sector-card">
          <h3>Sectores</h3>
          <div class="sector-list">
            {sectors.map(s => (
              <div key={s.id} class="sector-item">
                <span class="sector-dot" style={{ background: s.sector_color || '#94a3b8' }}></span>
                <span class="sector-num">#{s.sector_number}</span>
                <span class="sector-status">{s.status}</span>
                <span class="sector-searchers">{sectorCounts[s.id] || 0} busc.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}