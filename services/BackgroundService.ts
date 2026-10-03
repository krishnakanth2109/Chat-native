import BackgroundService from 'react-native-background-actions';
import { Platform } from 'react-native';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// This task runs continuously in the background to keep the React Native JS engine alive.
// As long as the JS engine is alive, Socket.IO will maintain its WebSocket connection.
const backgroundTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;
  await new Promise(async (resolve) => {
    // Keep running infinitely
    while (BackgroundService.isRunning()) {
      // Small delay to prevent CPU spinning, but keep JS event loop active
      await sleep(delay);
    }
  });
};

const options = {
  taskName: 'ChatMateBackground',
  taskTitle: 'ChatMate is running',
  taskDesc: 'Listening for new messages and calls',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#3b82f6',
  // Keep the service alive when the app is swiped away (only works on stock Android, OEMs may override)
  linkingURI: 'chatnative://', 
  foregroundServiceType: ['remoteMessaging'] as 'remoteMessaging'[],
  parameters: {
    delay: 10000,
  },
};

export const startBackgroundService = async () => {
  if (Platform.OS === 'android') {
    if (!BackgroundService.isRunning()) {
      try {
        await BackgroundService.start(backgroundTask, options);
        console.log('Foreground Background Service started successfully.');
      } catch (e) {
        console.log('Error starting Background Service:', e);
      }
    }
  } else {
    console.warn('Background service is only supported on Android. iOS will suspend the app.');
  }
};

export const stopBackgroundService = async () => {
  if (Platform.OS === 'android') {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
      console.log('Foreground Background Service stopped.');
    }
  }
};
