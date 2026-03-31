import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Divider, Appbar, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { formatDate } from '../../src/utils/formatting';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Voulez-vous vraiment vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title="Mon profil" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
              </Text>
            </View>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.role && <Text style={styles.role}>{user.role.name}</Text>}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Informations" />
          <Card.Content>
            <InfoRow label="Telephone" value={user?.phone} />
            <InfoRow label="Equipe" value={user?.team?.name} />
            <InfoRow label="Territoire" value={user?.territory?.name} />
            <InfoRow label="Region" value={user?.territory?.region} />
            <InfoRow label="Langue" value={user?.preferredLanguage} />
            <InfoRow label="Fuseau horaire" value={user?.timezone} />
            <InfoRow label="Derniere connexion" value={formatDate(user?.lastLoginAt)} />
            <InfoRow label="Membre depuis" value={formatDate(user?.createdAt)} />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutContent}
          buttonColor="#F44336"
        >
          Se deconnecter
        </Button>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#1976D2' },
  appbarTitle: { color: '#FFFFFF', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, elevation: 2 },
  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 28 },
  name: { fontSize: 22, fontWeight: '700', color: '#212121' },
  email: { fontSize: 14, color: '#607D8B', marginTop: 4 },
  role: { fontSize: 14, color: '#1976D2', marginTop: 4, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  logoutButton: { marginTop: 8, borderRadius: 8 },
  logoutContent: { height: 48 },
});
