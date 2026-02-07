import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pneucontrol.v3',
  appName: 'Pneu Control',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6366f1",
      showSpinner: true,
      androidScaleType: "CENTER_CROP",
      iosSpinnerStyle: "large"
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
