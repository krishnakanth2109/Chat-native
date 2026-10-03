// services/socket.ts
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../constants/Config';


export const socket: Socket = io(BASE_URL, {
  autoConnect: false,
  // allow both polling and websocket to fix handshake issues
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

let _storedUserId: string | null = null;

export const connectSocket = (userId: string) => {
  _storedUserId = userId;
  // Always update auth/query so re-connections carry the userId
  socket.auth = { userId };
  socket.io.opts.query = { userId };

  if (!socket.connected) {
    socket.connect();
  }
};

// Called automatically on every re-connect so the server re-registers this socket
socket.on('connect', () => {
  if (_storedUserId) {
    // Re-send userId on every reconnect so server rebuilds userSocketMap correctly
    socket.auth = { userId: _storedUserId };
  }
});

socket.on('disconnect', () => {
});

socket.on('connect_error', () => {
});

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
