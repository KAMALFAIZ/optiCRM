import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'OptiCRM',
  slug: 'opticrm-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'opticrm',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1976D2',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.opticrm.mobile',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'OptiCRM utilise votre position pour le check-in des visites et la géolocalisation des comptes.',
      NSLocationAlwaysUsageDescription:
        'OptiCRM utilise votre position pour suivre vos visites terrain.',
      NSCameraUsageDescription:
        'OptiCRM utilise la caméra pour prendre des photos des comptes clients.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1976D2',
    },
    package: 'com.opticrm.mobile',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
      'NOTIFICATIONS',
    ],
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-font',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'OptiCRM utilise votre position pour le suivi des visites terrain.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1976D2',
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api/v1',
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});
