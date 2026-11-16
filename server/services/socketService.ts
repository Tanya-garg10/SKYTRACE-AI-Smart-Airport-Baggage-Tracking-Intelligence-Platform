import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  BaggageRecord,
  LostBaggageReportRecord,
  NotificationRecord,
  TrackingEventRecord,
} from '../../src/shared/types.js';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
    path: '/socket.io',
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join:role', (role: string) => {
      if (role === 'passenger' || role === 'staff' || role === 'admin') {
        socket.join(`role:${role}`);
      }
    });
    socket.on('join:user', (userId: string) => {
      if (typeof userId === 'string' && userId.length > 0) {
        socket.join(`user:${userId}`);
      }
    });
    socket.on('join:bag', (bagId: string) => {
      if (typeof bagId === 'string' && bagId.length > 0) {
        socket.join(`bag:${bagId}`);
      }
    });
  });

  return ioInstance;
}

export function emitBaggageRegistered(bag: BaggageRecord): void {
  if (!ioInstance) return;
  ioInstance.emit('baggage:registered', bag);
}

export function emitBaggageScanned(payload: {
  baggage: BaggageRecord;
  event: TrackingEventRecord;
}): void {
  if (!ioInstance) return;
  ioInstance.emit('baggage:scanned', payload);
  ioInstance.to(`bag:${payload.baggage.bagId}`).emit('baggage:updated', payload);
}

export function emitNotification(notification: NotificationRecord): void {
  if (!ioInstance) return;
  if (notification.userId) {
    ioInstance.to(`user:${notification.userId}`).emit('notification:new', notification);
  }
  if (notification.targetRole === 'all') {
    ioInstance.emit('notification:new', notification);
  } else {
    ioInstance.to(`role:${notification.targetRole}`).emit('notification:new', notification);
  }
  // Always keep admin informed of operational notifications
  if (notification.targetRole !== 'admin') {
    ioInstance.to('role:admin').emit('notification:new', notification);
  }
}

export function emitReportUpdate(report: LostBaggageReportRecord): void {
  if (!ioInstance) return;
  ioInstance.emit('report:updated', report);
}
