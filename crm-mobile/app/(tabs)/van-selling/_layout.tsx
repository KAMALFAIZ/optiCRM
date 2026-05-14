import { Stack } from 'expo-router';
import { COLORS } from '../../../src/config/theme';

const HEADER = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
};

export default function VanSellingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"           options={{ headerShown: false }} />
      <Stack.Screen name="bl/index"        options={{ ...HEADER, title: 'Bons de livraison' }} />
      <Stack.Screen name="bl/create"       options={{ ...HEADER, title: 'Nouveau BL' }} />
      <Stack.Screen name="bl/[id]"         options={{ ...HEADER, title: 'Bon de livraison' }} />
      <Stack.Screen name="chargement/index" options={{ ...HEADER, title: 'Chargements' }} />
      <Stack.Screen name="retour/create"   options={{ ...HEADER, title: 'Retour fin de journée' }} />
    </Stack>
  );
}
