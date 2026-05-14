import { useCallback, useEffect, useState } from 'react';
import {
  App, Badge, Button, Card, Form, Input, Modal, Popconfirm,
  Select, Space, Table, Tag, Typography, Tooltip,
} from 'antd';
import {
  DatabaseOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined, SyncOutlined, PlusOutlined, UserOutlined,
  GlobalOutlined, MailOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

const { Title, Text } = Typography;

// ── Types ────────────────────────────────────────────────────────────────────

interface TenantDto {
  id: string;
  slug: string;
  name: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  planName: string | null;
  adminEmail: string | null;
  dbProvisioned: boolean;
  dbName: string | null;
  dbProvisionedAt: string | null;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
}

const STATUS_COLOR: Record<string, string> = {
  TRIAL:     'blue',
  ACTIVE:    'green',
  SUSPENDED: 'orange',
  CANCELLED: 'red',
};

// ── Slugify helper ───────────────────────────────────────────────────────────
function toSlug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TenantsAdminPage() {
  const { message, notification } = App.useApp();
  const [tenants, setTenants]           = useState<TenantDto[]>([]);
  const [plans, setPlans]               = useState<Plan[]>([]);
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [creating, setCreating]         = useState(false);
  const [provisioning, setProvisioning] = useState<Set<string>>(new Set());
  const [deleting, setDeleting]         = useState<Set<string>>(new Set());
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: p }] = await Promise.all([
        apiClient.get<TenantDto[]>('/superadmin/tenants'),
        apiClient.get<Plan[]>('/public/subscription-plans'),
      ]);
      setTenants(t);
      setPlans(p);
    } catch {
      message.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Création d'un client ──────────────────────────────────────────────────

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      const { data } = await apiClient.post('/public/tenants/register', {
        slug:        values.slug,
        companyName: values.companyName,
        adminEmail:  values.adminEmail,
        planId:      values.planId,
      });
      if (data.success === false) {
        const err = data.error;
        message.error(typeof err === 'string' ? err : err?.message || 'Erreur de création');
        return;
      }
      message.success(`Client '${values.companyName}' créé — base opticrm_${values.slug} en cours de provisionnement`);
      setModalOpen(false);
      form.resetFields();
      await load();
    } catch (e: any) {
      const err = e?.response?.data?.error;
      message.error(typeof err === 'string' ? err : err?.message || e?.response?.data?.message || 'Erreur réseau');
    } finally {
      setCreating(false);
    }
  };

  // ── Provision ────────────────────────────────────────────────────────────

  const handleProvision = async (id: string, slug: string) => {
    setProvisioning(prev => new Set(prev).add(id));
    try {
      const { data } = await apiClient.post(`/superadmin/tenants/${id}/provision-database`);
      if (data.success) {
        message.success(`Base '${data.dbName}' créée pour ${slug}`);
        await load();
      } else {
        message.error(data.error || 'Erreur de provisioning');
      }
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Erreur réseau');
    } finally {
      setProvisioning(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleting(prev => new Set(prev).add(id));
    try {
      await apiClient.delete(`/superadmin/tenants/${id}`);
      notification.success({
        message: 'Client supprimé',
        description: `Le client '${name}' a été supprimé.`,
        placement: 'topRight',
      });
      setTenants(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      const errData = e?.response?.data?.error;
      const detail = typeof errData === 'string' ? errData : errData?.message || e?.response?.data?.message || e?.message || 'Erreur réseau';
      notification.error({
        message: 'Suppression impossible',
        description: String(detail),
        placement: 'topRight',
      });
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/superadmin/tenants/${id}/status?status=${status}`);
      message.success('Statut mis à jour');
      setTenants(prev => prev.map(t => t.id === id ? { ...t, status: status as TenantDto['status'] } : t));
    } catch {
      message.error('Impossible de changer le statut');
    }
  };

  // ── Colonnes ──────────────────────────────────────────────────────────────

  const columns: ColumnsType<TenantDto> = [
    {
      title: 'Client',
      key: 'client',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.slug}.opticrm.ma</Text>
        </div>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 130,
      render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'Plan',
      dataIndex: 'planName',
      width: 120,
      render: (v) => v ? <Tag color="purple">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Base de données',
      key: 'db',
      width: 240,
      render: (_, r) => r.dbProvisioned ? (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text code style={{ fontSize: 12 }}>{r.dbName}</Text>
          </Space>
          {r.dbProvisionedAt && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {new Date(r.dbProvisionedAt).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </Space>
      ) : (
        <Space>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>Non provisionnée</Text>
        </Space>
      ),
    },
    {
      title: 'Admin',
      dataIndex: 'adminEmail',
      width: 200,
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Inscription',
      dataIndex: 'createdAt',
      width: 110,
      render: (v) => new Date(v).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 210,
      render: (_, r) => (
        <Space size={8}>
          <Popconfirm
            title={r.dbProvisioned ? `Re-migrer '${r.dbName}' ?` : `Créer 'opticrm_${r.slug}' ?`}
            onConfirm={() => handleProvision(r.id, r.slug)}
            okText="Confirmer" cancelText="Annuler"
          >
            <Button
              type={r.dbProvisioned ? 'default' : 'primary'}
              size="small"
              icon={provisioning.has(r.id) ? <SyncOutlined spin /> : <DatabaseOutlined />}
              loading={provisioning.has(r.id)}
              style={!r.dbProvisioned ? { background: '#405189', borderColor: '#405189' } : {}}
            >
              {r.dbProvisioned ? 'Re-migrer' : 'Créer la base'}
            </Button>
          </Popconfirm>

          <Select
            value={r.status}
            size="small"
            style={{ width: 110 }}
            onChange={(v) => handleStatusChange(r.id, v)}
            options={[
              { value: 'TRIAL',     label: 'Trial' },
              { value: 'ACTIVE',    label: 'Actif' },
              { value: 'SUSPENDED', label: 'Suspendu' },
              { value: 'CANCELLED', label: 'Annulé' },
            ]}
          />

          <Popconfirm
            title={`Supprimer '${r.name}' ?`}
            description="Cette action est irréversible."
            onConfirm={() => handleDelete(r.id, r.name)}
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
            disabled={r.slug === 'default'}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deleting.has(r.id)}
              disabled={r.slug === 'default'}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  const provisioned = tenants.filter(t => t.dbProvisioned).length;
  const pending     = tenants.length - provisioned;

  return (
    <div style={{ padding: '0 8px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Clients SaaS — Bases de données</Title>
          <Text type="secondary">Provisionnement database-per-tenant OptiCRM</Text>
        </div>
        <Space>
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading} />
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); setModalOpen(true); }}
            style={{ background: '#405189', borderColor: '#405189' }}
          >
            Nouveau client
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#405189' }}>{tenants.length}</div>
          <Text type="secondary">Total clients</Text>
        </Card>
        <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{provisioned}</div>
          <Text type="secondary">Bases provisionnées</Text>
        </Card>
        <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}>{pending}</div>
          <Text type="secondary">En attente</Text>
        </Card>
        <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}>
            {tenants.filter(t => t.status === 'ACTIVE').length}
          </div>
          <Text type="secondary">Clients actifs</Text>
        </Card>
      </div>

      {/* Table */}
      <Card
        variant="borderless"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#405189' }} />
            <span>Liste des tenants</span>
            <Badge count={pending} style={{ backgroundColor: '#ff4d4f' }} title="Sans base provisionnée" />
          </Space>
        }
      >
        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `${t} client(s)` }}
          rowClassName={(r) => !r.dbProvisioned ? 'ant-table-row-warning' : ''}
        />
      </Card>

      {/* ── Modal Nouveau client ────────────────────────────────────────── */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#405189' }} />
            <span>Nouveau client SaaS</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Créer le client"
        cancelText="Annuler"
        confirmLoading={creating}
        okButtonProps={{ style: { background: '#405189', borderColor: '#405189' } }}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nom de l'entreprise"
            name="companyName"
            rules={[{ required: true, message: 'Requis' }, { min: 2 }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Acme SARL"
              onChange={(e) => {
                const slug = toSlug(e.target.value);
                form.setFieldValue('slug', slug);
              }}
            />
          </Form.Item>

          <Form.Item
            label="Sous-domaine (slug)"
            name="slug"
            rules={[
              { required: true, message: 'Requis' },
              { pattern: /^[a-z0-9-]{3,50}$/, message: 'Minuscules, chiffres et tirets (3-50 caractères)' },
            ]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Accessible sur : <strong>acme.opticrm.ma</strong> — base : <strong>opticrm_acme</strong>
              </Text>
            }
          >
            <Input
              prefix={<GlobalOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="acme"
              addonAfter=".opticrm.ma"
            />
          </Form.Item>

          <Form.Item
            label="Email administrateur"
            name="adminEmail"
            rules={[{ required: true, message: 'Requis' }, { type: 'email', message: 'Email invalide' }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="admin@acme.ma"
            />
          </Form.Item>

          <Form.Item
            label="Plan d'abonnement"
            name="planId"
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Select
              placeholder="Choisir un plan"
              options={plans.map(p => ({
                value: p.id,
                label: `${p.name}${p.priceMonthly > 0 ? ` — ${p.priceMonthly} MAD/mois` : ' (Gratuit)'}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .ant-table-row-warning td { background: #fffbe6 !important; }
      `}</style>
    </div>
  );
}
