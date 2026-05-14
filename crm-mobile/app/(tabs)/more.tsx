import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUnreadCount } from '../../src/hooks/useNotifications';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, SHADOW, RADIUS } from '../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

// ─── MenuItem ──────────────────────────────────────────────────────────────────
interface MenuItemProps {
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  badge?: number | null;
  danger?: boolean;
}

function MenuItem({ iconName, iconColor, iconBg, label, sublabel, onPress, badge, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={mi.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[mi.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={mi.info}>
        <Text style={[mi.label, danger && { color: COLORS.rose }]}>{label}</Text>
        {sublabel ? <Text style={mi.sub}>{sublabel}</Text> : null}
      </View>
      {badge != null && badge > 0 ? (
        <View style={mi.badge}>
          <Text style={mi.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.text5} />
      )}
    </TouchableOpacity>
  );
}

const mi = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text1 },
  sub: { fontSize: 12, color: COLORS.text3, marginTop: 1 },
  badge: {
    backgroundColor: COLORS.rose, borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

// ─── SectionCard ───────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sc.wrap}>
      <Text style={sc.title}>{title}</Text>
      <View style={sc.card}>{children}</View>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap: { marginBottom: 20 },
  title: {
    fontSize: 11, fontWeight: '700', color: COLORS.text3,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    overflow: 'hidden', ...SHADOW.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
});

function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginLeft: 68 }} />;
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: unreadCount } = useUnreadCount();
  const initials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'U';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Menu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{String(user?.role || 'COMMERCIAL')}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* ── Terrain & Commerce ── */}
        <SectionCard title="Terrain & Commerce">
          <MenuItem
            iconName="account-group-outline"
            iconColor={COLORS.blue}
            iconBg={COLORS.blueLight}
            label="Contacts"
            sublabel="Carnet de contacts"
            onPress={() => router.push('/(tabs)/contacts')}
          />
          <Divider />
          <MenuItem
            iconName="account-arrow-right-outline"
            iconColor={COLORS.accent}
            iconBg={COLORS.accentMid}
            label="Leads"
            sublabel="Prospects & opportunités"
            onPress={() => router.push('/(tabs)/leads')}
          />
          <Divider />
          <MenuItem
            iconName="chart-timeline-variant-shimmer"
            iconColor={COLORS.purple}
            iconBg={COLORS.purpleLight}
            label="Opportunités"
            sublabel="Pipeline commercial"
            onPress={() => router.push('/(tabs)/opportunities')}
          />
          <Divider />
          <MenuItem
            iconName="routes"
            iconColor={COLORS.primary}
            iconBg={COLORS.primaryLight}
            label="Tournées"
            sublabel="Planification terrain"
            onPress={() => router.push('/(tabs)/tours')}
          />
          <Divider />
          <MenuItem
            iconName="office-building-outline"
            iconColor="#EF4444"
            iconBg="#FEE2E2"
            label="Chantiers"
            sublabel="Suivi des chantiers"
            onPress={() => router.push('/(tabs)/chantiers')}
          />
          <Divider />
          <MenuItem
            iconName="map-outline"
            iconColor={COLORS.blue}
            iconBg={COLORS.blueLight}
            label="Carte interactive"
            sublabel="Vue géographique"
            onPress={() => router.push('/(tabs)/map')}
          />
          <Divider />
          <MenuItem
            iconName="calendar-month-outline"
            iconColor={COLORS.purple}
            iconBg={COLORS.purpleLight}
            label="Planning"
            sublabel="Calendrier activités"
            onPress={() => router.push('/(tabs)/planning')}
          />
        </SectionCard>

        {/* ── Finance ── */}
        <SectionCard title="Finance">
          <MenuItem
            iconName="file-document-outline"
            iconColor={COLORS.blue}
            iconBg={COLORS.blueLight}
            label="Devis"
            sublabel="Créer et suivre les devis"
            onPress={() => router.push('/(tabs)/quotes')}
          />
          <Divider />
          <MenuItem
            iconName="receipt"
            iconColor={COLORS.primary}
            iconBg={COLORS.primaryLight}
            label="Factures"
            sublabel="Consultation uniquement"
            onPress={() => router.push('/(tabs)/invoices')}
          />
          <Divider />
          <MenuItem
            iconName="credit-card-outline"
            iconColor={COLORS.success}
            iconBg={COLORS.successLight}
            label="Paiements"
            sublabel="Saisie des règlements"
            onPress={() => router.push('/(tabs)/payments')}
          />
        </SectionCard>

        {/* ── Analyse & Suivi ── */}
        <SectionCard title="Analyse & Suivi">
          <MenuItem
            iconName="chart-box-outline"
            iconColor={COLORS.accent}
            iconBg={COLORS.accentMid}
            label="Mes rapports"
            sublabel="KPIs et performances"
            onPress={() => router.push('/(tabs)/reports')}
          />
          <Divider />
          <MenuItem
            iconName="bell-outline"
            iconColor={COLORS.primary}
            iconBg={COLORS.primaryLight}
            label="Notifications"
            sublabel={unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : undefined}
            badge={unreadCount}
            onPress={() => router.push('/(tabs)/notifications')}
          />
        </SectionCard>

        {/* ── Mon compte ── */}
        <SectionCard title="Mon compte">
          <MenuItem
            iconName="account-circle-outline"
            iconColor={COLORS.text3}
            iconBg={COLORS.surface2}
            label="Mon profil"
            sublabel="Informations personnelles"
            onPress={() => router.push('/(tabs)/profile')}
          />
          <Divider />
          <MenuItem
            iconName="logout"
            iconColor={COLORS.rose}
            iconBg="#FEE2E2"
            label="Se déconnecter"
            onPress={() => logout()}
            danger
          />
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text1, letterSpacing: -0.5 },
  scroll: { padding: 16 },
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xxl, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 24, ...SHADOW.teal,
  },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  profileInitials: { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginTop: 6,
  },
  roleText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
