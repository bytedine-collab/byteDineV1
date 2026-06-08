import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect', () => console.log('❌ Socket disconnected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
};

export const joinRoom = (room) => {
  const s = getSocket();
  if (room === 'admin') {
    s.emit('joinAdmin');
  } else if (room === 'kitchen') {
    s.emit('joinKitchen');
  } else {
    s.emit('joinRoom', { room });
  }
};

export const joinTable = (tableNumber) => {
  const s = getSocket();
  s.emit('joinTable', { tableNumber });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
