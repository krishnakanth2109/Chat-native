// hooks/useInvites.ts
import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';

export const useInvites = () => {
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const socketContext = useContext(SocketContext);
  const socket = socketContext?.socket;

  useEffect(() => {
    const fetchInviteCount = async () => {
      try {
        const { data } = await api.get<{ _id: string }[]>('/users/invites');
        setPendingInvitesCount(data.length);
      } catch (error) { 
        console.error("Failed to fetch invites:", error);
      }
    };

    fetchInviteCount(); // Fetch on initial load
    
    // Listen for real-time updates from the server
    socket?.on('new_invite', fetchInviteCount);
    
    // Cleanup the listener
    return () => { 
      socket?.off('new_invite', fetchInviteCount); 
    };
  }, [socket]);

  return { pendingInvitesCount };
};