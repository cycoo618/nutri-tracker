import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yc.nutritrack',
  appName: 'NutriTrack',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
