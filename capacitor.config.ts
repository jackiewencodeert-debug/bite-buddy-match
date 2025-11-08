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
      // Test IDs worden gebruikt tijdens development
      // Vervang deze met je echte AdMob IDs voor productie
      appId: {
        android: 'ca-app-pub-3940256099942544~3347511713', // Test ID
        ios: 'ca-app-pub-3940256099942544~1458002511' // Test ID
      }
    }
  }
};

export default config;
