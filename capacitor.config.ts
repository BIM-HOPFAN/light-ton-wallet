import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3b5bcb720fee4dbaa62ea67a57875e91',
  appName: 'Bimlight Bank',
  webDir: 'dist',
  server: {
    url: 'https://3b5bcb72-0fee-4dba-a62e-a67a57875e91.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small"
    }
  }
};

export default config;
