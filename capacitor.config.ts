import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akkerlab.bitebuddymatch',
  appName: 'BiteBuddyMatch',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: {
        android: 'ca-app-pub-1597606960562339~3810151402',
        ios: 'ca-app-pub-1597606960562339~3810151402'
      }
    }
  }
};

export default config;
