import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Card, Text, Chip, Icon, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useActivities } from '../../../src/hooks/useActivities';
import { useVisits } from '../../../src/hooks/useVisits';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDaysInMonth(year: number, month: number): (number | null)[] {
  const days: (number | null)[] = [];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Convert Sunday=0 to Monday=0
  const startOffset = (firstDay + 6) % 7;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function PlanningScreen() {
  const router = useRouter();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({ search: undefined });
  const { data: visitsData, isLoading: visitsLoading } = useVisits({ search: undefined });

  const activities = activitiesData?.content || [];
  const visits = visitsData?.content || [];

  const hasEvents = (day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return (
      activities.some((a: any) => a.dueDate?.startsWith(dateStr)) ||
      visits.some((v: any) => v.visitDate?.startsWith(dateStr))
    );
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      activities: activities.filter((a: any) => a.dueDate?.startsWith(dateStr)),
      visits: visits.filter((v: any) => v.visitDate?.startsWith(dateStr)),
    };
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const days = getDaysInMonth(year, month);

  const selectedDay = selectedDate.getDate();
  const isCurrentMonthSelected =
    selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  const eventsForSelected = isCurrentMonthSelected
    ? getEventsForDay(selectedDay)
    : { activities: [], visits: [] };

  const todayDay = today.getDate();
  const isCurrentMonthToday = today.getMonth() === month && today.getFullYear() === year;

  if (activitiesLoading || visitsLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Planning" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Navigation mois */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
            <Icon source="chevron-left" size={28} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS_FR[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
            <Icon source="chevron-right" size={28} color="#1976D2" />
          </TouchableOpacity>
        </View>

        {/* En-têtes jours */}
        <View style={styles.daysHeader}>
          {DAYS_FR.map(d => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Grille calendrier */}
        <View style={styles.grid}>
          {days.map((day, i) => {
            if (day === null) {
              return <View key={`empty-${i}`} style={styles.dayCell} />;
            }
            const isSelected =
              isCurrentMonthSelected && day === selectedDay;
            const isToday = isCurrentMonthToday && day === todayDay;
            const hasEv = hasEvents(day);

            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDay,
                  isToday && !isSelected && styles.today,
                ]}
                onPress={() => setSelectedDate(new Date(year, month, day))}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayText,
                  ]}
                >
                  {day}
                </Text>
                {hasEv && (
                  <View style={[styles.dot, isSelected && styles.dotWhite]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Événements du jour sélectionné */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>
            {isCurrentMonthSelected
              ? `${selectedDay} ${MONTHS_FR[selectedDate.getMonth()]} — ${eventsForSelected.activities.length + eventsForSelected.visits.length} événement(s)`
              : 'Sélectionnez un jour'}
          </Text>

          {eventsForSelected.visits.map((v: any) => (
            <Card
              key={v.id}
              style={styles.eventCard}
              onPress={() => router.push(`/(tabs)/visits/${v.id}` as any)}
            >
              <Card.Content style={styles.eventContent}>
                <Icon source="map-marker-check" size={20} color="#4CAF50" />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {v.subject || 'Visite'}
                  </Text>
                  <Text style={styles.eventSub} numberOfLines={1}>
                    {v.accountName || ''}
                  </Text>
                </View>
                <Chip compact style={styles.visitChip}>
                  Visite
                </Chip>
              </Card.Content>
            </Card>
          ))}

          {eventsForSelected.activities.map((a: any) => (
            <Card
              key={a.id}
              style={styles.eventCard}
              onPress={() => router.push(`/(tabs)/activities/${a.id}` as any)}
            >
              <Card.Content style={styles.eventContent}>
                <Icon source="calendar-check-outline" size={20} color="#9C27B0" />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {a.subject || a.title || 'Activité'}
                  </Text>
                  <Text style={styles.eventSub} numberOfLines={1}>
                    {a.accountName || ''}
                  </Text>
                </View>
                <Chip compact style={styles.activityChip}>
                  Activité
                </Chip>
              </Card.Content>
            </Card>
          ))}

          {isCurrentMonthSelected &&
            eventsForSelected.activities.length === 0 &&
            eventsForSelected.visits.length === 0 && (
              <Text style={styles.noEvents}>Aucun événement ce jour</Text>
            )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/activities/create' as any)}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#1976D2' },
  appbarTitle: { color: '#FFFFFF', fontWeight: '600' },
  scroll: { paddingBottom: 80 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  navBtn: { padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#212121' },
  daysHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#607D8B',
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#1976D2',
    borderRadius: 50,
  },
  today: {
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 50,
  },
  dayText: { fontSize: 14, color: '#212121' },
  selectedDayText: { color: '#FFFFFF', fontWeight: '700' },
  todayText: { color: '#1976D2', fontWeight: '700' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1976D2',
    marginTop: 2,
  },
  dotWhite: { backgroundColor: '#FFFFFF' },
  eventsSection: { padding: 16 },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  eventCard: { marginBottom: 8, elevation: 1 },
  eventContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#212121' },
  eventSub: { fontSize: 12, color: '#607D8B' },
  visitChip: { backgroundColor: '#4CAF5020' },
  activityChip: { backgroundColor: '#9C27B020' },
  noEvents: { textAlign: 'center', color: '#9E9E9E', marginTop: 16 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#1976D2',
  },
});
