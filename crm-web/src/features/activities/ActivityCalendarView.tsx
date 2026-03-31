import { useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import { message } from 'antd';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCalendarEvents, rescheduleActivity } from './activitiesSlice';

const typeColors: Record<string, string> = {
  call: '#1890ff',
  email: '#13c2c2',
  meeting: '#722ed1',
  task: '#fa8c16',
  note: '#8c8c8c',
};

interface Props {
  onEventClick: (id: string) => void;
  onDateClick: () => void;
  onEventReschedule?: (id: string, start: string, end?: string) => void;
}

export default function ActivityCalendarView({ onEventClick, onDateClick, onEventReschedule }: Props) {
  const dispatch = useAppDispatch();
  const { calendarEvents } = useAppSelector((state) => state.activities);

  const loadEvents = useCallback((start: string, end: string) => {
    dispatch(fetchCalendarEvents({ from: start, to: end }));
  }, [dispatch]);

  const handleEventDrop = async (info: any) => {
    const id = info.event.id;
    const startDate = info.event.start?.toISOString();
    const endDate = info.event.end?.toISOString();

    try {
      await dispatch(rescheduleActivity({ id, startDate, endDate })).unwrap();
      message.success('Activit\u00e9 replanifi\u00e9e');
      if (onEventReschedule) {
        onEventReschedule(id, startDate, endDate);
      }
      // Reload events
      if (info.view) {
        loadEvents(info.view.currentStart.toISOString(), info.view.currentEnd.toISOString());
      }
    } catch {
      info.revert();
      message.error('Erreur lors de la replanification');
    }
  };

  const handleEventResize = async (info: any) => {
    const id = info.event.id;
    const startDate = info.event.start?.toISOString();
    const endDate = info.event.end?.toISOString();

    try {
      await dispatch(rescheduleActivity({ id, startDate, endDate })).unwrap();
      message.success('Activit\u00e9 replanifi\u00e9e');
      if (onEventReschedule) {
        onEventReschedule(id, startDate, endDate);
      }
      // Reload events
      if (info.view) {
        loadEvents(info.view.currentStart.toISOString(), info.view.currentEnd.toISOString());
      }
    } catch {
      info.revert();
      message.error('Erreur lors de la replanification');
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    loadEvents(start, end);
  }, [loadEvents]);

  const events = calendarEvents.map((event) => ({
    id: event.id,
    title: event.subject,
    start: event.startDate,
    end: event.endDate || event.startDate,
    backgroundColor: typeColors[event.activityType] || '#1890ff',
    borderColor: typeColors[event.activityType] || '#1890ff',
    extendedProps: {
      type: event.activityType,
      status: event.status,
      priority: event.priority,
    },
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      }}
      locale={frLocale}
      events={events}
      eventClick={(info) => onEventClick(info.event.id)}
      dateClick={() => onDateClick()}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      datesSet={(info) => {
        loadEvents(info.startStr, info.endStr);
      }}
      height="auto"
      editable={true}
      selectable
      dayMaxEvents={3}
      buttonText={{
        today: "Aujourd'hui",
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        list: 'Liste',
      }}
    />
  );
}
