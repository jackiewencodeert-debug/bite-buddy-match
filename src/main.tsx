import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AdMobService } from "./services/admob";

// Initialiseer AdMob bij app start
AdMobService.initialize().then(() => {
  // Preload eerste interstitial ad
  AdMobService.prepareInterstitial();
});

createRoot(document.getElementById("root")!).render(<App />);
