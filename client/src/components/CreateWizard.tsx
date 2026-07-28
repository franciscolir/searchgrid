import { useState } from 'preact/hooks'
import { REGIONS, getCommunes } from '../data/chile'

interface Props {
  onComplete: (data: { title: string, polygon: [number, number][], zones: { polygon: [number, number][], type: 'poblado' | 'verde' }[] }) => void
  onCancel: () => void
}

type Step = 'location' | 'polygon' | 'zones' | 'result'

export default function CreateWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>('location')
  const [region, setRegion] = useState('')
  const [commune, setCommune] = useState('')
  const [title, setTitle] = useState('')
  const [polygon, setPolygon] = useState<[number, number][]>([])
  const [zones, setZones] = useState<{ polygon: [number, number][], type: 'poblado' | 'verde' }[]>([])
  const [drawMode, setDrawMode] = useState(false)
  const [zoneMode, setZoneMode] = useState<'poblado' | 'verde' | null>(null)
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([])
  const [sectorCount, setSectorCount] = useState(0)

  function handleMapClick(pt: [number, number]) {
    if (step === 'location') {
      // Click on map sets approximate location
    }
    if (step === 'polygon' && drawMode) {
      setCurrentPoints(prev => [...prev, pt])
    }
    if (step === 'zones' && zoneMode && drawMode) {
      setCurrentPoints(prev => [...prev, pt])
    }
  }

  function finishDraw() {
    if (step === 'polygon' && currentPoints.length >= 3) {
      setPolygon(currentPoints)
      setCurrentPoints([])
      setDrawMode(false)
    }
    if (step === 'zones' && zoneMode && currentPoints.length >= 3) {
      setZones(prev => [...prev, { polygon: currentPoints, type: zoneMode }])
      setCurrentPoints([])
      setDrawMode(false)
      setZoneMode(null)
    }
  }

  function finishWizard() {
    const count = 1 + zones.reduce((s, z) => s + Math.max(1, Math.floor(polygonArea(z.polygon) / 10000)), 0)
    setSectorCount(count)
    setStep('result')
  }

  function confirmResult() {
    onComplete({ title, polygon, zones })
  }

  return (
    <div class="wizard">
      <div class="wizard-header">
        <h2>{step === 'location' ? '1. Ubicacion' : step === 'polygon' ? '2. Area de busqueda' : step === 'zones' ? '3. Zonas' : '4. Resumen'}</h2>
        {step !== 'location' && <button class="btn btn-sm" onClick={() => setStep({ location: 'polygon', polygon: 'location', zones: 'polygon', result: 'zones' }[step] as Step)}>&larr; Volver</button>}
      </div>

      <div class="wizard-body">
        {step === 'location' && (
          <>
            <p class="hint" style="text-align:left">Selecciona la ubicacion de la busqueda</p>
            <input value={title} onInput={(e: any) => setTitle(e.target.value)} placeholder="Nombre de la busqueda" />
            <select value={region} onChange={(e: any) => { setRegion(e.target.value); setCommune('') }}>
              <option value="">Seleccionar region...</option>
              {REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {region && (
              <select value={commune} onChange={(e: any) => setCommune(e.target.value)}>
                <option value="">Seleccionar comuna...</option>
                {getCommunes(region).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <p class="hint">O haz clic en el mapa para centrar la ubicacion</p>
            <button class="btn btn-primary" disabled={!title || !commune} onClick={() => setStep('polygon')}>Siguiente &rarr;</button>
          </>
        )}

        {step === 'polygon' && (
          <>
            <p class="hint" style="text-align:left">Dibuja el area de busqueda</p>
            {!drawMode ? (
              <button class="btn btn-primary" onClick={() => { setDrawMode(true); setCurrentPoints([]) }}>Dibujar poligono</button>
            ) : (
              <>
                <p class="hint">{currentPoints.length} puntos marcados. Haz clic en el mapa para agregar vertices.</p>
                {currentPoints.length >= 3 && <button class="btn btn-primary" onClick={finishDraw}>Finalizar poligono</button>}
                <button class="btn btn-sm" onClick={() => setCurrentPoints([])}>Limpiar</button>
              </>
            )}
            {polygon.length >= 3 && !drawMode && (
              <button class="btn btn-primary" onClick={() => setStep('zones')}>Siguiente &rarr;</button>
            )}
          </>
        )}

        {step === 'zones' && (
          <>
            <p class="hint" style="text-align:left">Marca las zonas dentro del area:</p>
            <div class="zone-legend">
              <span class="zone-btn poblado" onClick={() => { setZoneMode('poblado'); setDrawMode(true); setCurrentPoints([]) }}>+ Zona poblada</span>
              <span class="zone-btn verde" onClick={() => { setZoneMode('verde'); setDrawMode(true); setCurrentPoints([]) }}>+ Parque / Bosque</span>
            </div>
            {drawMode && zoneMode && (
              <p class="hint">{currentPoints.length} pts. {currentPoints.length >= 3 && <button class="btn btn-sm btn-primary" onClick={finishDraw}>Cerrar zona</button>}</p>
            )}
            {zones.length > 0 && (
              <div class="zone-list">
                {zones.map((z, i) => (
                  <span key={i} class="zone-tag" style={`background:${z.type === 'poblado' ? '#3b82f6' : '#22c55e'}`}>
                    {z.type === 'poblado' ? 'Urbano' : 'Verde'} ({z.polygon.length} pts)
                    <span style="cursor:pointer;margin-left:4px" onClick={() => setZones(prev => prev.filter((_, j) => j !== i))}>&times;</span>
                  </span>
                ))}
              </div>
            )}
            {zones.length > 0 && !drawMode && (
              <button class="btn btn-primary" onClick={finishWizard}>Finalizar &rarr;</button>
            )}
          </>
        )}

        {step === 'result' && (
          <>
            <p class="hint" style="text-align:left">Resumen de la busqueda</p>
            <div class="result-stats">
              <p><strong>{title}</strong></p>
              <p>Poligono: {polygon.length} vertices</p>
              <p>Zonas pobladas: {zones.filter(z => z.type === 'poblado').length}</p>
              <p>Zonas verdes: {zones.filter(z => z.type === 'verde').length}</p>
              <p>Sectores estimados: <strong>{sectorCount}</strong></p>
            </div>
            <button class="btn btn-primary" onClick={confirmResult}>Confirmar y crear</button>
          </>
        )}
      </div>
    </div>
  )
}

function polygonArea(pts: [number, number][]): number {
  let area = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++)
    area += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1])
  return Math.abs(area) / 2 * 111319 * 111319
}
