# 📱 Native Mobile App Setup met AdMob

Deze app is nu geconfigureerd als een native mobile app met volledige AdMob integratie voor advertentie-inkomsten.

## 🚀 Testen op Je Device of Emulator

### Stap 1: Export naar GitHub
1. Klik op de "Export to Github" knop in Lovable
2. Clone het project naar je lokale machine:
   ```bash
   git clone [jouw-github-repo-url]
   cd bite-buddy-match
   ```

### Stap 2: Installeer Dependencies
```bash
npm install
```

### Stap 3: Platform Toevoegen

**Voor Android:**
```bash
npx cap add android
npx cap update android
```

**Voor iOS (alleen op Mac met Xcode):**
```bash
npx cap add ios
npx cap update ios
```

### Stap 4: Build & Sync
```bash
npm run build
npx cap sync
```

### Stap 5: Run op Device/Emulator

**Android:**
```bash
npx cap run android
```

**iOS:**
```bash
npx cap run ios
```

## 💰 AdMob Configuratie

### Automatische Environment Detectie
De app detecteert automatisch of je in development of productie draait:
- **Development mode**: Test Ad IDs worden gebruikt
- **Productie mode**: Echte Ad Unit IDs worden gebruikt

### Huidige Configuratie (PRODUCTIE)
```
App ID: ca-app-pub-1597606960562339~3810151402
Interstitial Ad Unit ID: ca-app-pub-1597606960562339/4235309779
```

### Test Ads voor Development
Wanneer je lokaal ontwikkelt (`npm run dev`), worden automatisch Google's test ad IDs gebruikt:
- Dit voorkomt dat je AdMob account gebanned wordt
- Test ads tonen een "Test Ad" label

### Build voor Productie
Bij `npm run build` worden automatisch de echte Ad Unit IDs gebruikt.

## 📊 Hoe Werkt de Integratie?

### Op Native Platforms (iOS/Android):
- **Echte AdMob interstitial ads** worden getoond
- Gebruikers zien volledige scherm advertenties
- Analytics worden gelogd naar je database
- Maximale advertentie-inkomsten

### Op Web (Browser):
- **Fallback custom dialog** wordt getoond
- Hetzelfde look & feel
- Analytics werken ook
- Optie om later web ads toe te voegen (Google AdSense)

## 🎯 Wanneer Worden Ads Getoond?

Ads worden automatisch getoond voor:
- ✅ **Eter** gebruikers
- ✅ **Gast** gebruikers

Ads worden **overgeslagen** voor:
- ❌ **Eetgever** (business) gebruikers

## 📈 Analytics Dashboard

Bekijk je ad performance in het Admin Dashboard:
- Aantal keer ad getoond
- Completion rate (percentage volledig bekeken)
- Skip statistics

## 🔄 Development Workflow

### Wanneer je code aanpast:
1. Git pull de wijzigingen van GitHub
2. Run `npm install` (als er nieuwe dependencies zijn)
3. Run `npm run build`
4. Run `npx cap sync`
5. Test op je device/emulator

### Hot Reload tijdens Development:
De app is geconfigureerd met hot reload. Wijzigingen in Lovable zijn direct zichtbaar in je native app zonder rebuild!

## 📱 App Store Publicatie

### Android (Google Play):
1. Genereer een signing key
2. Build een release APK/AAB
3. Upload naar Google Play Console
4. Zorg dat je AdMob account is gekoppeld

### iOS (Apple App Store):
1. Heb een Apple Developer account ($99/jaar)
2. Configureer signing in Xcode
3. Build voor release
4. Upload via App Store Connect

## ⚠️ Belangrijke Notes

- **Test Ads zijn VERPLICHT tijdens development** - Je AdMob account kan gebanned worden als je op echte ads klikt tijdens testen
- **Privacy Policy is vereist** voor apps met advertenties
- **GDPR/Privacy wetgeving** - Overweeg een consent dialog voor EU gebruikers
- **AdMob policies** - Zorg dat je app voldoet aan AdMob policies

## 🆘 Troubleshooting

### Ad toont niet:
- Check of je op een native platform bent (niet web)
- Kijk in de console logs voor errors
- Zorg dat je test device ID correct is
- Wacht een paar seconden na app start (ad moet laden)

### Build errors:
- Run `npx cap sync` na code wijzigingen
- Clean build: verwijder `node_modules` en run `npm install` opnieuw
- Voor iOS: run `pod install` in de `ios/App` folder

## 📚 Resources

- [Capacitor Documentatie](https://capacitorjs.com/)
- [AdMob Plugin Docs](https://github.com/capacitor-community/admob)
- [AdMob Best Practices](https://support.google.com/admob/answer/6128877)
- [Lovable Mobile Development](https://lovable.dev/blog/mobile-app-development-with-capacitor)
