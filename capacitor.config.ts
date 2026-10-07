import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.handymap.pro',
  appName: 'HandyMap Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff'
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#2563eb',
      sound: 'beep.wav'
    },
    Camera: {
      presentationStyle: 'popover'
    }
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'HandyMap Pro'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff'
  }
};

export default config;
