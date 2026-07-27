import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connect(): Socket {
  if (socket?.connected) return socket;
  socket = io('/', { autoConnect: true, reconnection: true, reconnectionDelay: 2000 });
  return socket;
}

export function disconnect() { socket?.disconnect(); socket = null; }
export function getSocket(): Socket | null { return socket; }

export function joinMission(missionId: string) {
  connect();
  socket?.emit('join:mission', missionId);
}

export function leaveMission(missionId: string) {
  socket?.emit('leave:mission', missionId);
}
