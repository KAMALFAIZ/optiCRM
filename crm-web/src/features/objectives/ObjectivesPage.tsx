import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Select, InputNumber,
  Space, Popconfirm, Typography, Row, Col, Tag, Input,
  message, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AimOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import objectivesApi, { ObjectiveDto, CreateObjectiveRequest } from '@/api/objectives';
import apiClient from '@/api/client';

const { Title, Text } = Typography;
const { Option } = Select;

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const formatMAD = (v: number) =>
  v.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface UserOption { id: string; label: string; }
interface ProductOption { id: string; code: string; name: string; }

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<ObjectiveDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Filtres
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [filterUser, setFilterUser] = useState<string | undefined>();

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ObjectiveDto | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUsers(); loadProducts(); }, []);
  useEffect(() => { loadObjectives(); }, [filterYear, filterMonth, filterUser]);

  async function loadUsers() {
    try {
      const res = await apiClient.get<any>('/users?size=200');
      const data = res.data?.data?.content ?? res.data?.data ?? [];
      setUsers(data.map((u: any) => ({ id: u.id, label: `${u.firstName} ${u.lastName}` })));
    } catch { /* ignore */ }
  }

  async function loadProducts() {
    try {
      const res = await apiClient.get<any>('/products?size=500&isActive=true&isSellable=true');
      const data = res.data?.data?.content ?? res.data?.data ?? [];
      setProducts(data.map((p: any) => ({ id: p.id, code: p.code, name: p.name })));
    } catch { /* ignore */ }
  }

  async function loadObjectives() {
    setLoading(true);
    try {
      const data = await objectivesApi.listObjectives(filterYear, filterMonth, filterUser);
      setObjectives(data);
    } catch (e: any) {
      message.error('Erreur chargement objectifs');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ periodYear: filterYear, periodMonth: filterMonth });
    setModalOpen(true);
  }

  function openEdit(obj: ObjectiveDto) {
    setEditing(obj);
    form.setFieldsValue({
      userId: obj.userId,
      productId: obj.productId,
      periodYear: obj.periodYear,
      periodMonth: obj.periodMonth,
      targetQty: obj.targetQty,
      targetAmount: obj.targetAmount,
      notes: obj.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const req: CreateObjectiveRequest = {
        userId: vals.userId,
        productId: vals.productId,
        periodYear: vals.periodYear,
        periodMonth: vals.periodMonth ?? null,
        targetQty: vals.targetQty,
        targetAmount: vals.targetAmount,
        notes: vals.notes,
      };
      await objectivesApi.upsertObjective(req);
      message.success('Objectif enregistré');
      setModalOpen(false);
      loadObjectives();
    } catch (e: any) {
      if (e?.errorFields) return; // validation
      message.error('Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await objectivesApi.deleteObjective(id);
      message.success('Objectif supprimé');
      loadObjectives();
    } catch {
      message.error('Erreur suppression');
    }
  }

  const columns: ColumnsType<ObjectiveDto> = [
    {
      title: 'Commercial',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
      sorter: (a, b) => a.userName.localeCompare(b.userName),
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Article',
      key: 'product',
      width: 200,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.productName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.productCode}</Text>
        </Space>
      ),
      sorter: (a, b) => (a.productName || '').localeCompare(b.productName || ''),
    },
    {
      title: 'Période',
      key: 'period',
      width: 130,
      render: (_, r) => (
        <Tag color="blue">
          {r.periodMonth ? MONTHS[r.periodMonth - 1] : 'Annuel'} {r.periodYear}
        </Tag>
      ),
    },
    {
      title: 'Objectif Qté',
      dataIndex: 'targetQty',
      key: 'targetQty',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.targetQty - b.targetQty,
      render: (v) => <Text strong>{Number(v).toLocaleString('fr-MA')}</Text>,
    },
    {
      title: 'Objectif CA',
      dataIndex: 'targetAmount',
      key: 'targetAmount',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.targetAmount - b.targetAmount,
      render: (v) => <Text strong style={{ color: '#4F46E5' }}>{formatMAD(Number(v))}</Text>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (v) => v ? <Text type="secondary">{v}</Text> : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, r) => (
        <Space>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm
            title="Supprimer cet objectif ?"
            onConfirm={() => handleDelete(r.id)}
            okText="Oui" cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AimOutlined style={{ fontSize: 22, color: '#4F46E5' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>Objectifs Commerciaux</Title>
            <Text type="secondary">Saisie des objectifs par commercial et par article</Text>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nouvel objectif
        </Button>
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>Année</Text>
            <Select
              value={filterYear}
              onChange={setFilterYear}
              style={{ width: 100 }}
            >
              {[2024, 2025, 2026, 2027].map(y => <Option key={y} value={y}>{y}</Option>)}
            </Select>
          </Col>
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>Mois</Text>
            <Select
              value={filterMonth}
              onChange={setFilterMonth}
              allowClear
              placeholder="Tous"
              style={{ width: 130 }}
            >
              {MONTHS.map((m, i) => <Option key={i + 1} value={i + 1}>{m}</Option>)}
            </Select>
          </Col>
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>Commercial</Text>
            <Select
              value={filterUser}
              onChange={setFilterUser}
              allowClear
              placeholder="Tous"
              showSearch
              optionFilterProp="children"
              style={{ width: 200 }}
            >
              {users.map(u => <Option key={u.id} value={u.id}>{u.label}</Option>)}
            </Select>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={loadObjectives}>Actualiser</Button>
          </Col>
        </Row>
      </Card>

      {/* Tableau */}
      <Card style={{ borderRadius: 8 }}>
        <Table
          columns={columns}
          dataSource={objectives}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 900 }}
          summary={(data) => {
            const totalQty = data.reduce((s, r) => s + r.targetQty, 0);
            const totalAmt = data.reduce((s, r) => s + r.targetAmount, 0);
            return (
              <Table.Summary.Row style={{ background: '#f8f9fa', fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>TOTAL ({data.length} lignes)</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>{totalQty.toLocaleString('fr-MA')}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: '#4F46E5' }}>{formatMAD(totalAmt)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={2} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* Modal saisie */}
      <Modal
        title={editing ? 'Modifier l\'objectif' : 'Nouvel objectif'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Enregistrer"
        cancelText="Annuler"
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="periodYear" label="Année" rules={[{ required: true }]}>
                <Select>
                  {[2024, 2025, 2026, 2027].map(y => <Option key={y} value={y}>{y}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="periodMonth" label="Mois">
                <Select allowClear placeholder="Objectif annuel">
                  {MONTHS.map((m, i) => <Option key={i + 1} value={i + 1}>{m}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="userId" label="Commercial" rules={[{ required: true, message: 'Sélectionnez un commercial' }]}>
            <Select showSearch optionFilterProp="children" placeholder="Choisir un commercial">
              {users.map(u => <Option key={u.id} value={u.id}>{u.label}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="productId" label="Article" rules={[{ required: true, message: 'Sélectionnez un article' }]}>
            <Select showSearch optionFilterProp="children" placeholder="Choisir un article">
              {products.map(p => (
                <Option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="targetQty" label="Objectif Quantité" rules={[{ required: true }]}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} addonAfter="unités" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetAmount" label="Objectif CA" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes / Zone">
            <Input.TextArea rows={2} placeholder="Ex: Zone Casablanca Nord" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
