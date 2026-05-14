import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Snackbar } from 'react-native-paper';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/stores/authStore';
import { handleApiError } from '../../src/api/client';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setTokens, setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email: email.trim(), password });
      await setTokens(res.accessToken, res.refreshToken);
      const user = await authApi.getCurrentUser(res.accessToken);
      setUser(user);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top teal section */}
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>◈</Text>
          </View>
          <Text style={styles.appName}>OptiCRM</Text>
          <Text style={styles.appSub}>Gestion commerciale terrain</Text>
        </View>

        {/* White card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenue 👋</Text>
          <Text style={styles.cardSub}>Connectez-vous pour continuer</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="votre@email.com"
              left={<TextInput.Icon icon="email-outline" color={COLORS.text4} />}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              disabled={loading}
              placeholderTextColor={COLORS.text5}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="••••••••"
              left={<TextInput.Icon icon="lock-outline" color={COLORS.text4} />}
              right={
                <TextInput.Icon
                  icon={showPass ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPass(!showPass)}
                  color={COLORS.text4}
                />
              }
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              disabled={loading}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'Connexion...' : 'Se connecter →'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>OptiCRM © 2026 — Terrain Edition</Text>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3500}
        style={styles.snack}
        action={{ label: '✕', onPress: () => setError(''), labelStyle: { color: '#fff' } }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1 },
  topSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 36, color: '#fff' },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  appSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  card: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    padding: 28,
    paddingTop: 36,
    minHeight: 420,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text1,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardSub: { fontSize: 14, color: COLORS.text3, marginBottom: 28, fontWeight: '400' },
  inputWrap: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text2, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOW.teal,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
  },
  snack: { backgroundColor: COLORS.error },
});
