import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ubaidi5.hush.capacitor',
  appName: 'Hush',
  webDir: 'dist',
  backgroundColor: '#f6f4ef',
  ios: {
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchFadeOutDuration: 250,
      backgroundColor: '#151413',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      iconColor: '#d99a3a',
    },
  },
}

export default config
