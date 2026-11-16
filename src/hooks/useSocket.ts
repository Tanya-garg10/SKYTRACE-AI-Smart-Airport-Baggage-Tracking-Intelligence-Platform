import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { BaggageRecord, NotificationRecord, TrackingEventRecord } from '../types';

interface UseSocketOptions {
  userId?: string;
  role?: string;
  onBaggageScanned?: (payload: { baggage: BaggageRecord; event: TrackingEventRecord }) => void;
  onBaggageRegistered?: (baggage: BaggageRecord) => void;
  onNotification?: (notification: NotificationRecord) => void;
}

export function useSocket(options: UseSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (callbacksRef.current.role) {
        socket.emit('join:role', callbacksRef.current.role);
      }
      if (callbacksRef.current.userId) {
        socket.emit('join:user', callbacksRef.current.userId);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('baggage:scanned', (payload: { baggage: BaggageRecord; event: TrackingEventRecord }) => {
      callbacksRef.current.onBaggageScanned?.(payload);
    });

    socket.on('baggage:registered', (bag: BaggageRecord) => {
      callbacksRef.current.onBaggageRegistered?.(bag);
    });

    socket.on('notification:new', (ntf: NotificationRecord) => {
      callbacksRef.current.onNotification?.(ntf);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [options.userId, options.role]);

  return { connected };
}
