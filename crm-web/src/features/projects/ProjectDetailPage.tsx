import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Tag, Button, Typography, Space, Tabs, Spin,
  Descriptions, Progress, Timeline, message, List, Avatar, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, ProjectOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '@/api/projects';
import type { Project, ProjectStatus } from '@/types/project';
import ProjectKanban from './ProjectKanban';
import ProjectFormModal from './ProjectFormModal';

const { Title, Text } = Typography;

const STATUS_MAP: Record<ProjectStatus, { label: string; color: string }> = {
  DRAFT:    { label: 'Brouillon', color: 'default' },
  ACTIF:    { label: 'Actif',     color: 'green' },
  EN_PAUSE: { label: 'En pause',  color: 'orange' },
  TERMINE:  { label: 'Terminé',   color: 'blue' },
  ANNULE:   { label: 'Annulé',    color: 'red' },
};

const MILESTONE_COLOR: Record<string, string> = {
  EN_ATTENTE: 'default', ATTEINT: 'success', MANQUE: 'error',
};
const MILESTONE_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente', ATTEINT: 'Atteint', MANQUE: 'Manqué',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setProject(await projectsApi.getById(id));
    } catch {
      message.error('Projet introuvable');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!project) return null;

  const status = STATUS_MAP[project.status];

  const tabItems = [
    {
      key: 'tasks',
      label: 'Tâches (Kanban)',
      children: (
        <ProjectKanban
          projectId={project.id}
          milestones={project.milestones.map(m => ({ id: m.id, name: m.name }))}
          onTaskClick={taskId => navigate(`/tasks/${taskId}`)}
        />
      ),
    },
    {
      key: 'milestones',
      label: `Milestones (${project.milestones.length})`,
      children: (
        <Timeline
          items={project.milestones.map(m => ({
            color: m.status === 'ATTEINT' ? 'green' : m.status === 'MANQUE' ? 'red' : 'gray',
            dot: m.status === 'ATTEINT' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
            children: (
              <Card size="small" style={{ marginBottom: 8 }}>
                <Space>
                  <Text strong>{m.name}</Text>
                  <Badge status={MILESTONE_COLOR[m.status] as any} text={MILESTONE_LABEL[m.status]} />
                  {m.dueDate && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(m.dueDate).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </Space>
              </Card>
            ),
          }))}
        />
      ),
    },
    {
      key: 'members',
      label: `Équipe (${project.members.length})`,
      children: (
        <List
          dataSource={project.members}
          renderItem={m => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{m.fullName.charAt(0)}</Avatar>}
                title={m.fullName}
                description={
                  <Space>
                    <Text type="secondary">{m.email}</Text>
                    <Tag>{m.role}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>Retour</Button>
      </Space>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card>
            <Space style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontFamily: 'monospace' }}>{project.reference}</Text>
              <Tag color={status.color}>{status.label}</Tag>
            </Space>
            <Title level={4} style={{ marginTop: 4 }}>
              <ProjectOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              {project.name}
            </Title>
            {project.description && (
              <Text type="secondary">{project.description}</Text>
            )}
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                Avancement global
              </Text>
              <Progress percent={project.progressPct} strokeColor="#722ed1" />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Informations">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Client">
                {project.account ? (
                  <a onClick={() => navigate(`/accounts/${project.account!.id}`)}>
                    {project.account.name}
                  </a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Chef de projet">
                {project.manager?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Début">
                {project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Fin prévue">
                {project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : '-'}
              </Descriptions.Item>
              {project.budget && (
                <Descriptions.Item label="Budget">
                  {project.budget.toLocaleString('fr-MA')} MAD
                </Descriptions.Item>
              )}
            </Descriptions>
            <Button block style={{ marginTop: 12 }} onClick={() => setEditOpen(true)}>
              Modifier le projet
            </Button>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <ProjectFormModal
        open={editOpen}
        projectId={id}
        onClose={refresh => { setEditOpen(false); if (refresh) load(); }}
      />
    </div>
  );
}
