import { useEffect, useState } from 'preact/hooks';
import MapView from './MapView';
import { connect, joinMission, leaveMission, disconnect } from '../services/socket';
import { Sector } from '../utils/grid';

const API = '/api';

interface Mission { id: string; title: string; description: string; polygon: [number, number][]; status: string; created_at: string; }
interface Searcher { id: string; name: string; color: string; lat?: number; lng?: number; }

export default function Dashboard({ id }: { id?: string }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionId, setMissionId] = useState<string>(id || '');
  const [mission, setMission] = useState<any>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [searchers, setSearchers] = useState<Searcher[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [useKeyword, setUseKeyword] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ total: 0, pendiente: 0, buscando: 0, revisado: 0 });
  const [mode, setMode] = useState<'urbano' | 'bosque'>('bosque');
  const [subZones, setSubZones] = useState<{ polygon: [number, number][]; type: 'verde' | 'poblado' }[]>([]);
  const [drawingSub, setDrawingSub] = useState(false);
  const [subPolygon, setSubPolygon] = useState<[number, number][]>([]);

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
      setSectors(data.sectors.map((s: any) => ({ ...s, bounds: JSON.parse(s.bounds), center: JSON.parse(s.center) })));
      setSearchers(data.searchers);
    }).catch(() => {});
  }

  useEffect(() => {
    const total = sectors.length;
    const pendiente = sectors.filter(s => s.status === 'pendiente').length;
    const buscando = sectors.filter(s => s.status === 'buscando').length;
    const revisado = sectors.filter(s => s.status === 'revisado').length;
    setStats({ total, pendiente, buscando, revisado });
  }, [sectors]);

  async function createMission() {
    if (!title || drawPoints.length < 3) return;
    const body: any = { title, description: desc, polygon: drawPoints, mode, subZones };
    if (useKeyword && keyword) { body.keyword = keyword; body.requireKeyword = true; }
    const res = await fetch(`${API}/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const m = await res.json();
      setMissions(prev => [m, ...prev]);
      const url = `${window.location.origin}/searcher/${m.id}`;
      setShareUrl(url);
      setKeyword(m.keyword || '');
      setTitle(''); setDesc(''); setDrawPoints([]); setSubZones([]); setSubPolygon([]);
      setCreating(false); setUseKeyword(false); setDrawingSub(false);
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

  if (!missionId) {
    return (
      <div class="container">
        <h1>Dashboard</h1>
        <a href="/" class="back-link">&larr; Inicio</a>
        <div class="card">
          <h2>Misiones Activas</h2>
          {missions.length === 0 && <p class="muted">No hay misiones activas</p>}
          {missions.map(m => (
            <div key={m.id} class="mission-item" onClick={() => { setMissionId(m.id); }}>
              <strong>{m.title}</strong> <span class={`badge ${m.status}`}>{m.status}</span>
              {(m as any).has_keyword && <span class="badge" style="background:#eab308">con clave</span>}
              <span class="badge" style={(m as any).mode === 'urbano' ? 'background:#3b82f6' : 'background:#16a34a'}>{(m as any).mode === 'urbano' ? 'Urbano' : 'Bosque'}</span>
              <br /><small class="muted">{new Date(m.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
        <div class="card">
          <h2>Crear Mision</h2>
          <input value={title} onInput={(e: any) => setTitle(e.target.value)} placeholder="Titulo de la busqueda" />
          <input value={desc} onInput={(e: any) => setDesc(e.target.value)} placeholder="Descripcion (opcional)" />
          <div class="toggle-tabs">
            <button class={`btn btn-sm ${mode === 'bosque' ? 'btn-active' : ''}`} onClick={() => setMode('bosque')}>Bosque / Parque</button>
            <button class={`btn btn-sm ${mode === 'urbano' ? 'btn-active' : ''}`} onClick={() => setMode('urbano')}>Urbano / Ciudad</button>
          </div>
          {mode === 'urbano' && <p class="hint" style="text-align:left;margin-bottom:0.5rem">Las calles se dividen en blocks. Marca zonas verdes (plazas, parques) por separado.</p>}
          {mode === 'bosque' && <p class="hint" style="text-align:left;margin-bottom:0.5rem">El area se divide en cuadricula de busqueda. Si hay zonas pobladas dentro, marcalas por separado.</p>}
          <label class="toggle-row">
            <input type="checkbox" checked={useKeyword} onChange={(e: any) => setUseKeyword(e.target.checked)} />
            <span>Proteger con palabra clave</span>
          </label>
          {useKeyword && <input value={keyword} onInput={(e: any) => setKeyword(e.target.value)} placeholder="Palabra clave para unirse" />}
          <button class="btn btn-primary" onClick={() => { setCreating(true); setDrawMode(true); }} disabled={drawMode}>
            {drawMode ? 'Dibujando poligono principal...' : 'Dibujar area de busqueda'}
          </button>
          {drawPoints.length >= 3 && drawMode && (
            <button class="btn btn-sm btn-secondary" onClick={() => setDrawMode(false)} style="margin-top:0.5rem">Finalizar dibujo</button>
          )}
          {drawPoints.length > 0 && !drawMode && (
            <div class="draw-info">
              <p>Poligono principal: {drawPoints.length} puntos.</p>
              {mode === 'urbano' && (
                <button class="btn btn-sm" onClick={() => { setDrawingSub(true); setSubPolygon([]); }}>
                  {subZones.length > 0 ? `+ Agregar zona verde (${subZones.length} ya marcadas)` : '+ Marcar zona verde (plaza/parque)'}
                </button>
              )}
              {mode === 'bosque' && (
                <button class="btn btn-sm" onClick={() => { setDrawingSub(true); setSubPolygon([]); }}>
                  {subZones.length > 0 ? `+ Agregar zona poblada (${subZones.length} ya marcadas)` : '+ Marcar zona poblada'}
                </button>
              )}
              <button class="btn btn-sm btn-primary" onClick={createMission}>Crear Mision</button>
            </div>
          )}
          {subZones.length > 0 && (
            <div class="sub-zones-list">
              {subZones.map((z, i) => (
                <span key={i} class="badge" style={`background:${z.type === 'verde' ? '#22c55e' : '#eab308'};margin-right:0.25rem`}>
                  {z.type === 'verde' ? 'Verde' : 'Poblado'} ({z.polygon.length} pts)
                  <span style="cursor:pointer;margin-left:4px" onClick={() => setSubZones(prev => prev.filter((_, j) => j !== i))}>&times;</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {creating && (
          <div>
            {drawingSub && <p class="hint">Haz clic en el mapa para marcar vertices de la sub-zona. {subPolygon.length >= 3 && <button class="btn btn-sm btn-primary" onClick={() => { setSubZones(prev => [...prev, { polygon: subPolygon, type: mode === 'urbano' ? 'verde' : 'poblado' }]); setSubPolygon([]); setDrawingSub(false); }}>Finalizar sub-zona</button>}</p>}
            <div style={{ height: '400px', marginTop: '1rem' }}>
              <MapView drawMode={drawMode || drawingSub} drawPoints={drawingSub ? subPolygon : drawPoints}
                polygon={drawPoints.length >= 3 ? drawPoints : undefined}
                onDrawPoint={(pt) => drawingSub ? setSubPolygon(prev => [...prev, pt]) : setDrawPoints(prev => [...prev, pt])}
                center={drawPoints.length > 0 ? drawPoints[0] : undefined}
                subZonesOverlay={subZones} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div class="container">
      <h1>{mission?.title || 'Cargando...'}</h1>
      <button class="btn btn-sm" onClick={() => { setMissionId(''); disconnect(); setShareUrl(''); }}>&larr; Volver</button>
      {shareUrl && (
        <div class="card share-card">
          <h2>Compartir busqueda</h2>
          <p class="share-url">{shareUrl}</p>
          <div class="share-actions">
            <button class="btn btn-sm btn-primary" onClick={copyUrl}>{copied ? 'Copiado!' : 'Copiar enlace'}</button>
            <button class="btn btn-sm btn-secondary" onClick={shareWhatsApp}>Compartir WhatsApp</button>
          </div>
          {mission?.keyword && <p class="keyword-share">Palabra clave: <strong>{mission.keyword}</strong></p>}
        </div>
      )}
      {mission?.mode && <p class="muted" style="margin-bottom:0.5rem">Modo: <strong>{mission.mode === 'urbano' ? 'Urbano / Calles' : 'Bosque / Malla'}</strong> {mission.street_count > 0 && `| ${mission.street_count} tramos de calle`} {mission.sub_zones?.length > 0 && `| ${mission.sub_zones.length} sub-zona(s)`}</p>}
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
      <div style={{ height: '60vh', border: '2px solid #1e3a5f', borderRadius: '8px', overflow: 'hidden' }}>
        <MapView polygon={mission?.polygon} sectors={sectors} searchers={searchers.filter(s => s.lat)} subZonesOverlay={mission?.sub_zones} />
      </div>
    </div>
  );
}