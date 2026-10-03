const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICE_NAME = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';

module.exports = function withMessagingForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const permissions = manifest['uses-permission'] ?? [];

    if (!permissions.some((permission) => permission.$['android:name'] === 'android.permission.FOREGROUND_SERVICE_REMOTE_MESSAGING')) {
      permissions.push({ $: { 'android:name': 'android.permission.FOREGROUND_SERVICE_REMOTE_MESSAGING' } });
    }
    if (!permissions.some((permission) => permission.$['android:name'] === 'android.permission.FOREGROUND_SERVICE')) {
      permissions.push({ $: { 'android:name': 'android.permission.FOREGROUND_SERVICE' } });
    }
    manifest['uses-permission'] = permissions;

    const application = manifest.application?.[0];
    if (!application) throw new Error('Android application element is missing from the manifest.');
    application.$['android:allowBackup'] = 'false';

    const services = application.service ?? [];
    const service = services.find((entry) => entry.$['android:name'] === SERVICE_NAME);
    if (service) {
      service.$['android:foregroundServiceType'] = 'remoteMessaging';
    } else {
      services.push({
        $: {
          'android:name': SERVICE_NAME,
          'android:exported': 'false',
          'android:foregroundServiceType': 'remoteMessaging',
        },
      });
    }
    application.service = services;
    return config;
  });
};
