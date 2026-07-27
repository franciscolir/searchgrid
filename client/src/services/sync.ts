import { dbPut, dbGetAll, dbDeleteByIndex, dbDelete, dbGet } from './db'

export async function enqueueOp(type: string, missionId: string, deviceId: string, payload: any) {
  await dbPut('pending_ops', {
    type,
    mission_id: missionId,
    device_id: deviceId,
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString(),
  })
}

export async function syncPending(deviceId: string, missionId: string): Promise<boolean> {
  const all = await dbGetAll('pending_ops')
  const ops = all
    .filter((o: any) => o.mission_id === missionId && o.device_id === deviceId)
    .sort((a: any, b: any) => a.id - b.id)
  if (ops.length === 0) return true
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        missionId,
        operations: ops.map((o: any) => ({ ...JSON.parse(o.payload), timestamp: o.created_at })),
      }),
    })
    if (res.ok) {
      for (const op of ops) await dbDelete('pending_ops', op.id)
      return true
    }
  } catch { /* offline */ }
  return false
}

export async function getPendingCount(): Promise<number> {
  const all = await dbGetAll('pending_ops')
  return all.length
}
