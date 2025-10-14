# Light Wallet - Deployment Guide

This wallet has been configured for **three deployment methods**:

---

## 1. ✅ Telegram Mini App

Your wallet is **ready to use in Telegram**! 

### How to Use:
1. **Create a bot** with [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` and follow the instructions
3. After creating the bot, use `/newapp` to create a Web App
4. Set the Web App URL to: `https://3b5bcb72-0fee-4dba-a62e-a67a57875e91.lovableproject.com`
5. Your wallet will now open inside Telegram chats!

### Telegram Features Enabled:
- ✅ Haptic feedback on button clicks
- ✅ Theme integration (adapts to Telegram's dark/light mode)
- ✅ Native back button support
- ✅ Safe link opening within Telegram

---

## 2. ✅ Progressive Web App (PWA)

Your wallet can be **installed directly from the browser**!

### How Users Install:

**On iPhone:**
1. Open the wallet URL in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

**On Android:**
1. Open the wallet URL in Chrome
2. Tap the menu (3 dots)
3. Select "Install app" or "Add to Home screen"
4. Tap "Install"

### PWA Features Enabled:
- ✅ Offline support
- ✅ Fast loading with service worker caching
- ✅ Home screen icon
- ✅ Splash screen
- ✅ Standalone app experience

### Install Page:
Users can visit `/install` for installation instructions and quick install button (on supported browsers).

---

## 3. ✅ Native Mobile Apps (Capacitor)

Your wallet is configured for **App Store and Google Play**!

### To Build Native Apps:

1. **Export to GitHub:**
   - Click "Export to GitHub" button in Lovable
   - Clone your repository locally

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Initialize Capacitor (first time only):**
   ```bash
   npx cap init
   ```
   The config is already set in `capacitor.config.ts`

4. **Add Platforms:**
   ```bash
   # For iOS (Mac with Xcode required)
   npx cap add ios
   
   # For Android (Android Studio required)
   npx cap add android
   ```

5. **Build Your App:**
   ```bash
   npm run build
   npx cap sync
   ```

6. **Run on Device/Emulator:**
   ```bash
   # For iOS
   npx cap run ios
   
   # For Android
   npx cap run android
   ```

### Development with Hot Reload:
The app is configured to load from the Lovable sandbox URL for easy development. When ready for production:
1. Remove the `server` section from `capacitor.config.ts`
2. Build and sync again

### Publishing:
- **iOS:** Use Xcode to archive and submit to App Store
- **Android:** Use Android Studio to generate a signed APK/AAB for Google Play

---

## Platform Comparison

| Feature | Telegram | PWA | Native App |
|---------|----------|-----|------------|
| No installation needed | ✅ | ❌ | ❌ |
| Works offline | ❌ | ✅ | ✅ |
| App Store presence | ❌ | ❌ | ✅ |
| Push notifications | Limited | Limited | ✅ Full |
| Camera access | Limited | Limited | ✅ Full |
| Biometric auth | ❌ | Limited | ✅ Full |
| Setup complexity | Easy | Easy | Advanced |

---

## Next Steps

Choose your deployment path based on your needs:

- **Quick launch?** → Use Telegram Mini App
- **No app store hassle?** → Use PWA
- **Full native features?** → Build native apps with Capacitor

For more help, check out:
- [Telegram Bot Documentation](https://core.telegram.org/bots/webapps)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
