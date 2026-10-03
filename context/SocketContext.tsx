// context/SocketContext.tsx
import React, { createContext, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { socket } from '../services/socket';

import { BASE_URL } from '../constants/Config';

// CRITICAL: Must match the IP in your api.ts file
const SOCKET_URL = BASE_URL; 

interface SocketContextType { socket: Socket | null; }

export const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  // Use the global singleton socket instead of creating a second connection
  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};