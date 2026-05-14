import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Space, List, Tag, Progress } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';

import { activitiesApi } from '@/api/activities';
import { visitsApi } from '@/api/visits';
import { toursApi } from '@/api/tours';
import { ActivityListItem, ACTIVITY_TYPES } from '@/types/activity';
import { VisitListItem } from '@/types/visit';
import { TourListItem } from '@/types/tour';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const p = {
  blue:   { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.6)',  solid: '#60a5fa' },
  green:  { bg: 'rgba(74,222,128,0.15)',   border: 'rgba(74,222,128,0.6)',  solid: '#4ade80' },
  purple: { bg: 'rgba(167,139,250,0.15)',  border: 'rgba(167,139,250,0.6)', solid: '#a78bfa' },
  amber:  { bg: 'rgba(251,191,36,0.15)',   border: 'rgba(251,191,36,0.6)',  solid: '#fbbf24' },
  rose:   { bg: 'rgba(251,113,133,0.15)',  border: 'rgba(251,113,133,0.6)', solid: '#fb7185' },
  cyan:   { bg: 'rgba(34,211,238,0.15)',   border: 'rgba(34,211,238,0.6)',  solid: '#22d3ee' },
};

const tip = { backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#334155', bodyColor: '#64748b', borderColor: '#e2e8f0', borderWidth: 1, padding: 8, cornerRadius: 6 };
const cardS = { borderRadius: 8, border: '1px solid #f1f5f9' };
const chartTitle = (t: string) => <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>{t}</span>;

const typeIcons: Record<string, React.ReactNode> = {
  call: <PhoneOutlined style={{ color: '#1890ff' }} />,
  email: <MailOutlined style={{ color: '#13c2c2' }} />,
  meeting: <TeamOutlined style={{ color: '#722ed1' }} />,
  task: <FileTextOutlined style={{ color: '#fa8c16' }} />,
  note: <FileTextOutlined style={{ color: '#8c8c8c' }} />,
};

export default function FieldDashboardPage() {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [visits, setVisits] = useState<VisitListItem[]>([]);
  const [tours, setTours] = useState<TourListItem[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const today = dayjs();
        const weekStart = today.startOf('week').toISOString();
        const weekEnd = today.endOf('week').toISOString();

        const [activitiesRes, visitsRes, toursRes] = await Promise.all([
          activitiesApi.getCalendarEvents(weekStart, weekEnd),
          visitsApi.getCalendarEvents(weekStart, weekEnd),
          toursApi.getAll({ size: 50 }),
        ]);

        setActivities(activitiesRes);
        setVisits(visitsRes);
        setTours(toursRes.content);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // KPI calculations
  const today = dayjs().format('YYYY-MM-DD');
  const todayActivities = activities.filter((a) => a.startDate && dayjs(a.startDate).format('YYYY-MM-DD') === today);
  const completedActivities = activities.filter((a) => a.status === 'completed');
  const plannedVisits = visits.filter((v) => v.status === 'planned');
  const completedVisits = visits.filter((v) => v.status === 'completed');
  const inProgressTours = tours.filter((t) => t.status === 'in_progress');
  const completionRate = activities.length > 0 ? Math.round((completedActivities.length / activities.length) * 100) : 0;

  // Activities by type for Doughnut
  const typeCounts = ACTIVITY_TYPES.map((t) => ({
    type: t.label,
    count: activities.filter((a) => a.activityType === t.value).length,
  }));

  const activityTypeChartData = {
    labels: typeCounts.map((t) => t.type),
    datasets: [{
      data: typeCounts.map((t) => t.count),
      backgroundColor: [p.blue.bg, p.cyan.bg, p.purple.bg, p.amber.bg, p.rose.bg],
      borderColor: [p.blue.border, p.cyan.border, p.purple.border, p.amber.border, p.rose.border],
      borderWidth: 1,
    }],
  };

  const activityTypeOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#64748b', font: { size: 10 }, padding: 6, usePointStyle: true, pointStyleWidth: 6, boxWidth: 6 } },
      tooltip: tip,
    },
  };

  // Visits per day of the week for Bar chart
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const visitsByDay = daysOfWeek.map((_, i) => {
    const dayNum = i + 1; // dayjs: 1=Mon...7=Sun
    return visits.filter((v) => dayjs(v.visitDate).day() === (dayNum === 7 ? 0 : dayNum)).length;
  });

  const visitsBarData = {
    labels: daysOfWeek,
    datasets: [{
      label: 'Visites',
      data: visitsByDay,
      backgroundColor: p.green.bg,
      borderColor: p.green.border,
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.6,
    }],
  };

  const visitsBarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tip },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { grid: { color: 'rgba(226,232,240,0.4)', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 } },
    },
  };

  // Upcoming activities for the timeline list
  const upcoming = [...activities]
    .filter((a) => a.startDate && dayjs(a.startDate).isAfter(dayjs().startOf('day')))
    .sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)))
    .slice(0, 8);

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 10 }}>Tableau de bord terrain</div>

      {/* KPI Cards */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        {[
          { t: "Activités aujourd'hui", v: todayActivities.length, icon: <CalendarOutlined />, c: p.blue },
          { t: 'Visites planifiées', v: plannedVisits.length, icon: <EnvironmentOutlined />, c: p.green },
          { t: 'Tournées en cours', v: inProgressTours.length, icon: <CarOutlined />, c: p.amber },
          { t: 'Taux complétion', v: completionRate, icon: <CheckCircleOutlined />, c: p.purple, suf: '%' },
        ].map((k, i) => (
          <Col xs={12} lg={6} key={i}>
            <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={{ ...cardS, background: k.c.bg, border: 'none' }}>
              <Statistic
                title={<span style={{ fontSize: 11, color: k.c.solid }}>{k.t}</span>}
                value={k.v}
                prefix={k.icon}
                suffix={k.suf}
                valueStyle={{ color: k.c.solid, fontSize: 17, fontWeight: 600, lineHeight: '24px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Secondary KPI */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={8} lg={4}>
          <Card size="small" styles={{ body: { padding: '6px 10px' } }} style={cardS}>
            <Statistic title={<span style={{ fontSize: 10 }}>Activités semaine</span>} value={activities.length} valueStyle={{ fontSize: 16 }} />
          </Card>
        </Col>
        <Col xs={8} lg={4}>
          <Card size="small" styles={{ body: { padding: '6px 10px' } }} style={cardS}>
            <Statistic title={<span style={{ fontSize: 10 }}>Visites terminées</span>} value={completedVisits.length} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8} lg={4}>
          <Card size="small" styles={{ body: { padding: '6px 10px' } }} style={cardS}>
            <Statistic title={<span style={{ fontSize: 10 }}>Visites semaine</span>} value={visits.length} valueStyle={{ fontSize: 16 }} />
          </Card>
        </Col>
        <Col xs={8} lg={4}>
          <Card size="small" styles={{ body: { padding: '6px 10px' } }} style={cardS}>
            <Statistic title={<span style={{ fontSize: 10 }}>Tournées total</span>} value={tours.length} valueStyle={{ fontSize: 16 }} />
          </Card>
        </Col>
        <Col xs={8} lg={4}>
          <Card size="small" styles={{ body: { padding: '6px 10px' } }} style={cardS}>
            <Statistic title={<span style={{ fontSize: 10 }}>Terminées</span>} value={completedActivities.length} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8} lg={4}>
          <Card size="small" styles={{ body: { padding: '6px 10px' } }} style={cardS}>
            <Statistic title={<span style={{ fontSize: 10 }}>En attente</span>} value={activities.filter((a) => a.status === 'planned').length} valueStyle={{ fontSize: 16, color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} lg={8}>
          <Card size="small" title={chartTitle('Activités par type')} styles={{ body: { padding: '4px 6px 2px' }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }} style={cardS}>
            <div style={{ height: 180 }}>
              <Doughnut data={activityTypeChartData} options={activityTypeOpts as any} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card size="small" title={chartTitle('Visites par jour (semaine)')} styles={{ body: { padding: '4px 8px 6px' }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }} style={cardS}>
            <div style={{ height: 180 }}>
              <Bar data={visitsBarData} options={visitsBarOpts as any} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom: Upcoming + Tours */}
      <Row gutter={[8, 8]}>
        <Col xs={24} lg={14}>
          <Card size="small" title={chartTitle('Prochaines activités')} styles={{ body: { padding: '6px 8px' }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }} style={cardS}>
            {upcoming.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Aucune activité à venir</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {upcoming.map((a) => {
                  const typeConfig = ACTIVITY_TYPES.find((t) => t.value === a.activityType);
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: 'rgba(241,245,249,0.6)' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: p.blue.solid, minWidth: 80 }}>
                        {dayjs(a.startDate).format('DD/MM HH:mm')}
                      </span>
                      {typeIcons[a.activityType]}
                      <span style={{ fontSize: 11, color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.subject}
                      </span>
                      <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 5px', margin: 0 }} color={typeConfig?.color}>
                        {typeConfig?.label}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" title={chartTitle('Tournées en cours')} styles={{ body: { padding: '6px 8px' }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }} style={cardS}>
            {inProgressTours.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Aucune tournée en cours</div>
            ) : (
              <List
                dataSource={inProgressTours}
                size="small"
                renderItem={(tour) => {
                  const percent = tour.totalVisits > 0 ? Math.round((tour.completedVisits / tour.totalVisits) * 100) : 0;
                  return (
                    <List.Item style={{ padding: '4px 0' }}>
                      <List.Item.Meta
                        avatar={<CarOutlined style={{ fontSize: 16, color: '#fa8c16' }} />}
                        title={<span style={{ fontSize: 12 }}>{tour.name}</span>}
                        description={
                          <Space size="small">
                            <span style={{ fontSize: 11 }}>{dayjs(tour.tourDate).format('DD/MM')}</span>
                            <Progress percent={percent} size="small" style={{ width: 80 }} />
                            <span style={{ fontSize: 10 }}>{tour.completedVisits}/{tour.totalVisits}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
