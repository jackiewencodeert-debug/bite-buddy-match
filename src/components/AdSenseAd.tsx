import { useEffect, useRef, useState } from 'react';
import logoGrid from '@/assets/logo-grid.png';

/**
 * =============================================================================
 * ADVERTENTIE INTEGRATIE HANDLEIDING
 * =============================================================================
 * 
 * Dit component ondersteunt 3 advertentiemethodes:
 * 
 * 1. GOOGLE ADSENSE (Web)
 *    - Verander USE_ADSENSE naar true
 *    - Pas data-ad-client aan naar je eigen publisher ID (ca-pub-XXXXXXXX)
 *    - Pas data-ad-slot aan naar je advertentie slot ID
 *    - Voeg het AdSense script toe aan index.html:
 *      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>
 * 
 * 2. GOOGLE ADMOB (Native App via Capacitor)
 *    - Configureer in capacitor.config.ts
 *    - Zie src/services/admob.ts voor implementatie
 *    - AdMob wordt automatisch gebruikt op native platforms
 * 
 * 3. EIGEN ADVERTENTIES
 *    - Verander USE_CUSTOM_ADS naar true
 *    - Pas de CustomAdContent component aan met eigen content
 *    - Of vervang de logoGrid import met eigen advertentieafbeelding
 * 
 * =============================================================================
 */

// ===== CONFIGURATIE =====
const USE_ADSENSE = false;      // Zet op true voor Google AdSense
const USE_CUSTOM_ADS = true;    // Zet op true voor eigen advertenties (tijdelijk logo)
const ADSENSE_CLIENT = "ca-pub-1597606960562339";  // Vervang met je eigen publisher ID
// ========================

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  className?: string;
}

/**
 * Eigen advertentie content - Pas dit aan voor je eigen advertenties
 */
const CustomAdContent = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
    <div className="flex items-center gap-3 px-4">
      {/* Logo uit logo-grid.png - middelste van bovenste rij */}
      <div 
        className="w-12 h-12 bg-cover bg-no-repeat rounded-lg shadow-sm"
        style={{
          backgroundImage: `url(${logoGrid})`,
          backgroundPosition: '-96px 0px', // Middelste logo bovenste rij
          backgroundSize: '288px 192px'
        }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground">BiteBuddy</span>
        <span className="text-xs text-muted-foreground">Slim menu scannen</span>
      </div>
    </div>
  </div>
);

export const AdSenseAd = ({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidthResponsive = true,
  className = ''
}: AdSenseAdProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);
  const [showFallback, setShowFallback] = useState(!USE_ADSENSE);

  useEffect(() => {
    // Toon eigen advertenties als AdSense uitgeschakeld is
    if (!USE_ADSENSE || USE_CUSTOM_ADS) {
      setShowFallback(true);
      return;
    }

    // Only load ad once and when the element is in DOM
    if (isLoaded.current || !adRef.current) return;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          isLoaded.current = true;
          console.log('AdSense: Ad loaded for slot', adSlot);
        }
      } catch (error) {
        console.error('AdSense error:', error);
        setShowFallback(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [adSlot]);

  // Toon eigen advertentie als fallback of wanneer geconfigureerd
  if (showFallback || USE_CUSTOM_ADS) {
    return (
      <div className={`adsense-container ${className}`} style={{ maxHeight: '7vh', overflow: 'hidden' }}>
        <CustomAdContent />
      </div>
    );
  }

  return (
    <div className={`adsense-container ${className}`} style={{ maxHeight: '7vh', overflow: 'hidden' }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', maxHeight: '7vh' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
};
