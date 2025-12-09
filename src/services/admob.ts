import { AdMob, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Productie Ad Unit IDs
const PRODUCTION_AD_UNIT_IDS = {
  android: 'ca-app-pub-1597606960562339/4235309779',
  ios: 'ca-app-pub-1597606960562339/4235309779'
};

// Test Ad Unit IDs (voor development)
const TEST_AD_UNIT_IDS = {
  android: 'ca-app-pub-3940256099942544/1033173712',
  ios: 'ca-app-pub-3940256099942544/4411468910'
};

// Detecteer of we in development mode zijn
const isDevelopment = import.meta.env.DEV;

// Gebruik test IDs in development, productie IDs in productie
const AD_UNIT_IDS = isDevelopment ? TEST_AD_UNIT_IDS : PRODUCTION_AD_UNIT_IDS;

export class AdMobService {
  private static initialized = false;
  private static adLoaded = false;

  /**
   * Initialiseer AdMob
   * Moet aangeroepen worden bij app start
   */
  static async initialize(): Promise<void> {
    // Alleen initialiseren op native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Niet op native platform, overslaan');
      return;
    }

    try {
      await AdMob.initialize({
        testingDevices: [], // Laat leeg voor productie
        initializeForTesting: isDevelopment, // Automatisch op basis van environment
      });
      
      this.initialized = true;
      console.log('AdMob geïnitialiseerd (development:', isDevelopment, ')');
      
      // Luister naar ad events
      this.setupAdListeners();
      
      // Pre-load eerste interstitial
      this.prepareInterstitial();
    } catch (error) {
      console.error('AdMob initialisatie fout:', error);
    }
  }

  /**
   * Setup event listeners voor ad events
   */
  private static setupAdListeners(): void {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      console.log('AdMob: Interstitial ad geladen');
      this.adLoaded = true;
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
      console.error('AdMob: Interstitial laden mislukt:', error);
      this.adLoaded = false;
    });

    AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
      console.log('AdMob: Interstitial ad getoond');
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error) => {
      console.error('AdMob: Interstitial tonen mislukt:', error);
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log('AdMob: Interstitial ad gesloten');
      // Preload de volgende ad
      this.prepareInterstitial();
    });
  }

  /**
   * Laad een interstitial ad
   */
  static async prepareInterstitial(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.initialized) {
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;

      const options: AdOptions = {
        adId: adId,
        isTesting: isDevelopment, // Automatisch op basis van environment
      };

      await AdMob.prepareInterstitial(options);
      console.log('AdMob: Interstitial voorbereid');
    } catch (error) {
      console.error('AdMob: Fout bij voorbereiden interstitial:', error);
    }
  }

  /**
   * Toon een interstitial ad
   * @returns Promise die resolved na het tonen/sluiten van de ad
   */
  static async showInterstitial(): Promise<void> {
    // Als we niet op native platform zijn, direct doorgaan
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Niet op native platform, ad overslaan');
      return;
    }

    if (!this.initialized) {
      console.warn('AdMob: Niet geïnitialiseerd');
      return;
    }

    try {
      if (!this.adLoaded) {
        console.log('AdMob: Ad nog niet geladen, voorbereiden...');
        await this.prepareInterstitial();
        // Wacht kort zodat de ad kan laden
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await AdMob.showInterstitial();
      this.adLoaded = false; // Reset na tonen
      
      // Preload volgende ad
      this.prepareInterstitial();
    } catch (error) {
      console.error('AdMob: Fout bij tonen interstitial:', error);
      // Probeer opnieuw te laden voor volgende keer
      this.prepareInterstitial();
    }
  }

  /**
   * Check of we op een native platform zijn
   */
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }
}
