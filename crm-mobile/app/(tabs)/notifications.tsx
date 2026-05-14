import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Text, Card, Icon, IconButton, Appbar, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../src/hooks/useNotifications';
import type { Notification } from '../../src/types/notification';
import { formatRelativeDate } from '../../src/utils/formatting';
import LoadingScreen from '../../src/components/ui/LoadingScreen';
import ErrorView from '../../src/components/ui/ErrorView';
import EmptyState from '../../src/components/ui/EmptyState';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllMutation = useMarkAllAsRead();

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: Notification }) => (
    <Card
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => {
        if (!item.isRead) markAsReadMutation.mutate(item.id);
      }}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, !item.isRead && styles.unreadIcon]}>
            <Icon
              source={
                item.type === 'lead' ? 'account-arrow-right-outline' :
                item.type === 'opportunity' ? 'trending-up' :
                item.type === 'visit' ? 'map-marker-outline' :
                item.type === 'activity' ? 'calendar-outline' :
                'bell-outline'
              }
              size={20}
              color={!item.isRead ? '#1976D2' : '#9E9E9E'}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {item.message && (
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            )}
            <Text style={styles.time}>{formatRelativeDate(item.createdAt)}</Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </Card.Content>
    </Card>
  ), [markAsReadMutation]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title="Notifications" titleStyle={styles.appbarTitle} />
        <Appbar.Action
          icon="check-circle-outline"
          color="#FFFFFF"
          onPress={() => markAllMutation.mutate()}
        />
      </Appbar.Header>

      <FlatList
        data={data?.content || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState title="Aucune notification" icon="bell-off-outline" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#1976D2' },
  appbarTitle: { color: '#FFFFFF', fontWeight: '600' },
  list: { padding: 12 },
  card: { marginBottom: 8, elevation: 1 },
  unreadCard: { elevation: 2, borderLeftWidth: 3, borderLeftColor: '#1976D2' },
  cardContent: { paddingVertical: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  unreadIcon: { backgroundColor: '#E3F2FD' },
  cardInfo: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', color: '#212121' },
  unreadTitle: { fontWeight: '700' },
  message: { fontSize: 13, color: '#607D8B', marginTop: 2 },
  time: { fontSize: 12, color: '#9E9E9E', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1976D2', marginTop: 6 },
});
