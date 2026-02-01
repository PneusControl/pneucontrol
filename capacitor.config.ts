import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pneucontrol.v3',
  appName: 'Pneu Control',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#6366f1",
      showSpinner: true,
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
