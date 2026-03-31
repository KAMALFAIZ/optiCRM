import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Card,
  Dropdown,
  Modal,
  Form,
  message,
  Tooltip,
  Typography,
  Statistic,
  Row,
  Col,
  Avatar,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PhoneOutlined,
  MoreOutlined,
  ReloadOutlined,
  KeyOutlined,
  DownloadOutlined,
  HistoryOutlined,
  TeamOutlined,
  UserOutlined,
  LoginOutlined,
  UserDeleteOutlined,
  FilterOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchUsers,
  fetchUserStats,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
  changeUserPassword,
  unlockUser,
  batchActivateUsers,
  batchDeactivateUsers,
  fetchRefData,
  setFilters,
} from './usersSlice';
import { UserListItem, ROLE_COLORS, ROLE_LABELS, ChangePasswordRequest } from '../../types/user';
import usersApi from '../../api/users';
import UserFormModal from './UserFormModal';
import UserActivityDrawer from './UserActivityDrawer';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Search } = Input;

export default function UsersListPage() {
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters, roles, refDataLoaded, stats, statsLoading } = useAppSelector((state) => state.users);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [passwordForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);
  const [activityUserName, setActivityUserName] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!refDataLoaded) {
      dispatch(fetchRefData());
    }
    dispatch(fetchUserStats());
  }, [dispatch, refDataLoaded]);

  useEffect(() => {
    dispatch(fetchUsers(filters));
  }, [dispatch, filters]);

  const handleSearch = useCallback(
    (value: string) => {
      dispatch(setFilters({ search: value || undefined, page: 1 }));
    },
    [dispatch]
  );

  const handleRoleFilter = (value: string | undefined) => {
    dispatch(setFilters({ roleId: value, page: 1 }));
  };

  const handleStatusFilter = (value: string | undefined) => {
    let isActive: boolean | undefined;
    if (value === 'active') isActive = true;
    else if (value === 'inactive') isActive = false;
    else isActive = undefined;
    dispatch(setFilters({ isActive, page: 1 }));
  };

  const handleTableChange = (pag: any) => {
    dispatch(setFilters({ page: pag.current, size: pag.pageSize }));
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await dispatch(updateUser({ id: editingUser.id, data: values })).unwrap();
        message.success('Utilisateur mis à jour');
      } else {
        await dispatch(createUser(values)).unwrap();
        message.success('Utilisateur créé');
      }
      setFormOpen(false);
      dispatch(fetchUsers(filters));
      dispatch(fetchUserStats());
    } catch (err: any) {
      message.error(err || 'Erreur');
    }
  };

  const handleActivate = async (id: string) => {
    await dispatch(activateUser(id)).unwrap();
    message.success('Utilisateur activé');
    dispatch(fetchUserStats());
  };

  const handleDeactivate = async (id: string) => {
    Modal.confirm({
      title: 'Désactiver l\'utilisateur ?',
      content: 'L\'utilisateur ne pourra plus se connecter.',
      okText: 'Désactiver',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deactivateUser(id)).unwrap();
        message.success('Utilisateur désactivé');
        dispatch(fetchUserStats());
      },
    });
  };

  const handleUnlock = async (id: string) => {
    await dispatch(unlockUser(id)).unwrap();
    message.success('Utilisateur déverrouillé');
  };

  const handleDelete = (user: UserListItem) => {
    Modal.confirm({
      title: 'Supprimer cet utilisateur ?',
      content: `L'utilisateur "${user.firstName} ${user.lastName}" (${user.email}) sera définitivement supprimé. Cette action est irréversible.`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      onOk: async () => {
        try {
          await dispatch(deleteUser(user.id)).unwrap();
          message.success('Utilisateur supprimé');
          dispatch(fetchUserStats());
        } catch (err: any) {
          message.error(err || 'Erreur lors de la suppression');
        }
      },
    });
  };

  const handlePasswordOpen = (userId: string) => {
    setPasswordUserId(userId);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (passwordUserId) {
        await dispatch(changeUserPassword({ id: passwordUserId, data: values as ChangePasswordRequest })).unwrap();
        message.success('Mot de passe modifié');
        setPasswordModalOpen(false);
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err || 'Erreur');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await usersApi.exportExcel(filters);
      message.success('Export téléchargé');
    } catch {
      message.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const handleBatchActivate = async () => {
    try {
      const result = await dispatch(batchActivateUsers(selectedRowKeys as string[])).unwrap();
      message.success(`${result.affected} utilisateur(s) activé(s)`);
      setSelectedRowKeys([]);
      dispatch(fetchUsers(filters));
      dispatch(fetchUserStats());
    } catch (err: any) {
      message.error(err || 'Erreur');
    }
  };

  const handleBatchDeactivate = () => {
    Modal.confirm({
      title: `Désactiver ${selectedRowKeys.length} utilisateur(s) ?`,
      content: 'Ces utilisateurs ne pourront plus se connecter.',
      okText: 'Désactiver',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const result = await dispatch(batchDeactivateUsers(selectedRowKeys as string[])).unwrap();
          message.success(`${result.affected} utilisateur(s) désactivé(s)`);
          setSelectedRowKeys([]);
          dispatch(fetchUsers(filters));
          dispatch(fetchUserStats());
        } catch (err: any) {
          message.error(err || 'Erreur');
        }
      },
    });
  };

  const handleOpenHistory = (user: UserListItem) => {
    setActivityUserId(user.id);
    setActivityUserName(`${user.firstName} ${user.lastName}`);
    setActivityOpen(true);
  };

  const rowSelection: TableRowSelection<UserListItem> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const getActions = (user: UserListItem): MenuProps['items'] => [
    { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(user) },
    { key: 'password', icon: <KeyOutlined />, label: 'Changer le mot de passe', onClick: () => handlePasswordOpen(user.id) },
    { key: 'history', icon: <HistoryOutlined />, label: 'Historique', onClick: () => handleOpenHistory(user) },
    { type: 'divider' },
    user.isActive
      ? { key: 'deactivate', icon: <StopOutlined />, label: 'Désactiver', danger: true, onClick: () => handleDeactivate(user.id) }
      : { key: 'activate', icon: <CheckCircleOutlined />, label: 'Activer', onClick: () => handleActivate(user.id) },
    { key: 'unlock', icon: <UnlockOutlined />, label: 'Déverrouiller', onClick: () => handleUnlock(user.id) },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(user) },
  ];

  const columns: ColumnsType<UserListItem> = [
    {
      title: 'Nom',
      key: 'name',
      width: 240,
      ellipsis: true,
      sorter: true,
      render: (_, r) => (
        <Space>
          <Avatar
            size={32}
            src={r.avatarUrl || undefined}
            icon={!r.avatarUrl ? <UserOutlined /> : undefined}
            style={{ backgroundColor: r.avatarUrl ? undefined : '#1677ff' }}
          />
          <div>
            <Text strong>{r.firstName} {r.lastName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string) => phone ? (
        <a href={`tel:${phone}`}><PhoneOutlined /> {phone}</a>
      ) : '-',
    },
    {
      title: 'Rôle',
      dataIndex: ['role', 'name'],
      key: 'role',
      width: 140,
      render: (name: string) => (
        <Tag color={ROLE_COLORS[name] || 'default'}>
          {ROLE_LABELS[name] || name}
        </Tag>
      ),
    },
    {
      title: 'Équipe',
      dataIndex: ['team', 'name'],
      key: 'team',
      width: 130,
      render: (name: string) => name || <Text type="secondary">—</Text>,
    },
    {
      title: 'Territoire',
      dataIndex: ['territory', 'name'],
      key: 'territory',
      width: 130,
      render: (name: string) => name || <Text type="secondary">—</Text>,
    },
    {
      title: 'Statut',
      key: 'status',
      width: 100,
      render: (_, r) =>
        r.isActive ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Actif</Tag>
        ) : (
          <Tag color="error" icon={<StopOutlined />}>Inactif</Tag>
        ),
    },
    {
      title: 'Dernière connexion',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (val: string) =>
        val ? new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <Text type="secondary">Jamais</Text>,
    },
    {
      title: 'Créé le',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown menu={{ items: getActions(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Utilisateurs</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><TeamOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            {(stats?.activeUsers ?? 0) > 0 && (
              <span style={{ color: '#52c41a' }}><strong>{stats!.activeUsers}</strong> <Text type="secondary">actifs</Text></span>
            )}
          </Space>
        </Space>
        <Space>
          <Tooltip title="Exporter Excel">
            <Button size="small" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
              Exporter
            </Button>
          </Tooltip>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouvel utilisateur
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }} loading={statsLoading}>
            <Statistic title="Total" value={stats?.totalUsers || 0} prefix={<TeamOutlined style={{ color: '#1677ff' }} />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }} loading={statsLoading}>
            <Statistic title="Actifs" value={stats?.activeUsers || 0} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }} loading={statsLoading}>
            <Statistic title="Inactifs" value={stats?.inactiveUsers || 0} prefix={<UserDeleteOutlined style={{ color: '#fa8c16' }} />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }} loading={statsLoading}>
            <Statistic title="Connectés (7j)" value={stats?.recentLogins || 0} prefix={<LoginOutlined style={{ color: '#722ed1' }} />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* ── Table Card ── */}
      <Card
        styles={{ body: { padding: '8px 16px 16px' } }}
        title={
          <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
            <Col flex="auto">
              <Search
                placeholder="Rechercher (nom, email...)"
                allowClear
                enterButton
                size="small"
                onSearch={handleSearch}
                style={{ maxWidth: 280 }}
              />
            </Col>
            <Col>
              <Space>
                <Button size="small" icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>Filtres</Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={() => dispatch(fetchUsers(filters))}>Actualiser</Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {/* Bulk actions bar */}
        {selectedRowKeys.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            marginBottom: 8,
            background: '#e6f4ff',
            borderRadius: 6,
            border: '1px solid #91caff',
            flexWrap: 'wrap',
            whiteSpace: 'nowrap',
          }}>
            <Text strong>{selectedRowKeys.length} sélectionné(s)</Text>
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={handleBatchActivate}>
              Activer
            </Button>
            <Button size="small" danger icon={<StopOutlined />} onClick={handleBatchDeactivate}>
              Désactiver
            </Button>
            <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>
              Tout désélectionner
            </Button>
          </div>
        )}

        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 10 }} align="middle">
            <Col span={5}>
              <Select
                placeholder="Rôle"
                allowClear
                style={{ width: '100%' }}
                size="small"
                onChange={handleRoleFilter}
              >
                {roles.map((r) => (
                  <Select.Option key={r.id} value={r.id}>
                    {ROLE_LABELS[r.name] || r.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                size="small"
                onChange={handleStatusFilter}
              >
                <Select.Option value="active">Actif</Select.Option>
                <Select.Option value="inactive">Inactif</Select.Option>
              </Select>
            </Col>
            <Col>
              <Button size="small" onClick={() => { handleRoleFilter(undefined); handleStatusFilter(undefined); }}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1210, y: 'calc(100vh - 330px)' }}
          pagination={{
            current: pagination.page || 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total) => `${total} utilisateurs`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      <UserFormModal
        open={formOpen}
        editingUser={editingUser}
        loading={loading}
        onSubmit={handleFormSubmit}
        onCancel={() => setFormOpen(false)}
      />

      <Modal
        title="Changer le mot de passe"
        open={passwordModalOpen}
        onOk={handlePasswordSubmit}
        onCancel={() => setPasswordModalOpen(false)}
        okText="Changer"
        cancelText="Annuler"
        width={400}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="Nouveau mot de passe"
            rules={[
              { required: true, message: 'Le mot de passe est obligatoire' },
              { min: 8, message: 'Minimum 8 caractères' },
            ]}
          >
            <Input.Password placeholder="Minimum 8 caractères" />
          </Form.Item>
        </Form>
      </Modal>

      <UserActivityDrawer
        open={activityOpen}
        userId={activityUserId}
        userName={activityUserName}
        onClose={() => setActivityOpen(false)}
      />
    </div>
  );
}
