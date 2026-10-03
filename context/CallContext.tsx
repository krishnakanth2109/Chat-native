import React, { createContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';

interface CallContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStatus: 'idle' | 'calling' | 'receiving' | 'active';
  caller: any;
  startCall: (userId: string, isVideo?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  switchCamera: () => void;
  isMuted: boolean;
  isVideoCall: boolean;
}

export const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'receiving' | 'active'>('idle');
  const [caller, setCaller] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // Use refs for mutable state accessed inside socket listeners to avoid closure traps
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callStatusRef = useRef<'idle' | 'calling' | 'receiving' | 'active'>('idle');
  const localStreamRef = useRef<MediaStream | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);
  const { user } = useAuth();

  const updateCallStatus = useCallback((status: 'idle' | 'calling' | 'receiving' | 'active') => {
    callStatusRef.current = status;
    setCallStatus(status);
  }, []);

  const getIceServers = () => {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Use TURN server if environment variables are configured
        ...(process.env.EXPO_PUBLIC_WEBRTC_TURN_SERVER ? [{
          urls: process.env.EXPO_PUBLIC_WEBRTC_TURN_SERVER,
          username: process.env.EXPO_PUBLIC_WEBRTC_TURN_USERNAME,
          credential: process.env.EXPO_PUBLIC_WEBRTC_TURN_CREDENTIAL,
        }] : []),
      ],
    };
  };

  const cleanupCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Correctly close local tracks using the ref
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    updateCallStatus('idle');
    setCaller(null);
    setTargetUserId(null);
    targetUserIdRef.current = null;
    setIsMuted(false);
    pendingCandidates.current = [];
  }, [updateCallStatus]);

  useEffect(() => {
    socket.on('incoming_call', ({ signal, from, name, isVideo }) => {
      // Reject incoming call if already in a call
      if (callStatusRef.current !== 'idle') {
        socket.emit('reject_call', { to: from });
        return;
      }
      setCaller({ signal, from, name, isVideo });
      setIsVideoCall(isVideo);
      updateCallStatus('receiving');
    });

    socket.on('call_accepted', async (signal) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          updateCallStatus('active');
          for (const cand of pendingCandidates.current) {
            await pcRef.current.addIceCandidate(cand);
          }
          pendingCandidates.current = [];
        } catch (e) {
          console.error('Error setting remote description:', e);
        }
      }
    });

    socket.on('call_rejected', () => {
      cleanupCall();
    });

    socket.on('call_ended', () => {
      cleanupCall();
    });

    socket.on('ice_candidate', async (candidate) => {
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(iceCandidate);
        } else {
          pendingCandidates.current.push(iceCandidate);
        }
      } catch (e) {
        console.error('Error handling ICE candidate:', e);
      }
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('ice_candidate');
    };
  }, [cleanupCall, updateCallStatus]);

  const setupMedia = async (videoRequired: boolean) => {
    try {
      let isFront = true;
      const sourceInfos = (await mediaDevices.enumerateDevices()) as any[];
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const deviceInfo = sourceInfos[i];
        if (deviceInfo.kind == 'videoinput' && deviceInfo.facing == (isFront ? 'front' : 'environment')) {
          videoSourceId = deviceInfo.deviceId;
        }
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: videoRequired ? {
          width: 640,
          height: 480,
          frameRate: 30,
          facingMode: isFront ? 'user' : 'environment',
        } : false,
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (e) {
      console.error('Error getting user media:', e);
      return null;
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(getIceServers());
    
    pc.onicecandidate = (event: any) => {
      if (event.candidate && targetUserIdRef.current) {
        socket.emit('ice_candidate', { 
          to: targetUserIdRef.current, 
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          }
        });
      }
    };

    pc.ontrack = (event: any) => {
      if (event.streams && event.streams.length > 0) {
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        setRemoteStream(stream);
      }
    };

    // Fallback for older react-native-webrtc versions
    (pc as any).onaddstream = (event: any) => {
      if (event.stream) {
        setRemoteStream(event.stream);
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async (userId: string, isVideo: boolean = true) => {
    if (!user) return;
    if (callStatusRef.current !== 'idle') return; // Prevent double calling
    
    setTargetUserId(userId);
    targetUserIdRef.current = userId;
    setIsVideoCall(isVideo);
    updateCallStatus('calling');
    
    const stream = await setupMedia(isVideo);
    if (!stream) {
      cleanupCall();
      return;
    }

    // Abort if the user ended the call while media was setting up
    if (callStatusRef.current === 'idle') {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    try {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      
      socket.emit('call_user', {
        userToCall: userId,
        signalData: { type: offer.type, sdp: offer.sdp },
        from: user._id,
        name: user.name,
        isVideo
      });
    } catch (e) {
      console.error('Error creating offer', e);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!caller) return;
    if (callStatusRef.current === 'active') return;
    
    setTargetUserId(caller.from);
    targetUserIdRef.current = caller.from;
    updateCallStatus('active');

    const stream = await setupMedia(caller.isVideo);
    if (!stream) {
      cleanupCall();
      return;
    }

    // Abort if the caller ended the call while media was setting up
    if (callStatusRef.current === 'idle') {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(caller.signal));
      for (const cand of pendingCandidates.current) {
        await pc.addIceCandidate(cand);
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', {
        to: caller.from,
        signal: { type: answer.type, sdp: answer.sdp },
      });
    } catch (e) {
      console.error('Error accepting call', e);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (caller) {
      socket.emit('reject_call', { to: caller.from });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (targetUserIdRef.current) {
      socket.emit('end_call', { to: targetUserIdRef.current });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  };

  const switchCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        // @ts-ignore
        track._switchCamera();
      });
    }
  };

  return (
    <CallContext.Provider
      value={{
        localStream,
        remoteStream,
        callStatus,
        caller,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        switchCamera,
        isMuted,
        isVideoCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

