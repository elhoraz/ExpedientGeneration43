export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    iosScheme?: string;
    url?: string;
    cleartext?: boolean;
    allowNavigation?: string[];
  };
  ios?: {
    contentInset?: 'automatic' | 'scrollable' | 'never' | 'always';
    preferredContentMode?: 'mobile' | 'desktop';
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.expedient43.app',
  appName: 'Expedient 43',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Live reload / Server wrap URL when deployed to production
    url: process.env.CAPACITOR_SERVER_URL || 'https://expedientgeneration.vercel.app',
    cleartext: false,
    allowNavigation: [
      'expedientgeneration.vercel.app',
      '*.supabase.co',
      '*.agora.io',
      '*.sd-rtn.com',
      '*.tile.openstreetmap.org',
    ],
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#060b14',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#060b14',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
