import { useEffect, useState } from 'react';
import { Card, Col, Row, Tag, Typography, Spin, message, Space, Button, Progress } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { tasksApi } from '@/api/projects';
import type { TaskListItem, TaskStatus, TaskPriority } from '@/types/project';
import TaskFormModal from './TaskFormModal';

const { Text } = Typography;

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'A_FAIRE',  label: 'À faire',    color: '#8c8c8c' },
  { status: 'EN_COURS', label: 'En cours',   color: '#1677ff' },
  { status: 'EN_REVUE', label: 'En revue',   color: '#fa8c16' },
  { status: 'FAIT',     label: 'Terminé',    color: '#52c41a' },
];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  CRITIQUE: '#ff4d4f', HAUTE: '#fa8c16', NORMALE: '#1677ff', BASSE: '#8c8c8c',
};

const TYPE_ICON: Record<string, string> = {
  TACHE: '📋', LIVRABLE: '📦', REUNION: '🤝', BUG: '🐛', FEATURE: '⚡',
};

interface Props {
  projectId: string;
  milestones: { id: string; name: string }[];
  onTaskClick: (id: string) => void;
}

export default function ProjectKanban({ projectId, milestones, onTaskClick }: Props) {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTasks(await tasksApi.getByProject(projectId));
    } catch {
      message.error('Erreur chargement tâches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const byStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const handleDrop = async (targetStatus: TaskStatus, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    try {
      await tasksApi.changeStatus(taskId, targetStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    } catch {
      message.error('Impossible de déplacer la tâche');
    }
  };

  if (loading) return <Spin style={{ display: 'block', marginTop: 32 }} />;

  const done = tasks.filter(t => t.status === 'FAIT').length;
  const pct = tasks.length ? Math.round(done * 100 / tasks.length) : 0;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Progress percent={pct} style={{ flex: 1 }} />
        <Button icon={<PlusOutlined />} onClick={() => setTaskModal(true)}>
          Nouvelle tâche
        </Button>
      </div>

      <Row gutter={12} style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 16 }}>
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.status);
          return (
            <Col key={col.status} style={{ minWidth: 250, width: 250 }}>
              <div
                style={{ background: '#f5f5f5', borderRadius: 8, padding: 12, minHeight: 350 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (dragging) handleDrop(col.status, dragging); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, marginRight: 8 }} />
                  <Text strong>{col.label}</Text>
                  <Tag style={{ marginLeft: 8, fontSize: 11 }}>{colTasks.length}</Tag>
                </div>

                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {colTasks.map(task => (
                    <Card
                      key={task.id}
                      size="small"
                      style={{
                        cursor: 'grab',
                        borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}`,
                        opacity: dragging === task.id ? 0.5 : 1,
                      }}
                      draggable
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => onTaskClick(task.id)}
                    >
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                        {TYPE_ICON[task.type]} {task.type}
                      </div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                      {task.milestoneName && (
                        <Text type="secondary" style={{ fontSize: 11 }}>{task.milestoneName}</Text>
                      )}
                      <Space style={{ marginTop: 6 }} size={4} wrap>
                        {task.overdue && <Tag color="red" style={{ fontSize: 10, margin: 0 }}>En retard</Tag>}
                        {task.dueDate && (
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </Text>
                        )}
                        {task.assigneeName && (
                          <Text type="secondary" style={{ fontSize: 10 }}>{task.assigneeName}</Text>
                        )}
                      </Space>
                    </Card>
                  ))}
                </Space>
              </div>
            </Col>
          );
        })}
      </Row>

      <TaskFormModal
        open={taskModal}
        projectId={projectId}
        milestones={milestones}
        onClose={refresh => { setTaskModal(false); if (refresh) load(); }}
      />
    </div>
  );
}
