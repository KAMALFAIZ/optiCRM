import { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Modal, Input, Form, Select, Popconfirm,
  message, Space, Tag, Empty, Spin, Drawer, List, Avatar, Divider,
} from 'antd';
import {
  TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  UserAddOutlined, CloseOutlined,
} from '@ant-design/icons';
import apiClient from '@/api/client';
import { ApiResponse } from '@/types/api';

interface TeamDto {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  memberCount?: number;
}

interface TeamMemberDto {
  id: string;
  fullName: string;
  email: string;
  roleName?: string;
  avatarUrl?: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: { name: string };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamDto | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Members drawer state
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDto | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [memberSelectValue, setMemberSelectValue] = useState<string | undefined>(undefined);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<TeamDto[]>>('/users/teams');
      setTeams(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await apiClient.get<ApiResponse<UserOption[]>>('/users?page=1&perPage=200');
      setUsers((res.data as any).data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadTeams(); loadUsers(); }, [loadTeams, loadUsers]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (team: TeamDto) => {
    setEditing(team);
    form.setFieldsValue({ name: team.name, description: team.description, managerId: team.managerId });
    setModalOpen(true);
  };

  const openMembers = async (team: TeamDto) => {
    setSelectedTeam(team);
    setMembersDrawerOpen(true);
    setMembersLoading(true);
    setMemberSelectValue(undefined);
    try {
      const res = await apiClient.get<ApiResponse<TeamMemberDto[]>>(`/users/teams/${team.id}/members`);
      setMembers(res.data.data ?? []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/users/teams/${editing.id}`, values);
        message.success('Équipe mise à jour');
      } else {
        await apiClient.post('/users/teams', values);
        message.success('Équipe créée');
      }
      setModalOpen(false);
      loadTeams();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/users/teams/${id}`);
      message.success('Équipe supprimée');
      loadTeams();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Erreur');
    }
  };

  const handleAddMember = async () => {
    if (!memberSelectValue || !selectedTeam) return;
    setAddingMemberId(memberSelectValue);
    try {
      await apiClient.post(`/users/teams/${selectedTeam.id}/members/${memberSelectValue}`);
      message.success('Collaborateur ajouté');
      setMemberSelectValue(undefined);
      // Refresh members and team list
      const res = await apiClient.get<ApiResponse<TeamMemberDto[]>>(`/users/teams/${selectedTeam.id}/members`);
      setMembers(res.data.data ?? []);
      loadTeams();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Erreur');
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      await apiClient.delete(`/users/teams/${selectedTeam.id}/members/${userId}`);
      message.success('Collaborateur retiré');
      setMembers(prev => prev.filter(m => m.id !== userId));
      loadTeams();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Erreur');
    }
  };

  // Users not already in this team
  const availableUsers = users.filter(u => !members.some(m => m.id === u.id));

  const columns = [
    {
      title: 'Équipe',
      key: 'name',
      render: (_: unknown, t: TeamDto) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            <TeamOutlined style={{ marginRight: 6, color: '#3b82f6' }} />
            {t.name}
          </div>
          {t.description && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Manager',
      key: 'manager',
      width: 200,
      render: (_: unknown, t: TeamDto) =>
        t.managerName ? (
          <span style={{ fontSize: 12 }}>
            <UserOutlined style={{ marginRight: 4, color: '#64748b' }} />
            {t.managerName}
          </span>
        ) : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>,
    },
    {
      title: 'Membres',
      key: 'members',
      width: 120,
      render: (_: unknown, t: TeamDto) => (
        <Button
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={() => openMembers(t)}
        >
          <Tag color="blue" style={{ cursor: 'pointer' }}>
            <UserOutlined /> {t.memberCount ?? 0} membre{(t.memberCount ?? 0) !== 1 ? 's' : ''}
          </Tag>
        </Button>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, t: TeamDto) => (
        <Space>
          <Button size="small" icon={<UserAddOutlined />} onClick={() => openMembers(t)} title="Gérer les membres" />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(t)} />
          <Popconfirm
            title="Supprimer cette équipe ?"
            description="Les membres perdront leur affectation d'équipe."
            onConfirm={() => handleDelete(t.id)}
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && teams.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Chargement des équipes..."><div /></Spin>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined /> Gestion des Équipes
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nouvelle équipe
        </Button>
      </div>

      <Card
        size="small"
        style={{ borderRadius: 8, border: '1px solid #f1f5f9' }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={teams}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loading}
          locale={{
            emptyText: (
              <Empty description="Aucune équipe créée" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Créer la première équipe
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Create / Edit modal */}
      <Modal
        title={editing ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="Nom de l'équipe"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input placeholder="Ex: Équipe Commerciale Nord" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Zone géographique, spécialité..." />
          </Form.Item>
          <Form.Item name="managerId" label="Manager / Superviseur">
            <Select
              showSearch
              allowClear
              placeholder="Sélectionner un responsable..."
              optionFilterProp="label"
              options={users
                .filter(u => ['MANAGER', 'SUPERVISEUR', 'ADMIN', 'SUPER_ADMIN'].includes(u.role?.name || ''))
                .map(u => ({
                  value: u.id,
                  label: `${u.firstName} ${u.lastName} (${u.role?.name || ''})`,
                }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Members drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: '#3b82f6' }} />
            <span>Membres — {selectedTeam?.name}</span>
          </div>
        }
        open={membersDrawerOpen}
        onClose={() => setMembersDrawerOpen(false)}
        width={420}
        styles={{ body: { padding: '16px' } }}
      >
        {/* Add member */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ajouter un collaborateur
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              showSearch
              allowClear
              placeholder="Rechercher un utilisateur..."
              optionFilterProp="label"
              style={{ flex: 1 }}
              value={memberSelectValue}
              onChange={setMemberSelectValue}
              options={availableUsers.map(u => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} — ${u.role?.name || ''}`,
              }))}
            />
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleAddMember}
              loading={addingMemberId !== null}
              disabled={!memberSelectValue}
            >
              Ajouter
            </Button>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Members list */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Membres actuels ({members.length})
        </div>

        {membersLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : members.length === 0 ? (
          <Empty description="Aucun membre dans cette équipe" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={members}
            renderItem={member => (
              <List.Item
                style={{ padding: '8px 0' }}
                actions={[
                  <Popconfirm
                    key="remove"
                    title="Retirer ce membre ?"
                    onConfirm={() => handleRemoveMember(member.id)}
                    okText="Retirer"
                    cancelText="Annuler"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      title="Retirer de l'équipe"
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    member.avatarUrl
                      ? <Avatar src={member.avatarUrl} size={36} />
                      : <Avatar size={36} style={{ backgroundColor: '#3b82f6' }}>{member.fullName.charAt(0)}</Avatar>
                  }
                  title={<span style={{ fontSize: 13, fontWeight: 600 }}>{member.fullName}</span>}
                  description={
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {member.email}
                      {member.roleName && <Tag style={{ marginLeft: 6, fontSize: 10 }} color="geekblue">{member.roleName}</Tag>}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  );
}
