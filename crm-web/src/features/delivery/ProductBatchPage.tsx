import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Spin, Empty, Modal,
  Form, Select, InputNumber, Input, DatePicker, Popconfirm, Row, Col,
  Statistic, Alert, Tooltip, Badge,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, WarningOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { productBatchApi, ProductBatch } from '@/api/deliveryPhase3';
import { productsApi } from '@/api/products';
import { useMessage } from '@/hooks/useMessage';
import type { ProductListItem } from '@/types/product';

const { Text, Title } = Typography;

const ALERT_CFG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  OK:       { color: 'green',   label: 'OK',       icon: <CheckCircleOutlined /> },
  WARNING:  { color: 'orange',  label: '≤ 30 j',   icon: <ExclamationCircleOutlined /> },
  CRITICAL: { color: 'red',     label: '≤ 7 j',    icon: <WarningOutlined /> },
  EXPIRED:  { color: 'default', label: 'Périmé',   icon: <WarningOutlined /> },
};

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  ACTIVE:   { color: 'green',   label: 'Actif'    },
  CONSUMED: { color: 'blue',    label: 'Consommé' },
  EXPIRED:  { color: 'default', label: 'Périmé'   },
  RECALLED: { color: 'red',     label: 'Rappel'   },
};

export default function ProductBatchPage() {
  const { message } = useMessage();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<ProductBatch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertFilter, setAlertFilter] = useState<string | undefined>();
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBatches(await productBatchApi.getAll());
    } catch { message.error('Erreur chargement lots'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    productsApi.getAll({ size: 200, isActive: true }).then(r => setProducts(r.content)).catch(() => {});
  }, [load]);

  const prodName = (id?: string) => products.find(p => p.id === id)?.name || id?.substring(0, 8) + '…' || '—';

  const openCreate = () => {
    setEditBatch(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (b: ProductBatch) => {
    setEditBatch(b);
    form.setFieldsValue({
      itemId: b.itemId,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate ? dayjs(b.expiryDate) : null,
      quantity: b.quantity,
      notes: b.notes,
      status: b.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      const payload: ProductBatch = {
        itemId: v.itemId,
        batchNumber: v.batchNumber,
        expiryDate: v.expiryDate ? (v.expiryDate as Dayjs).format('YYYY-MM-DD') : undefined,
        quantity: v.quantity,
        notes: v.notes,
        status: v.status,
      };
      if (editBatch?.id) {
        await productBatchApi.update(editBatch.id, payload);
        message.success('Lot mis à jour');
      } else {
        await productBatchApi.create(payload);
        message.success('Lot créé');
      }
      setModalOpen(false); form.resetFields(); load();
    } catch (e: any) {
      if (!e.errorFields) message.error('Erreur');
    } finally { setSubmitting(false); }
  };

  const handleMarkExpired = async () => {
    try {
      const res = await productBatchApi.markExpired();
      message.success(`${res.markedExpired} lot(s) marqué(s) périmé(s)`);
      load();
    } catch { message.error('Erreur'); }
  };

  const filtered = alertFilter
    ? batches.filter(b => b.expiryAlert === alertFilter)
    : batches;

  const stats = {
    total:    batches.length,
    active:   batches.filter(b => b.status === 'ACTIVE').length,
    warning:  batches.filter(b => b.expiryAlert === 'WARNING').length,
    critical: batches.filter(b => b.expiryAlert === 'CRITICAL' || b.expiryAlert === 'EXPIRED').length,
  };

  const cols: TableColumnsType<ProductBatch> = [
    { title: 'Article', dataIndex: 'itemId', render: id => <Text strong>{prodName(id)}</Text> },
    { title: 'N° lot', dataIndex: 'batchNumber', render: v => <Text code>{v}</Text> },
    {
      title: 'Date exp.', dataIndex: 'expiryDate',
      sorter: (a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''),
      render: (d, r) => {
        if (!d) return <Text type="secondary">—</Text>;
        const cfg = ALERT_CFG[r.expiryAlert || 'OK'];
        return (
          <Space>
            <Tooltip title={`${r.daysUntilExpiry} jour(s)`}>
              <Tag color={cfg.color} icon={cfg.icon}>{dayjs(d).format('DD/MM/YYYY')}</Tag>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Alerte', dataIndex: 'expiryAlert',
      filters: Object.entries(ALERT_CFG).map(([v, c]) => ({ text: c.label, value: v })),
      onFilter: (v, r) => r.expiryAlert === v,
      render: a => { const c = ALERT_CFG[a || 'OK']; return <Tag color={c.color}>{c.label}</Tag>; },
    },
    { title: 'Quantité', dataIndex: 'quantity', align: 'center', render: v => <Badge count={v} showZero color="#1677ff" /> },
    {
      title: 'Statut', dataIndex: 'status',
      render: s => { const c = STATUS_CFG[s] || STATUS_CFG.ACTIVE; return <Tag color={c.color}>{c.label}</Tag>; },
    },
    { title: 'Notes', dataIndex: 'notes', render: n => n ? <Text type="secondary" style={{ fontSize: 12 }}>{n}</Text> : '—' },
    {
      title: '', align: 'right',
      render: (_, r) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Supprimer ce lot ?" onConfirm={() => productBatchApi.delete(r.id!).then(load)} okText="Oui" cancelText="Non">
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={4} style={{ margin: 0 }}><InboxOutlined className="mr-2" />Lots & Péremptions</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleMarkExpired}>Marquer périmés</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nouveau lot</Button>
        </Space>
      </div>

      {stats.critical > 0 && (
        <Alert className="mb-4" type="error" showIcon icon={<WarningOutlined />}
          message={`⚠️ ${stats.critical} lot(s) périmé(s) ou critique(s) — action requise`}
          action={<Button size="small" onClick={() => setAlertFilter('CRITICAL')}>Voir</Button>}
        />
      )}
      {stats.warning > 0 && (
        <Alert className="mb-3" type="warning" showIcon
          message={`${stats.warning} lot(s) arrivent à expiration dans moins de 30 jours`}
          action={<Button size="small" onClick={() => setAlertFilter('WARNING')}>Voir</Button>}
        />
      )}

      <Row gutter={12} className="mb-4">
        <Col span={6}><Card size="small"><Statistic title="Total lots" value={stats.total} prefix={<InboxOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Actifs" value={stats.active} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderTop: stats.warning > 0 ? '3px solid #fa8c16' : undefined }}><Statistic title="Alerte ≤30j" value={stats.warning} valueStyle={{ color: stats.warning > 0 ? '#fa8c16' : undefined }} /></Card></Col>
        <Col span={6}><Card size="small" style={{ borderTop: stats.critical > 0 ? '3px solid #ff4d4f' : undefined }}><Statistic title="Critique / Périmé" value={stats.critical} valueStyle={{ color: stats.critical > 0 ? '#ff4d4f' : undefined }} /></Card></Col>
      </Row>

      {alertFilter && (
        <Alert className="mb-3" type="info"
          message={`Filtre actif : ${ALERT_CFG[alertFilter]?.label}`}
          action={<Button size="small" onClick={() => setAlertFilter(undefined)}>Effacer</Button>}
        />
      )}

      <Spin spinning={loading}>
        {filtered.length === 0
          ? <Empty description="Aucun lot enregistré" />
          : <Card size="small">
              <Table columns={cols} dataSource={filtered} rowKey="id" size="small"
                rowClassName={r => r.expiryAlert === 'EXPIRED' || r.expiryAlert === 'CRITICAL' ? 'ant-table-row-danger' : ''}
                pagination={{ pageSize: 15, showTotal: t => `${t} lot(s)` }}
              />
            </Card>
        }
      </Spin>

      <Modal
        title={editBatch ? 'Modifier le lot' : 'Nouveau lot'}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditBatch(null); }}
        onOk={handleSave}
        confirmLoading={submitting}
        okText={editBatch ? 'Mettre à jour' : 'Créer'} cancelText="Annuler"
        width={480}
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item name="itemId" label="Article" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="Sélectionner un article"
              options={products.map(p => ({ value: p.id, label: `${p.name}${p.code ? ` — ${p.code}` : ''}` }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="batchNumber" label="Numéro de lot" rules={[{ required: true }]}>
                <Input placeholder="Ex: LOT-2026-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantité" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="expiryDate" label="Date d'expiration">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Statut" initialValue="ACTIVE">
                <Select options={Object.entries(STATUS_CFG).map(([v, c]) => ({ value: v, label: c.label }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
