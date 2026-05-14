import { Stack } from 'expo-router';
import { COLORS } from '../../../src/config/theme';

const HEADER = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
};

export default function OpportunitiesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"  options={{ headerShown: false }} />
      <Stack.Screen name="[id]"   options={{ ...HEADER, title: 'Opportunité' }} />
      <Stack.Screen name="create" options={{ ...HEADER, title: 'Nouvelle opportunité' }} />
    </Stack>
  );
}
