import { useEffect, useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import { Card, Space, Select, Tag, Drawer, Descriptions, Button, message } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  FileTextOutlined,
  FormOutlined,
  EnvironmentOutlined,
  CarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { activitiesApi } from '@/api/activities';
import { visitsApi } from '@/api/visits';
import { toursApi } from '@/api/tours';
import { tasksApi } from '@/api/projects';
import { ticketsApi } from '@/api/tickets';
import { ActivityListItem, ACTIVITY_TYPES } from '@/types/activity';
import { VisitListItem, VISIT_TYPES } from '@/types/visit';
import { TourListItem } from '@/types/tour';
import type { TaskListItem } from '@/types/project';
import type { TicketListItem } from '@/types/ticket';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor?: string;
  extendedProps: {
    source: 'activity' | 'visit' | 'tour' | 'task' | 'ticket';
    type?: string;
    status?: string;
    data: ActivityListItem | VisitListItem | TourListItem | TaskListItem | TicketListItem;
  };
}

const activityTypeColors: Record<string, string> = {
  call: '#1890ff',
  email: '#13c2c2',
  meeting: '#722ed1',
  task: '#fa8c16',
  note: '#8c8c8c',
};

const typeIcons: Record<string, React.ReactNode> = {
  call: <PhoneOutlined />,
  email: <MailOutlined />,
  meeting: <TeamOutlined />,
  task: <FileTextOutlined />,
  note: <FormOutlined />,
};

type FilterSource = 'all' | 'activities' | 'visits' | 'tours' | 'tasks' | 'tickets';

const taskPriorityColors: Record<string, string> = {
  CRITIQUE: '#ff4d4f',
  HAUTE: '#fa8c16',
  NORMALE: '#6366f1',
  BASSE: '#8c8c8c',
};

const ticketPriorityColors: Record<string, string> = {
  CRITIQUE: '#cf1322',
  HAUTE: '#ff4d4f',
  NORMALE: '#fa8c16',
  BASSE: '#bfbfbf',
};

export default function PlanningPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const loadEvents = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [];

      if (sourceFilter === 'all' || sourceFilter === 'activities') {
        promises.push(activitiesApi.getCalendarEvents(start, end));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (sourceFilter === 'all' || sourceFilter === 'visits') {
        promises.push(visitsApi.getCalendarEvents(start, end));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (sourceFilter === 'all' || sourceFilter === 'tours') {
        promises.push(
          toursApi.getAll({ size: 100 }).then((res) => {
            return res.content.filter((t) => {
              const tourDate = t.tourDate;
              return tourDate >= start.substring(0, 10) && tourDate <= end.substring(0, 10);
            });
          })
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      if (sourceFilter === 'all' || sourceFilter === 'tasks') {
        promises.push(
          tasksApi.getMyTasks().then((tasks) => {
            const startDate = start.substring(0, 10);
            const endDate = end.substring(0, 10);
            return tasks.filter((t) => t.dueDate && t.dueDate >= startDate && t.dueDate <= endDate);
          }).catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      if (sourceFilter === 'all' || sourceFilter === 'tickets') {
        promises.push(
          ticketsApi.getAll({ size: 200 }).then((res) => {
            const startDate = start.substring(0, 10);
            const endDate = end.substring(0, 10);
            return res.content.filter((tk) => {
              if (!tk.slaDeadline) return false;
              const d = tk.slaDeadline.substring(0, 10);
              return d >= startDate && d <= endDate;
            });
          }).catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      const [activities, visits, tours, tasks, tickets] = await Promise.all(promises);

      const calEvents: CalendarEvent[] = [];

      // Map activities
      (activities as ActivityListItem[]).forEach((a) => {
        calEvents.push({
          id: `activity-${a.id}`,
          title: `${a.subject}`,
          start: a.startDate || a.createdAt,
          end: a.endDate || undefined,
          backgroundColor: activityTypeColors[a.activityType] || '#1890ff',
          borderColor: activityTypeColors[a.activityType] || '#1890ff',
          extendedProps: {
            source: 'activity',
            type: a.activityType,
            status: a.status,
            data: a,
          },
        });
      });

      // Map visits (green)
      (visits as VisitListItem[]).forEach((v) => {
        calEvents.push({
          id: `visit-${v.id}`,
          title: `📍 ${v.subject}`,
          start: v.visitDate,
          backgroundColor: '#52c41a',
          borderColor: '#52c41a',
          extendedProps: {
            source: 'visit',
            type: v.visitType,
            status: v.status,
            data: v,
          },
        });
      });

      // Map tours (orange, all-day)
      (tours as TourListItem[]).forEach((t) => {
        calEvents.push({
          id: `tour-${t.id}`,
          title: `🚗 ${t.name}`,
          start: t.tourDate,
          allDay: true,
          backgroundColor: '#fa8c16',
          borderColor: '#fa8c16',
          textColor: '#fff',
          extendedProps: {
            source: 'tour',
            type: undefined,
            status: t.status,
            data: t,
          },
        });
      });

      // Map tasks (indigo, allDay on dueDate)
      (tasks as TaskListItem[]).forEach((t) => {
        const color = taskPriorityColors[t.priority] || '#6366f1';
        calEvents.push({
          id: `task-${t.id}`,
          title: `✓ ${t.title}`,
          start: t.dueDate!,
          allDay: true,
          backgroundColor: color,
          borderColor: color,
          textColor: '#fff',
          extendedProps: {
            source: 'task',
            type: t.type,
            status: t.status,
            data: t,
          },
        });
      });

      // Map tickets (red, allDay on slaDeadline)
      (tickets as TicketListItem[]).forEach((tk) => {
        const color = ticketPriorityColors[tk.priority] || '#ff4d4f';
        calEvents.push({
          id: `ticket-${tk.id}`,
          title: `🎫 ${tk.reference} ${tk.title}`,
          start: tk.slaDeadline!,
          allDay: true,
          backgroundColor: color,
          borderColor: color,
          textColor: '#fff',
          extendedProps: {
            source: 'ticket',
            type: tk.category,
            status: tk.status,
            data: tk,
          },
        });
      });

      setEvents(calEvents);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [sourceFilter]);

  useEffect(() => {
    if (dateRange) {
      loadEvents(dateRange.start, dateRange.end);
    }
  }, [dateRange, loadEvents]);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    setDateRange({ start, end });
  }, []);

  const handleEventClick = (info: any) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setDrawerOpen(true);
    }
  };

  const handleEventDrop = async (info: any) => {
    const eventId = info.event.id as string;
    const source = info.event.extendedProps?.source;

    // Tours and tickets cannot be dragged
    if (source === 'tour' || source === 'ticket') {
      info.revert();
      return;
    }

    const realId = eventId.replace(/^(activity|visit|tour|task|ticket)-/, '');

    try {
      if (source === 'activity') {
        await activitiesApi.update(realId, {
          startDate: info.event.start.toISOString(),
          endDate: info.event.end?.toISOString(),
        } as any);
      } else if (source === 'visit') {
        await visitsApi.update(realId, {
          visitDate: info.event.start.toISOString(),
        } as any);
      } else if (source === 'task') {
        await tasksApi.update(realId, {
          dueDate: info.event.start.toISOString().substring(0, 10),
        } as any);
      }
      message.success('Replanifi\u00e9 avec succ\u00e8s');
      if (dateRange) loadEvents(dateRange.start, dateRange.end);
    } catch {
      info.revert();
      message.error('Erreur lors de la replanification');
    }
  };

  const handleEventResize = async (info: any) => {
    const eventId = info.event.id as string;
    const source = info.event.extendedProps?.source;

    // Tours, tasks and tickets cannot be resized
    if (source === 'tour' || source === 'task' || source === 'ticket') {
      info.revert();
      return;
    }

    const realId = eventId.replace(/^(activity|visit|tour|task|ticket)-/, '');

    try {
      if (source === 'activity') {
        await activitiesApi.update(realId, {
          startDate: info.event.start.toISOString(),
          endDate: info.event.end?.toISOString(),
        } as any);
      } else if (source === 'visit') {
        await visitsApi.update(realId, {
          visitDate: info.event.start.toISOString(),
        } as any);
      }
      message.success('Replanifi\u00e9 avec succ\u00e8s');
      if (dateRange) loadEvents(dateRange.start, dateRange.end);
    } catch {
      info.revert();
      message.error('Erreur lors de la replanification');
    }
  };

  const renderDrawerContent = () => {
    if (!selectedEvent) return null;
    const { source, data } = selectedEvent.extendedProps;

    if (source === 'activity') {
      const a = data as ActivityListItem;
      const typeConfig = ACTIVITY_TYPES.find((t) => t.value === a.activityType);
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Type">
            <Tag icon={typeIcons[a.activityType]} color={typeConfig?.color}>{typeConfig?.label || a.activityType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Sujet">{a.subject}</Descriptions.Item>
          <Descriptions.Item label="Début">{a.startDate ? dayjs(a.startDate).format('DD/MM/YYYY HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Fin">{a.endDate ? dayjs(a.endDate).format('DD/MM/YYYY HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Échéance">{a.dueDate ? dayjs(a.dueDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Statut"><Tag>{a.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="Priorité"><Tag>{a.priority}</Tag></Descriptions.Item>
          <Descriptions.Item label="Assigné à">{a.assignedToName || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }

    if (source === 'visit') {
      const v = data as VisitListItem;
      const typeConfig = VISIT_TYPES.find((t) => t.value === v.visitType);
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Type">
            <Tag icon={<EnvironmentOutlined />} color={typeConfig?.color}>{typeConfig?.label || v.visitType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Sujet">{v.subject}</Descriptions.Item>
          <Descriptions.Item label="Date">{dayjs(v.visitDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Adresse">{v.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="Ville">{v.city || '-'}</Descriptions.Item>
          <Descriptions.Item label="Contact">{v.contactName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Compte">{v.accountName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Statut"><Tag>{v.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="Assigné à">{v.assignedToName || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }

    if (source === 'tour') {
      const t = data as TourListItem;
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Nom">{t.name}</Descriptions.Item>
          <Descriptions.Item label="Date">{dayjs(t.tourDate).format('DD/MM/YYYY')}</Descriptions.Item>
          <Descriptions.Item label="Région">{t.region || '-'}</Descriptions.Item>
          <Descriptions.Item label="Statut"><Tag>{t.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="Progression">{t.completedVisits}/{t.totalVisits} visites</Descriptions.Item>
          <Descriptions.Item label="Assigné à">{t.assignedToName || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }

    if (source === 'task') {
      const t = data as TaskListItem;
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Titre">{t.title}</Descriptions.Item>
          <Descriptions.Item label="Projet">{t.projectName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Milestone">{t.milestoneName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Type"><Tag>{t.type}</Tag></Descriptions.Item>
          <Descriptions.Item label="Priorité">
            <Tag color={taskPriorityColors[t.priority]}>{t.priority}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Statut"><Tag>{t.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="Échéance">{t.dueDate ? dayjs(t.dueDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Assigné à">{t.assigneeName || '-'}</Descriptions.Item>
          {t.overdue && (
            <Descriptions.Item label=""><Tag color="red">En retard</Tag></Descriptions.Item>
          )}
        </Descriptions>
      );
    }

    if (source === 'ticket') {
      const tk = data as TicketListItem;
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Référence"><Tag style={{ fontFamily: 'monospace' }}>{tk.reference}</Tag></Descriptions.Item>
          <Descriptions.Item label="Titre">{tk.title}</Descriptions.Item>
          <Descriptions.Item label="Catégorie"><Tag>{tk.category}</Tag></Descriptions.Item>
          <Descriptions.Item label="Priorité">
            <Tag color={ticketPriorityColors[tk.priority]}>{tk.priority}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Statut"><Tag>{tk.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="SLA échéance">
            {tk.slaDeadline ? dayjs(tk.slaDeadline).format('DD/MM/YYYY HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Compte">{tk.accountName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Assigné à">{tk.assignedToName || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }

    return null;
  };

  const getDrawerTitle = () => {
    if (!selectedEvent) return '';
    const { source } = selectedEvent.extendedProps;
    const icons: Record<string, React.ReactNode> = {
      activity: <FileTextOutlined />,
      visit: <EnvironmentOutlined />,
      tour: <CarOutlined />,
      task: <FileTextOutlined />,
      ticket: <FormOutlined />,
    };
    const labels: Record<string, string> = {
      activity: 'Activité',
      visit: 'Visite',
      tour: 'Tournée',
      task: 'Tâche',
      ticket: 'Ticket',
    };
    return (
      <Space>
        {icons[source]}
        <span>{labels[source]}</span>
      </Space>
    );
  };

  return (
    <div className="page-container">
      <Card
        title="Planning"
        extra={
          <Space>
            <Select
              value={sourceFilter}
              onChange={setSourceFilter}
              style={{ width: 180 }}
              options={[
                { value: 'all', label: 'Tout afficher' },
                { value: 'activities', label: 'Activités' },
                { value: 'visits', label: 'Visites' },
                { value: 'tours', label: 'Tournées' },
                { value: 'tasks', label: 'Tâches (mes)' },
                { value: 'tickets', label: 'Tickets (SLA)' },
              ]}
            />
          </Space>
        }
      >
        <Space style={{ marginBottom: 12 }} wrap>
          <Tag color="#1890ff">Appel</Tag>
          <Tag color="#13c2c2">Email</Tag>
          <Tag color="#722ed1">Réunion</Tag>
          <Tag color="#fa8c16">Tâche act. / Tournée</Tag>
          <Tag color="#52c41a">Visite</Tag>
          <Tag color="#6366f1">Tâche projet</Tag>
          <Tag color="#ff4d4f">Ticket SLA</Tag>
        </Space>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          locale={frLocale}
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            allDay: e.allDay,
            backgroundColor: e.backgroundColor,
            borderColor: e.borderColor,
            textColor: e.textColor,
            editable: e.extendedProps.source !== 'tour',
            extendedProps: e.extendedProps,
          }))}
          loading={(isLoading) => setLoading(isLoading)}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          datesSet={(info) => {
            setDateRange({ start: info.startStr, end: info.endStr });
          }}
          height="auto"
          editable={true}
          selectable
          dayMaxEvents={4}
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            list: 'Liste',
          }}
        />
      </Card>

      <Drawer
        title={getDrawerTitle()}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        footer={
          <Button onClick={() => setDrawerOpen(false)}>Fermer</Button>
        }
      >
        {renderDrawerContent()}
      </Drawer>
    </div>
  );
}
