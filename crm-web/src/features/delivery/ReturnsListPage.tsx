import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Empty, Spin, Tag, Modal, Form, Select,
  Popconfirm, Row, Col, Statistic, DatePicker, Typography, InputNumber, Alert,
} from 'antd';
import { useMessage } from '@/hooks/useMessage';
import {
  PlusOutlined, CheckOutlined, SafetyCertificateOutlined,
  RollbackOutlined, SearchOutlined, InboxOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { returnEntryApi, deliveryTourApi, ReturnEntry, DeliveryTour } from '@/api/delivery';
import { productsApi } from '@/api/products';
import type { ProductListItem } from '@/types/product';

const { Text } = Typography;
const RETURN_REASONS = [
  'Non vendu',
  'Defaut qualite',
  'Produit endommage',
  'Mauvaise reference',
  'Client absent',
  'Refus client',
  'Date de peremption proche',
  'Surplus de stock',
  'Autre',
];
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT:     { color: 'blue',   label: 'En attente' },
  RECEIVED:  { color: 'orange', label: 'Recu' },
  VALIDATED: { color: 'green',  label: 'Valide' },
};

export default function ReturnsListPage() {
  const { message } = useMessage();
  const [tours, setTours] = useState<DeliveryTour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    // Charger toutes les tournées non-clôturées
    deliveryTourApi.list({}).then(data => {
      const active = data.filter(t => t.status !== 'CLOSED');
      setTours(active);
      // Priorité : EN_COURS > VALIDE > DRAFT
      const best =
        active.find(t => t.status === 'EN_COURS') ||
        active.find(t => t.status === 'VALIDE') ||
        active[0];
      if (best?.id) setSelectedTourId(best.id);
    }).catch(() => message.error('Erreur chargement tournees'));
    productsApi.getAll({ size: 200, isActive: true })
      .then(r => setProducts(r.content))
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedTourId) { setReturns([]); return; }
    setLoading(true);
    try {
      const data = await returnEntryApi.listByTour(selectedTourId);
      setReturns(data);
    } catch {
      message.error('Erreur chargement retours');
    } finally {
      setLoading(false);
    }
  }, [selectedTourId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedTourId) return;
      setSubmitting(true);
      await returnEntryApi.create({
        deliveryTourId: selectedTourId,
        itemId: values.itemId,
        quantity: Number(values.quantity),
        reason: values.reason,
        warehouseToId: values.warehouseToId?.[0],
        receivedDate: values.receivedDate ? (values.receivedDate as Dayjs).toISOString() : undefined,
      });
      message.success('Retour cree');
      setModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await returnEntryApi.receive(id);
      message.success('Retour marque comme recu');
      loadData();
    } catch {
      message.error('Erreur');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await returnEntryApi.validate(id);
      message.success('Retour valide');
      loadData();
    } catch {
      message.error('Erreur');
    }
  };

  const getProductName = (id?: string) => {
    if (!id) return '-';
    const p = products.find(p => p.id === id);
    return p ? p.name : id.substring(0, 8) + '...';
  };

  const stats = {
    total:     returns.length,
    pending:   returns.filter(r => r.status === 'DRAFT').length,
    received:  returns.filter(r => r.status === 'RECEIVED').length,
    validated: returns.filter(r => r.status === 'VALIDATED').length,
    totalQty:  returns.reduce((s, r) => s + (r.quantity || 0), 0),
  };

  const columns: TableColumnsType<ReturnEntry> = [
    {
      title: 'Article',
      dataIndex: 'itemId',
      render: (id) => <Text strong>{getProductName(id)}</Text>,
    },
    {
      title: 'Quantite',
      dataIndex: 'quantity',
      align: 'center',
      render: (v) => <Tag color="red">{v}</Tag>,
    },
    {
      title: 'Motif du retour',
      dataIndex: 'reason',
      render: (r) => r ? <Tag>{r}</Tag> : <Text type="secondary">---</Text>,
    },
    {
      title: 'Depot destination',
      dataIndex: 'warehouseToId',
      render: (v) => v
        ? <Text code style={{ fontSize: 12 }}>{v.substring(0, 8)}...</Text>
        : <Text type="secondary">---</Text>,
    },
    {
      title: 'Date reception',
      dataIndex: 'receivedDate',
      render: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : <Text type="secondary">---</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      filters: Object.entries(STATUS_CONFIG).map(([v, c]) => ({ text: c.label, value: v })),
      onFilter: (v, r) => r.status === v,
      render: (s) => {
        const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.DRAFT;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'DRAFT' && record.id && (
            <Popconfirm title="Confirmer la reception ?" onConfirm={() => handleReceive(record.id!)} okText="Confirmer" cancelText="Annuler">
              <Button type="primary" icon={<CheckOutlined />} size="small" ghost>Recu</Button>
            </Popconfirm>
          )}
          {record.status === 'RECEIVED' && record.id && (
            <Popconfirm title="Valider ce retour ?" onConfirm={() => handleValidate(record.id!)} okText="Valider" cancelText="Annuler">
              <Button type="primary" icon={<SafetyCertificateOutlined />} size="small">Valider</Button>
            </Popconfirm>
          )}
          {record.status === 'VALIDATED' && (
            <Tag icon={<SafetyCertificateOutlined />} color="green">Valide</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Row gutter={16} className="mb-4">
        {[
          { title: 'Total retours',  value: stats.total,     color: undefined },
          { title: 'Qte retournee', value: stats.totalQty,  color: '#ff4d4f' },
          { title: 'Recus',         value: stats.received,  color: '#faad14' },
          { title: 'Valides',       value: stats.validated, color: '#52c41a' },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card size="small">
              <Statistic title={s.title} value={s.value} valueStyle={s.color ? { color: s.color } : undefined} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card
        title={<Space><RollbackOutlined />Retours marchandise</Space>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} disabled={!selectedTourId}>
            Nouveau retour
          </Button>
        }
      >
        {tours.length === 0 ? (
          <Alert message="Creez d'abord une tournee" type="info" showIcon />
        ) : (
          <>
            <div className="mb-4">
              <Select
                style={{ width: 420 }}
                placeholder="Selectionner une tournee"
                value={selectedTourId}
                onChange={setSelectedTourId}
                options={tours.map(t => ({ value: t.id, label: `${t.tourDate} — ${t.zone || 'Sans zone'} [${t.status}]` }))}
                showSearch
                optionFilterProp="label"
              />
            </div>
            <Spin spinning={loading}>
              {returns.length === 0
                ? <Empty description="Aucun retour pour cette tournee" />
                : <Table columns={columns} dataSource={returns} rowKey="id" pagination={{ showTotal: (t) => `${t} retour(s)` }} />
              }
            </Spin>
          </>
        )}
      </Card>
      <Modal
        title={<Space><InboxOutlined />Nouveau retour marchandise</Space>}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText="Creer le retour"
        cancelText="Annuler"
        width={520}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="itemId" label="Article retourne" rules={[{ required: true, message: 'Article requis' }]}>
            <Select
              showSearch
              placeholder="Rechercher un article..."
              optionFilterProp="label"
              suffixIcon={<SearchOutlined />}
              options={products.map(p => ({
                value: p.id,
                label: `${p.name}${p.code ? ` -- ${p.code}` : ''}`,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantite" rules={[{ required: true, message: 'Quantite requise' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="receivedDate" label="Date de reception">
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="Motif du retour">
            <Select
              placeholder="Selectionner un motif"
              options={RETURN_REASONS.map(r => ({ value: r, label: r }))}
              allowClear
            />
          </Form.Item>
          <Form.Item name="warehouseToId" label="Depot destination (UUID)">
            <Select
              showSearch
              placeholder="UUID du depot destination"
              options={[]}
              notFoundContent="Saisir l'UUID du depot"
              mode="tags"
              maxTagCount={1}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
