import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/config/theme';

// Professional teal icon tab button
function TabIcon({
  name,
  focused,
  color,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  focused: boolean;
  color: string;
}) {
  return (
    <View style={[ts.wrap, focused && ts.wrapActive]}>
      <MaterialCommunityIcons name={name} size={22} color={focused ? COLORS.primary : COLORS.text4} />
    </View>
  );
}

const ts = StyleSheet.create({
  wrap: {
    width: 46,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapActive: { backgroundColor: COLORS.primaryMid },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text4,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 68,
          paddingBottom: 10,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Comptes',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="domain" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: 'Visites',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="map-marker-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activités',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="calendar-check-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Plus',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="dots-grid" focused={focused} color={color} />
          ),
        }}
      />

      {/* Hidden tabs — accessible via More menu */}
      <Tabs.Screen name="contacts"      options={{ href: null }} />
      <Tabs.Screen name="leads"         options={{ href: null }} />
      <Tabs.Screen name="opportunities" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile"       options={{ href: null }} />
      <Tabs.Screen name="tours"         options={{ href: null }} />
      <Tabs.Screen name="chantiers"     options={{ href: null }} />
      <Tabs.Screen name="quotes"        options={{ href: null }} />
      <Tabs.Screen name="payments"      options={{ href: null }} />
      <Tabs.Screen name="invoices"      options={{ href: null }} />
      <Tabs.Screen name="reports"       options={{ href: null }} />
      <Tabs.Screen name="map"           options={{ href: null }} />
      <Tabs.Screen name="planning"      options={{ href: null }} />
    </Tabs>
  );
}
