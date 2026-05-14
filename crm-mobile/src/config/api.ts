import Constants from 'expo-constants';
import { Platform } from 'react-native';

// On web dev, use the Metro proxy (same port) to avoid CORS
// On native, use the direct backend URL
const isWebDev = Platform.OS === 'web' && __DEV__;

export const API_URL = isWebDev
  ? '/api/v1'
  : Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8081/api/v1';

export const API_TIMEOUT = 30000;
