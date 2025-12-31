import { registerRootComponent } from 'expo';
import notifee, { EventType } from '@notifee/react-native';
import { DeviceEventEmitter } from 'react-native';
import App from './App';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  if (type === EventType.ACTION_PRESS && pressAction.id === 'stop') {
    // Notify the app to stop the timer
    DeviceEventEmitter.emit('STOP_TIMER');
    // Remove the notification
    await notifee.cancelNotification(notification.id);
  }
});

notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Long running task...
    // The service stops when the notification is cancelled
  });
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
