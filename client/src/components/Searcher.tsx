import { useEffect, useState, useRef } from 'preact/hooks';
import MapView from './MapView';
import { enqueueOp, syncPending, getPendingCount } from '../services/sync';
import { dbPut, dbGet, getDeviceId } from '../services/db';
import { Sector } from '../utils/grid';

const API = '/api';

interface Mission { id: string; title: string; description: string; polygon: [number, number][]; status: string; }

export default function Searcher({ id }: { id?: string }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionId, setMissionId] = useState(id || '');
  const [mission, setMission] = useState<Mission | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [name, setName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [needsKeyword, setNeedsKeyword] = useState(false);
  const [keywordError, setKeywordError] = useState('');
  const [searcherId, setSearcherId] = useState('');
  const [currentLocation, setCurrentLocation] = useState<[number, number] | undefined>();
  const [tracking, setTracking] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [mode, setMode] = useState<'join' | 'search'>('join');
  const [joinMode, setJoinMode] = useState<'id' | 'list'>('id');
  const watchId = useRef<number | null>(null);
  const trackingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceId = getDeviceId();

  useEffect(() => {
    fetch(`${API}/missions`).then(r => r.json()).then(setMissions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!missionId) return;
    checkMission();
    loadMission();
  }, [missionId]);

  useEffect(() => {
    (async () => {
      const si = await dbGet('device_info', 'searcher_id');
      const sn = await dbGet('device_info', 'searcher_name');
      if (si && sn) { setSearcherId(si.value); setName(sn.value); }
    })();
  }, []);

  useEffect(() => {
    if (!searcherId || !missionId) return;
    const handle = async () => {
      const ok = await syncPending(searcherId, missionId);
      if (ok) { setPendingOps(0); loadMission(); }
    };
    if (navigator.onLine) handle();
    window.addEventListener('online', handle);
    return () => window.removeEventListener('online', handle);
  }, [searcherId, missionId]);

  async function checkMission() {
    try {
      const res = await fetch(`${API}/missions/${missionId}/info`);
      const data = await res.json();
      setNeedsKeyword(data.has_keyword);
      if (!data.has_keyword) setKeyword('');
    } catch { setNeedsKeyword(false); }
  }

  async function loadMission() {
    const cached = await dbGet('local_mission', missionId);
    if (cached) {
      const data = JSON.parse(cached.data);
      setMission(data.mission);
      setSectors(data.sectors);
    }
    try {
      const res = await fetch(`${API}/missions/${missionId}`);
      const data = await res.json();
      setMission(data);
      const parsed = data.sectors.map((s: any) => ({ ...s, bounds: JSON.parse(s.bounds), center: JSON.parse(s.center) }));
      setSectors(parsed);
      await dbPut('local_mission', { id: missionId, data: JSON.stringify({ mission: data, sectors: parsed }) });
    } catch { /* offline */ }
  }

  async function joinMission() {
    if (!name.trim()) return;
    const existing = await dbGet('device_info', 'searcher_id');
    const joinedMission = await dbGet('device_info', 'joined_mission');
    if (existing && joinedMission?.value === missionId) {
      setSearcherId(existing.value);
      setMode('search');
      return;
    }
    try {
      const res = await fetch(`${API}/missions/${missionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, keyword: needsKeyword ? keyword : undefined }),
      });
      if (res.status === 403) { setKeywordError('Palabra clave incorrecta'); return; }
      if (res.ok) {
        const data = await res.json();
        setSearcherId(data.id);
        await dbPut('device_info', { key: 'searcher_id', value: data.id });
        await dbPut('device_info', { key: 'searcher_name', value: name });
        await dbPut('device_info', { key: 'joined_mission', value: missionId });
        setMode('search');
      }
    } catch {
      alert('Error al unirse. Verifica conexion.');
    }
  }

  function toggleTracking() {
    if (tracking) {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      watchId.current = null; trackingInterval.current = null; setTracking(false);
      return;
    }
    if (!navigator.geolocation) { alert('GPS no disponible'); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    trackingInterval.current = setInterval(async () => {
      if (currentLocation && searcherId) {
        await enqueueOp('location', missionId, searcherId, { type: 'location', lat: currentLocation[0], lng: currentLocation[1] });
        setPendingOps(prev => prev + 1);
      }
    }, 30000);
    setTracking(true);
  }

  async function markSector(sectorId: string) {
    const s = sectors.find(x => x.id === sectorId);
    if (!s) return;
    const newStatus = (s.status === 'pendiente' || s.status === 'revisado') ? 'buscando' : 'revisado';
    setSectors(prev => prev.map(x => x.id === sectorId ? { ...x, status: newStatus as Sector['status'], searched_by: name || searcherId } : x));
    await enqueueOp('sector', missionId, searcherId, { type: 'sector', sectorId, status: newStatus });
    setPendingOps(prev => prev + 1);
  }

  async function doSync() {
    setSyncing(true);
    const ok = await syncPending(searcherId, missionId);
    if (ok) { setPendingOps(0); loadMission(); }
    setSyncing(false);
  }

  useEffect(() => { getPendingCount().then(setPendingOps); }, []);

  if (mode === 'join') {
    return (
      <div class="container">
        <h1>Buscador</h1>
        <a href="/" class="back-link">&larr; Inicio</a>
        <div class="card">
          <h2>Unirse a Mision</h2>
          <div class="toggle-tabs">
            <button class={`btn btn-sm ${joinMode === 'id' ? 'btn-active' : ''}`} onClick={() => setJoinMode('id')}>Por ID</button>
            <button class={`btn btn-sm ${joinMode === 'list' ? 'btn-active' : ''}`} onClick={() => setJoinMode('list')}>Por lista</button>
          </div>
          {joinMode === 'id' ? (
            <>
              <input value={missionId} onInput={(e: any) => setMissionId(e.target.value)} placeholder="ID de la mision" />
              {missionId && !mission && <p class="muted">Buscando mision...</p>}
            </>
          ) : (
            <select onChange={(e: any) => setMissionId(e.target.value)} value={missionId}>
              <option value="">Seleccionar mision...</option>
              {missions.map(m => <option key={m.id} value={m.id}>{m.title} {(m as any).has_keyword ? ' (con clave)' : ''}</option>)}
            </select>
          )}
          {missionId && (
            <>
              <input value={name} onInput={(e: any) => setName(e.target.value)} placeholder="Tu nombre o identificador" />
              {needsKeyword && (
                <input value={keyword} onInput={(e: any) => { setKeyword(e.target.value); setKeywordError(''); }} placeholder="Palabra clave" />
              )}
              {keywordError && <p class="error">{keywordError}</p>}
              <button class="btn btn-primary" onClick={joinMission} disabled={!name.trim() || (needsKeyword && !keyword)}>Unirse a la busqueda</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div class="container">
      <h1>{mission?.title || 'Buscando...'}</h1>
      <div class="toolbar">
        <button class="btn btn-sm" onClick={() => { setMode('join'); setSearcherId(''); }}>&larr; Salir</button>
        <button class={`btn btn-sm ${tracking ? 'btn-active' : ''}`} onClick={toggleTracking}>GPS {tracking ? 'ON' : 'OFF'}</button>
        <button class="btn btn-sm" onClick={doSync} disabled={syncing}>
          {syncing ? 'Sincronizando...' : pendingOps > 0 ? `Sincronizar (${pendingOps})` : 'Sincronizado'}
        </button>
      </div>
      <p class="searcher-id">Buscador: <strong>{name}</strong> {missionId && <span class="muted">| ID: {missionId.slice(0, 8)}...</span>}</p>
      <div class="legend">
        <span><span class="dot" style={{ background: '#94a3b8' }} /> Pendiente</span>
        <span><span class="dot" style={{ background: '#eab308' }} /> Buscando</span>
        <span><span class="dot" style={{ background: '#22c55e' }} /> Revisado</span>
        {currentLocation && <span><span class="dot" style={{ background: '#3b82f6' }} /> Mi ubicacion</span>}
      </div>
      <div style={{ height: '60vh', border: '2px solid #1e3a5f', borderRadius: '8px', overflow: 'hidden' }}>
        <MapView polygon={mission?.polygon} sectors={sectors} onSectorClick={markSector} currentLocation={currentLocation} />
      </div>
      <p class="hint">Toca un sector para marcarlo como buscando, toca de nuevo para revisado</p>
    </div>
  );
}