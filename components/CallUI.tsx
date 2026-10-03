import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { CallContext } from '../context/CallContext';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';

export const CallUI = () => {
  const callContext = useContext(CallContext);

  if (!callContext) return null;

  const {
    callStatus,
    caller,
    acceptCall,
    rejectCall,
    endCall,
    localStream,
    remoteStream,
    toggleMute,
    switchCamera,
    isMuted,
    isVideoCall,
  } = callContext;

  if (callStatus === 'idle') return null;

  return (
    <Modal visible={true} transparent animationType="slide">
      {callStatus === 'receiving' && caller && (
        <View style={styles.incomingContainer}>
          <View style={styles.incomingBox}>
            <Text style={styles.incomingTitle}>Incoming {caller.isVideo ? 'Video' : 'Voice'} Call</Text>
            <Text style={styles.callerName}>{caller.name || 'Someone'} is calling...</Text>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={rejectCall}>
                <Ionicons name="call" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={acceptCall}>
                <Ionicons name={caller.isVideo ? "videocam" : "call"} size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {(callStatus === 'calling' || callStatus === 'active') && (
        <SafeAreaView style={styles.activeContainer}>
          <View style={styles.remoteVideoContainer}>
            {remoteStream && isVideoCall ? (
              <RTCView
                streamURL={remoteStream.toURL()}
                style={styles.fullVideo}
                objectFit="cover"
              />
            ) : (
              <View style={styles.callingOverlay}>
                <Ionicons name="person-circle-outline" size={120} color="#666" style={{ marginBottom: 20 }} />
                <Text style={styles.callingText}>
                  {callStatus === 'calling' ? 'Calling...' : (callStatus === 'active' ? 'Voice Call Active' : 'Connecting...')}
                </Text>
              </View>
            )}
          </View>

          {localStream && isVideoCall && (
            <View style={styles.localVideoContainer}>
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.localVideo}
                objectFit="cover"
              />
            </View>
          )}

          <View style={styles.controlsContainer}>
            {isVideoCall && (
              <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
                <Ionicons name="camera-reverse" size={28} color="white" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={endCall}>
              <Ionicons name="call" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
              <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  incomingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  incomingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  callerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#ff4444',
  },
  acceptBtn: {
    backgroundColor: '#00C851',
  },
  activeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#222',
  },
  fullVideo: {
    flex: 1,
  },
  callingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  callingText: {
    color: '#fff',
    fontSize: 20,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  localVideo: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallBtn: {
    backgroundColor: '#ff4444',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});
