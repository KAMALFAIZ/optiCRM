import { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Tag, Modal, Select, Input, Alert, Spin, Empty,
  Space, Popconfirm, message, Badge, Tooltip,
} from 'antd';
import {
  TeamOutlined, UserAddOutlined, DeleteOutlined, SearchOutlined,
  CheckCircleOutlined, UserOutlined,
} from '@ant-design/icons';

import supervisorApi from '@/api/supervisor';
import { SupervisorAssignment, CollaboratorSummary } from '@/types/dashboard';

const roleColors: Record<string, string> = {
  COMMERCIAL: 'blue',
  SUPERVISEUR: 'purple',
  MANAGER: 'orange',
  ADMIN: 'red',
  SUPER_ADMIN: 'red',
  READ_ONLY: 'default',
};

const roleLabels: Record<string, string> = {
  COMMERCIAL: 'Commercial',
  SUPERVISEUR: 'Superviseur',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  READ_ONLY: 'Lecture seule',
};

export default function SupervisorTeamPage() {
  const [assignments, setAssignments] = useState<SupervisorAssignment[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<CollaboratorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const collabs = await supervisorApi.getMyCollaborators();
      setAssignments(collabs);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAssignModal = async () => {
    setModalOpen(true);
    setSelectedUserId(null);
    setNotes('');
    try {
      const users = await supervisorApi.getAssignableUsers();
      setAssignableUsers(users);
    } catch {
      message.error('Impossible de charger la liste des utilisateurs');
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      await supervisorApi.assignCollaborator(selectedUserId, notes || undefined);
      message.success('Collaborateur assigné avec succès');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Erreur lors de l\'assignation');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (collaboratorId: string, name: string) => {
    try {
      await supervisorApi.unassignCollaborator(collaboratorId);
      message.success(`${name} retiré de votre équipe`);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Erreur lors du retrait');
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      a.collaboratorName.toLowerCase().includes(q) ||
      a.collaboratorEmail.toLowerCase().includes(q) ||
      (a.collaboratorRole || '').toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      title: 'Collaborateur',
      key: 'name',
      render: (_: unknown, r: SupervisorAssignment) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            <UserOutlined style={{ marginRight: 6, color: '#64748b' }} />
            {r.collaboratorName}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.collaboratorEmail}</div>
        </div>
      ),
    },
    {
      title: 'Rôle',
      key: 'role',
      width: 140,
      render: (_: unknown, r: SupervisorAssignment) => (
        <Tag color={roleColors[r.collaboratorRole] || 'default'}>
          {roleLabels[r.collaboratorRole] || r.collaboratorRole}
        </Tag>
      ),
    },
    {
      title: 'Assigné le',
      key: 'assignedAt',
      width: 160,
      render: (_: unknown, r: SupervisorAssignment) =>
        r.assignedAt
          ? new Date(r.assignedAt).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
          : '—',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (v: string | null) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>{v || '—'}</span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: SupervisorAssignment) => (
        <Popconfirm
          title="Retirer ce collaborateur ?"
          description={`${r.collaboratorName} ne sera plus dans votre suivi.`}
          onConfirm={() => handleUnassign(r.collaboratorId, r.collaboratorName)}
          okText="Retirer"
          cancelText="Annuler"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Retirer du suivi">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  if (loading && assignments.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Chargement de l'équipe..."><div /></Spin>
      </div>
    );
  }

  const availableUsers = assignableUsers.filter((u) => !u.alreadyAssigned);

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined /> Mon Équipe de Suivi
          <Badge count={assignments.length} style={{ backgroundColor: '#3b82f6', marginLeft: 4 }} />
        </div>
        <Button type="primary" icon={<UserAddOutlined />} onClick={openAssignModal}>
          Ajouter un collaborateur
        </Button>
      </div>

      {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 12 }} />}

      <Card
        size="small"
        styles={{ body: { padding: 0 }, header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' } }}
        style={{ borderRadius: 8, border: '1px solid #f1f5f9' }}
      >
        {assignments.length > 3 && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Rechercher un collaborateur..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              allowClear
              size="small"
              style={{ maxWidth: 300 }}
            />
          </div>
        )}
        <Table
          dataSource={filteredAssignments}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loading}
          scroll={{ x: 700 }}
          locale={{
            emptyText: (
              <Empty
                description="Aucun collaborateur assigné"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<UserAddOutlined />} onClick={openAssignModal}>
                  Assigner votre premier collaborateur
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <UserAddOutlined />
            Assigner un collaborateur
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAssign}
        okText="Assigner"
        cancelText="Annuler"
        confirmLoading={assigning}
        okButtonProps={{ disabled: !selectedUserId }}
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 4 }}>
            Collaborateur
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Sélectionner un collaborateur..."
            value={selectedUserId}
            onChange={setSelectedUserId}
            showSearch
            optionFilterProp="label"
            notFoundContent={availableUsers.length === 0 ? 'Aucun utilisateur disponible' : 'Aucun résultat'}
            options={availableUsers.map((u) => ({
              value: u.userId,
              label: `${u.fullName} — ${u.email}`,
              desc: u.role,
            }))}
            optionRender={(option) => {
              const user = availableUsers.find((u) => u.userId === option.value);
              return (
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{user?.fullName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {user?.email}
                    <Tag
                      color={roleColors[user?.role || ''] || 'default'}
                      style={{ marginLeft: 8, fontSize: 10 }}
                    >
                      {roleLabels[user?.role || ''] || user?.role}
                    </Tag>
                  </div>
                </div>
              );
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 4 }}>
            Notes (optionnel)
          </label>
          <Input.TextArea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Raison de l'affectation, zone géographique..."
            maxLength={500}
            showCount
          />
        </div>
      </Modal>

      {assignments.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleOutlined style={{ color: '#16a34a' }} />
            <strong>{assignments.length}</strong> collaborateur{assignments.length > 1 ? 's' : ''} sous votre supervision
            — Les KPIs et rapports sont filtrés automatiquement sur cette équipe.
          </div>
        </div>
      )}
    </div>
  );
}
