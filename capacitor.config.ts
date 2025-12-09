import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bba31bf1bfea4fe09435f41ce91c8d9c',
  appName: 'bite-buddy-match',
  webDir: 'dist',
  server: {
    url: 'https://bba31bf1-bfea-4fe0-9435-f41ce91c8d9c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
