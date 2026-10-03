import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the type for our hook's return value for clarity
interface SocketHook {
  socket: Socket | null;
  isConnected: boolean;
}

// Ensure you export the hook function
export const useSocket = (uri: string): SocketHook => {
  // useRef is used to store the socket instance so it persists across re-renders
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize the socket connection
    const newSocket = io(uri, {
      reconnection: true,
      transports: ['websocket'], // Best for mobile
    });

    newSocket.on('connect', () => {
      console.log('Socket connected!');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected!');
      setIsConnected(false);
    });
    
    // Store the socket instance in the ref
    socketRef.current = newSocket;

    // Cleanup function: disconnect the socket when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [uri]); // Re-run the effect only if the server URI changes

  return { socket: socketRef.current, isConnected };
};