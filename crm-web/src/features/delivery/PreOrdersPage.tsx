import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Spin, Empty, Modal,
  Form, Select, InputNumber, Input, Popconfirm, Row, Col, Statistic,
  Divider, Alert,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ShoppingOutlined,
  SearchOutlined, DeleteOutlined, CalendarOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { preOrderApi, PreOrder, PreOrderItem } from '@/api/deliveryPhase3';
import { deliveryTourApi, DeliveryTour } from '@/api/delivery';
import { accountsApi } from '@/api/accounts';
import { productsApi } from '@/api/products';
import { useMessage } from '@/hooks/useMessage';
import type { AccountListItem } from '@/types/account';
import type { ProductListItem } from '@/types/product';

const { Text, Title } = Typography;

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  PENDING:   { color: 'blue',    label: 'En attente' },
  CONFIRMED: { color: 'green',   label: 'Confirmée'  },
  DELIVERED: { color: 'cyan',    label: 'Livrée'     },
  CANCELLED: { color: 'default', label: 'Annulée'    },
};

export default function PreOrdersPage() {
  const { message } = useMessage();
  const [orders, setOrders] = useState<PreOrder[]>([]);
  const [tours, setTours]   = useState<DeliveryTour[]>([]);
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTour, setSelectedTour] = useState<string | undefined>();
  const [items, setItems] = useState<Partial<PreOrderItem>[]>([{}]);
  const [form] = Form.useForm();

  const load = useCallback(async (tourId?: string) => {
    if (!tourId) { setOrders([]); return; }
    setLoading(true);
    try { setOrders(await preOrderApi.getByTour(tourId)); }
    catch { message.error('Erreur chargement commandes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    deliveryTourApi.list({ status: 'VALIDE' }).then(setTours).catch(() => {});
    accountsApi.getAll({ size: 200 }).then(r => setAccounts(r.content)).catch(() => {});
    productsApi.getAll({ size: 200, isActive: true }).then(r => setProducts(r.content)).catch(() => {});
  }, []);

  useEffect(() => { load(selectedTour); }, [selectedTour, load]);

  const accName  = (id?: string) => accounts.find(a => a.id === id)?.name || id?.substring(0, 8) + '…' || '—';
  const prodName = (id?: string) => products.find(p => p.id === id)?.name || id?.substring(0, 8) + '…' || '—';
  const tourLabel = (t: DeliveryTour) =>
    `${dayjs(t.tourDate).format('DD/MM/YYYY')}${t.zone ? ` — ${t.zone}` : ''}  [${t.status}]`;

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      await preOrderApi.create({
        deliveryTourId: v.deliveryTourId,
        customerId: v.customerId,
        notes: v.notes,
        items: items.filter(i => i.itemId).map(i => ({
          itemId: i.itemId,
          quantityOrdered: i.quantityOrdered || 1,
          unitPrice: i.unitPrice,
        })),
      });
      message.success('Commande créée');
      setModalOpen(false); form.resetFields(); setItems([{}]);
      load(selectedTour || v.deliveryTourId);
    } catch (e: any) {
      if (!e.errorFields) message.error(e?.response?.data?.error?.message || 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleConfirm = async (id: string) => {
    try { await preOrderApi.confirm(id); message.success('Commande confirmée — chargement généré'); load(selectedTour); }
    catch (e: any) { message.error(e?.response?.data?.error?.message || 'Erreur'); }
  };

  const handleCancel = async (id: string) => {
    try { await preOrderApi.cancel(id); message.success('Commande annulée'); load(selectedTour); }
    catch { message.error('Erreur'); }
  };

  const handleDelete = async (id: string) => {
    try { await preOrderApi.delete(id); message.success('Commande supprimée'); load(selectedTour); }
    catch (e: any) { message.error(e?.response?.data?.error?.message || 'Erreur'); }
  };

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
  };

  const cols: TableColumnsType<PreOrder> = [
    { title: 'Client', dataIndex: 'customerId', render: id => <Text strong>{accName(id)}</Text> },
    {
      title: 'Articles', dataIndex: 'items',
      render: (items: PreOrderItem[]) => (items || []).length > 0
        ? <Space size={2}>{(items || []).map((i, idx) => <Tag key={idx}>{prodName(i.itemId)} ×{i.quantityOrdered}</Tag>)}</Space>
        : <Text type="secondary">—</Text>,
    },
    { title: 'Statut', dataIndex: 'status', render: s => { const c = STATUS_CFG[s] || STATUS_CFG.PENDING; return <Tag color={c.color}>{c.label}</Tag>; } },
    { title: 'Notes', dataIndex: 'notes', render: n => n ? <Text type="secondary" style={{ fontSize: 12 }}>{n}</Text> : '—' },
    { title: 'Créée le', dataIndex: 'createdAt', render: d => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—' },
    {
      title: '', align: 'right',
      render: (_, r) => (
        <Space>
          {r.status === 'PENDING' && r.id && (
            <Popconfirm title="Confirmer cette commande ?" description="Un chargement sera généré automatiquement." onConfirm={() => handleConfirm(r.id!)} okText="Confirmer" cancelText="Annuler">
              <Button type="primary" size="small" icon={<CheckCircleOutlined />}>Confirmer</Button>
            </Popconfirm>
          )}
          {r.status === 'PENDING' && r.id && (
            <Popconfirm title="Annuler cette commande ?" onConfirm={() => handleCancel(r.id!)} okText="Oui" cancelText="Non">
              <Button size="small" danger icon={<CloseCircleOutlined />} />
            </Popconfirm>
          )}
          {(r.status === 'PENDING' || r.status === 'CANCELLED') && r.id && (
            <Popconfirm title="Supprimer ?" onConfirm={() => handleDelete(r.id!)} okText="Oui" cancelText="Non">
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={4} style={{ margin: 0 }}><ShoppingOutlined className="mr-2" />Commandes prévisionnelles</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Nouvelle commande</Button>
      </div>

      <Card size="small" className="mb-4">
        <Row gutter={12} align="middle">
          <Col>
            <Select
              placeholder="Filtrer par tournée"
              style={{ width: 320 }}
              allowClear showSearch optionFilterProp="label"
              value={selectedTour}
              onChange={setSelectedTour}
              options={tours.map(t => ({ value: t.id, label: tourLabel(t) }))}
              suffixIcon={<CalendarOutlined />}
            />
          </Col>
          {selectedTour && (
            <Col>
              <Alert
                type="info" showIcon
                message={`${stats.pending} en attente · ${stats.confirmed} confirmées`}
                style={{ padding: '2px 12px' }}
              />
            </Col>
          )}
        </Row>
      </Card>

      {selectedTour && (
        <Row gutter={12} className="mb-4">
          <Col span={6}><Card size="small"><Statistic title="Total" value={stats.total} prefix={<ShoppingOutlined />} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="En attente" value={stats.pending} valueStyle={{ color: '#1677ff' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Confirmées" value={stats.confirmed} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        </Row>
      )}

      <Spin spinning={loading}>
        {!selectedTour
          ? <Empty description="Sélectionnez une tournée pour voir ses commandes" />
          : orders.length === 0
          ? <Empty description="Aucune commande prévisionnelle pour cette tournée" />
          : <Card size="small">
              <Table columns={cols} dataSource={orders} rowKey="id" size="small"
                pagination={{ pageSize: 10, showTotal: t => `${t} commande(s)` }}
                expandable={{
                  expandedRowRender: r => (
                    <Table
                      size="small" pagination={false}
                      dataSource={r.items || []} rowKey={(_, i) => String(i)}
                      columns={[
                        { title: 'Article', dataIndex: 'itemId', render: id => <Text strong>{prodName(id)}</Text> },
                        { title: 'Commandé', dataIndex: 'quantityOrdered', align: 'center', render: v => <Tag color="blue">{v}</Tag> },
                        { title: 'Confirmé', dataIndex: 'quantityConfirmed', align: 'center', render: v => <Tag color="green">{v || 0}</Tag> },
                        { title: 'Prix unit.', dataIndex: 'unitPrice', align: 'right', render: v => v ? `${Number(v).toFixed(2)} DH` : '—' },
                      ]}
                    />
                  ),
                }}
              />
            </Card>
        }
      </Spin>

      <Modal
        title={<Space><ShoppingOutlined />Nouvelle commande prévisionnelle</Space>}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); setItems([{}]); }}
        onOk={handleSave}
        confirmLoading={submitting}
        okText="Créer la commande" cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item name="deliveryTourId" label="Tournée" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="Sélectionner une tournée"
              options={tours.filter(t => t.status === 'VALIDE').map(t => ({ value: t.id, label: `${dayjs(t.tourDate).format('DD/MM/YYYY')}${t.zone ? ` — ${t.zone}` : ''}` }))} />
          </Form.Item>
          <Form.Item name="customerId" label="Client" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="Rechercher un client…"
              suffixIcon={<SearchOutlined />}
              options={accounts.map(a => ({ value: a.id, label: a.name }))} />
          </Form.Item>

          <Divider orientation="left" plain><Text type="secondary">Articles commandés</Text></Divider>
          {items.map((item, idx) => (
            <Row gutter={8} key={idx} className="mb-2" align="middle">
              <Col span={10}>
                <Select size="small" placeholder="Article" style={{ width: '100%' }}
                  showSearch optionFilterProp="label"
                  value={item.itemId}
                  onChange={v => {
                    const p = products.find(p => p.id === v);
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], itemId: v, unitPrice: p?.unitPrice };
                    setItems(updated);
                  }}
                  options={products.map(p => ({ value: p.id, label: `${p.name}${p.code ? ` — ${p.code}` : ''}` }))} />
              </Col>
              <Col span={5}>
                <InputNumber size="small" min={1} placeholder="Qté" style={{ width: '100%' }}
                  value={item.quantityOrdered}
                  onChange={v => { const u = [...items]; u[idx] = { ...u[idx], quantityOrdered: v || 1 }; setItems(u); }} />
              </Col>
              <Col span={6}>
                <InputNumber size="small" min={0} step={0.01} placeholder="Prix DH" style={{ width: '100%' }}
                  value={item.unitPrice}
                  onChange={v => { const u = [...items]; u[idx] = { ...u[idx], unitPrice: v || undefined }; setItems(u); }} />
              </Col>
              <Col span={3}>
                {items.length > 1 && (
                  <Button size="small" type="text" danger icon={<DeleteOutlined />}
                    onClick={() => setItems(items.filter((_, i) => i !== idx))} />
                )}
              </Col>
            </Row>
          ))}
          <Button size="small" type="dashed" icon={<PlusOutlined />} className="mb-3"
            onClick={() => setItems([...items, {}])}>
            Ajouter un article
          </Button>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Instructions, commentaires…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
