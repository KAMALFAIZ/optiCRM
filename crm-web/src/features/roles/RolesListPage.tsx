import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Typography,
  Tooltip,
  Input,
  Modal,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchRoles, createRole, updateRole, deleteRole, duplicateRole } from './rolesSlice';
import { RoleItem, RolePermissions, MODULES, ACTIONS, ACTION_LABELS } from '@/types/role';
import RoleFormModal from './RoleFormModal';

const { Title, Text } = Typography;

export default function RolesListPage() {
  const dispatch = useAppDispatch();
  const { items: roles, loading, error } = useAppSelector((state) => state.roles);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<RoleItem | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [permissionsViewRole, setPermissionsViewRole] = useState<RoleItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleCreate = () => {
    setEditingRole(null);
    setFormOpen(true);
  };

  const handleEdit = (role: RoleItem) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: { name: string; description?: string; permissions: RolePermissions }) => {
    setSaving(true);
    try {
      if (editingRole) {
        await dispatch(
          updateRole({
            id: editingRole.id,
            data: {
              name: editingRole.isSystem ? undefined : values.name,
              description: values.description,
              permissions: values.permissions,
            },
          })
        ).unwrap();
        message.success('Rôle mis à jour avec succès');
      } else {
        await dispatch(createRole(values)).unwrap();
        message.success('Rôle créé avec succès');
      }
      setFormOpen(false);
      dispatch(fetchRoles());
    } catch (err: any) {
      message.error(err || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteRole(id)).unwrap();
      message.success('Rôle supprimé avec succès');
    } catch (err: any) {
      message.error(err || 'Impossible de supprimer ce rôle');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateSource || !duplicateName.trim()) return;
    setSaving(true);
    try {
      await dispatch(duplicateRole({ id: duplicateSource.id, name: duplicateName.trim() })).unwrap();
      message.success('Rôle dupliqué avec succès');
      setDuplicateModalOpen(false);
      setDuplicateName('');
    } catch (err: any) {
      message.error(err || 'Erreur lors de la duplication');
    } finally {
      setSaving(false);
    }
  };

  const openDuplicateModal = (role: RoleItem) => {
    setDuplicateSource(role);
    setDuplicateName('');
    setDuplicateModalOpen(true);
  };

  const countPermissions = (permissions: RolePermissions): number => {
    let count = 0;
    if (!permissions) return 0;
    for (const modPerms of Object.values(permissions)) {
      if (modPerms && typeof modPerms === 'object') {
        for (const val of Object.values(modPerms)) {
          if (val === true) count++;
        }
      }
    }
    return count;
  };

  const columns: ColumnsType<RoleItem> = [
    {
      title: 'Rôle',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: RoleItem) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: record.isSystem ? '#f5222d' : '#1890ff', fontSize: 16 }} />
          <div>
            <Text strong>{name}</Text>
            {record.isSystem && (
              <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>
                SYSTÈME
              </Tag>
            )}
            {record.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.description}
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Utilisateurs',
      dataIndex: 'usersCount',
      key: 'usersCount',
      width: 120,
      align: 'center',
      render: (count: number) => <Badge count={count} showZero style={{ backgroundColor: count > 0 ? '#1890ff' : '#d9d9d9' }} />,
    },
    {
      title: 'Permissions',
      key: 'permissions',
      width: 200,
      render: (_: any, record: RoleItem) => {
        const total = MODULES.length * ACTIONS.length;
        const active = countPermissions(record.permissions);
        const pct = total > 0 ? Math.round((active / total) * 100) : 0;
        return (
          <Tooltip title="Cliquer pour voir les détails">
            <Button type="link" size="small" onClick={() => setPermissionsViewRole(record)}>
              {active}/{total} ({pct}%)
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: 'Créé le',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) =>
        date
          ? new Date(date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_: any, record: RoleItem) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Dupliquer">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => openDuplicateModal(record)} />
          </Tooltip>
          {!record.isSystem && (
            <Popconfirm
              title="Supprimer ce rôle ?"
              description={
                record.usersCount > 0
                  ? `Ce rôle est assigné à ${record.usersCount} utilisateur(s). Réassignez-les d'abord.`
                  : 'Cette action est irréversible.'
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
              disabled={record.usersCount > 0}
            >
              <Tooltip title={record.usersCount > 0 ? 'Rôle assigné à des utilisateurs' : 'Supprimer'}>
                <Button
                  type="text"
                  size="small"
                  icon={record.usersCount > 0 ? <LockOutlined /> : <DeleteOutlined />}
                  danger={record.usersCount === 0}
                  disabled={record.usersCount > 0}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Gestion des rôles
          </Title>
          <Text type="secondary">Gérez les rôles et les droits d'accès des utilisateurs</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Nouveau rôle
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Create/Edit Modal */}
      <RoleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={saving}
        role={editingRole}
      />

      {/* Duplicate Modal */}
      <Modal
        title="Dupliquer le rôle"
        open={duplicateModalOpen}
        onCancel={() => setDuplicateModalOpen(false)}
        onOk={handleDuplicate}
        confirmLoading={saving}
        okText="Dupliquer"
        cancelText="Annuler"
      >
        <div style={{ marginBottom: 12 }}>
          <Text>
            Duplication de : <Tag color="blue">{duplicateSource?.name}</Tag>
          </Text>
        </div>
        <Input
          placeholder="Nom du nouveau rôle"
          value={duplicateName}
          onChange={(e) => setDuplicateName(e.target.value)}
          style={{ textTransform: 'uppercase' }}
        />
      </Modal>

      {/* Permissions Detail View Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>Permissions : {permissionsViewRole?.name}</span>
          </Space>
        }
        open={!!permissionsViewRole}
        onCancel={() => setPermissionsViewRole(null)}
        footer={null}
        width={700}
      >
        {permissionsViewRole && (
          <div>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '220px repeat(4, 1fr)',
                gap: 4,
                padding: '8px 0',
                borderBottom: '2px solid #f0f0f0',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <div>Module</div>
              {ACTIONS.map((action) => (
                <div key={action} style={{ textAlign: 'center' }}>
                  {ACTION_LABELS[action]}
                </div>
              ))}
            </div>

            {/* Rows */}
            {MODULES.map((mod, index) => {
              const modPerms = (permissionsViewRole.permissions?.[mod.key] as any) || {};
              return (
                <div
                  key={mod.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px repeat(4, 1fr)',
                    gap: 4,
                    padding: '8px 0',
                    borderBottom: '1px solid #f5f5f5',
                    background: index % 2 === 0 ? '#fafafa' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ paddingLeft: 8, fontSize: 13 }}>{mod.label}</div>
                  {ACTIONS.map((action) => (
                    <div key={action} style={{ textAlign: 'center' }}>
                      {modPerms[action] ? (
                        <Tag color="green" style={{ margin: 0 }}>
                          Oui
                        </Tag>
                      ) : (
                        <Tag color="default" style={{ margin: 0 }}>
                          Non
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

export { RolesListPage };
