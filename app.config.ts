import './scripts/load-env.js';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'معتز العلقمي',
  slug: 'moataz-alalqami',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'moatazalalqami',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.moataz.alalqami',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.moataz.alalqami',
    adaptiveIcon: {
      backgroundColor: '#F7EFE3',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F7EFE3',
        dark: {
          backgroundColor: '#15110C',
        },
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          buildArchs: ['arm64-v8a', 'armeabi-v7a'],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'd691cef7-dcdb-4488-99ca-0ba065b0f378',
    },
  },
  experiments: {
    typedRoutes: true,  },
};

export default config;
