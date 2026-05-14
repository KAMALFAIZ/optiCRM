import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Empty, Spin, Tag, Modal, Form, Select,
  Popconfirm, Row, Col, Statistic, Typography, InputNumber,
  Divider, List, Tabs,
} from 'antd';
import { useMessage } from '@/hooks/useMessage';
import {
  PlusOutlined, CheckOutlined, PlayCircleOutlined, ShoppingCartOutlined,
  DeleteOutlined, SearchOutlined, UserOutlined, SwapOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import {
  stockReplenishmentApi, StockReplenishment, StockReplenishmentItem,
  deliveryTourApi, DeliveryTour,
} from '@/api/delivery';
import { productsApi } from '@/api/products';
import { usersApi } from '@/api/users';
import type { ProductListItem } from '@/types/product';
import type { UserListItem } from '@/types/user';

const { Text, Title } = Typography;
const MOTIFS = [
  { value: 'URGENCE_STOCK_EPUISE',       label: 'Urgence stock epuise en tournee' },
  { value: 'OPPORTUNITE_VENTE',          label: 'Opportunite vente additionnelle' },
  { value: 'COMMANDE_URGENTE_CLIENT',    label: 'Commande urgente client regulier' },
  { value: 'MARCHANDISE_ENDOMMAGEE',     label: 'Marchandise endommagee en tournee' },
  { value: 'RETOUR_CLIENT_DEFECTUEUX',   label: 'Retour client - Produit defectueux' },
  { value: 'ECHANGE_CLIENT',             label: 'Echange produit - Client non satisfait' },
  { value: 'NOUVEAU_CLIENT',             label: 'Nouveau client identifie en tournee' },
  { value: 'RETOUR_NON_VENDU',           label: 'Retour marchandise non vendue' },
  { value: 'TRANSFERT_REEQUILIBRAGE',    label: 'Transfert depot - Reequilibrage stock' },
  { value: 'RECTIFICATION_INVENTAIRE',  label: 'Rectification inventaire - Ecart detecte' },
  { value: 'ECHANTILLONS_CADEAUX',       label: 'Echantillons / Cadeaux commerciaux' },
];
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT:       { color: 'blue',    label: 'Brouillon' },
  PENDING:     { color: 'orange',  label: 'En attente' },
  APPROVED:    { color: 'green',   label: 'Approuvé' },
  APPLIED:     { color: 'default', label: 'Appliqué' },
  TRANSFERRED: { color: 'cyan',    label: 'Transféré' },
};
const SOURCE_TYPES = [
  { value: 'WAREHOUSE', label: 'Depot' },
  { value: 'DELIVERY',  label: 'Tournee' },
  { value: 'CUSTOMER',  label: 'Client' },
];
const TARGET_TYPES = [
  { value: 'WAREHOUSE', label: 'Depot' },
  { value: 'DELIVERY',  label: 'Tournee' },
  { value: 'CUSTOMER',  label: 'Client' },
];

export default function StockReplenishmentListPage() {
  const { message } = useMessage();
  const [replenishments, setReplenishments] = useState<StockReplenishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferRecord, setTransferRecord] = useState<StockReplenishment | null>(null);
  const [transferTourId, setTransferTourId] = useState<string | undefined>(undefined);
  const [transferring, setTransferring] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [motifFilter, setMotifFilter] = useState<string | undefined>(undefined);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [tours, setTours] = useState<DeliveryTour[]>([]);
  const [items, setItems] = useState<Array<{ itemId?: string; quantity?: number; notes?: string }>>([{}]);
  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();

  useEffect(() => {
    productsApi.getAll({ size: 200, isActive: true }).then(r => setProducts(r.content)).catch(() => {});
    usersApi.getAll({ size: 100, isActive: true }).then(r => setUsers(r.content)).catch(() => {});
    deliveryTourApi.list().then(setTours).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (motifFilter) params.motive = motifFilter;
      const data = await stockReplenishmentApi.list(params);
      setReplenishments(data);
    } catch {
      message.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, motifFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const getProductName = (id?: string) => products.find(p => p.id === id)?.name || (id ? id.substring(0, 8) + '...' : '-');
  const getMotifLabel = (v?: string) => MOTIFS.find(m => m.value === v)?.label || v || '-';
  const getUserName  = (id?: string) => {
    const u = users.find(u => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : (id ? id.substring(0, 8) + '...' : '-');
  };
  const getTourLabel = (id?: string) => {
    const t = tours.find(t => t.id === id);
    return t ? `${t.tourDate} -- ${t.zone || 'Sans zone'}` : (id ? id.substring(0, 8) + '...' : '-');
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const validItems = items.filter(i => i.itemId && i.quantity && i.quantity > 0);
      if (validItems.length === 0) { message.warning('Ajoutez au moins un article'); return; }
      setSubmitting(true);
      await stockReplenishmentApi.create({
        sourceType: values.sourceType,
        sourceId:   values.sourceId,
        targetType: values.targetType,
        targetId:   values.targetId,
        motive:     values.motive,
        requestDate: new Date().toISOString(),
        items: validItems as StockReplenishmentItem[],
      });
      message.success('Demande de reapprovisionnement creee');
      setModalOpen(false);
      form.resetFields();
      setItems([{}]);
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      const values = await approveForm.validateFields();
      if (!selectedId) return;
      await stockReplenishmentApi.approve(selectedId, values.approvedByUserId);
      message.success('Demande approuvee');
      setApproveModalOpen(false);
      approveForm.resetFields();
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error('Erreur');
    }
  };

  const handleApply = async (id: string) => {
    try {
      await stockReplenishmentApi.apply(id);
      message.success('Reapprovisionnement applique');
      loadData();
    } catch {
      message.error('Erreur');
    }
  };

  const openTransfer = (record: StockReplenishment) => {
    setTransferRecord(record);
    // Si la cible est déjà une tournée, pré-remplir
    setTransferTourId(record.targetType === 'DELIVERY' ? record.targetId : undefined);
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferRecord?.id) return;
    // Si targetType != DELIVERY, la tournée est obligatoire
    if (transferRecord.targetType !== 'DELIVERY' && !transferTourId) {
      message.warning('Sélectionnez une tournée de destination');
      return;
    }
    setTransferring(true);
    try {
      const tourId = transferRecord.targetType === 'DELIVERY' ? undefined : transferTourId;
      await stockReplenishmentApi.transferToLoad(transferRecord.id, tourId);
      message.success('Articles transférés vers Chargements véhicule');
      setTransferModalOpen(false);
      setTransferRecord(null);
      loadData();
    } catch {
      message.error('Erreur lors du transfert');
    } finally {
      setTransferring(false);
    }
  };

  const addItem = () => setItems(prev => [...prev, {}]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const stats = {
    total:    replenishments.length,
    pending:  replenishments.filter(r => r.status === 'PENDING').length,
    approved: replenishments.filter(r => r.status === 'APPROVED').length,
    applied:  replenishments.filter(r => r.status === 'APPLIED').length,
  };

  const columns: TableColumnsType<StockReplenishment> = [
    {
      title: 'Date demande',
      dataIndex: 'requestDate',
      sorter: (a, b) => (a.requestDate || '').localeCompare(b.requestDate || ''),
      render: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '---',
    },
    {
      title: 'Motif',
      dataIndex: 'motive',
      render: (v) => (
        <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: getMotifLabel(v) }}>
          {getMotifLabel(v)}
        </Text>
      ),
      ellipsis: true,
    },
    {
      title: 'Source',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Tag>{r.sourceType}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.sourceType === 'DELIVERY' ? getTourLabel(r.sourceId) : r.sourceId?.substring(0, 8) + '...'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Destination',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Tag color="purple">{r.targetType}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.targetType === 'DELIVERY' ? getTourLabel(r.targetId) : r.targetId?.substring(0, 8) + '...'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Articles',
      render: (_, r) => <Tag>{r.items?.length || 0} article(s)</Tag>,
    },
    {
      title: 'Approuve par',
      dataIndex: 'approvedBy',
      render: (id) => id
        ? <Space><UserOutlined /><Text>{getUserName(id)}</Text></Space>
        : <Text type="secondary">---</Text>,
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
          {(record.status === 'DRAFT' || record.status === 'PENDING') && record.id && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              ghost
              onClick={() => { setSelectedId(record.id!); setApproveModalOpen(true); }}
            >
              Approuver
            </Button>
          )}
          {record.status === 'APPROVED' && record.id && (
            <>
              <Popconfirm title="Appliquer ce réapprovisionnement ?" onConfirm={() => handleApply(record.id!)} okText="Appliquer" cancelText="Annuler">
                <Button type="primary" icon={<PlayCircleOutlined />} size="small">Appliquer</Button>
              </Popconfirm>
              <Button
                icon={<SwapOutlined />}
                size="small"
                style={{ color: '#13c2c2', borderColor: '#13c2c2' }}
                onClick={() => openTransfer(record)}
              >
                → Chargement
              </Button>
            </>
          )}
          {record.status === 'APPLIED' && <Tag color="default">Terminé</Tag>}
          {record.status === 'TRANSFERRED' && <Tag color="cyan">Transféré</Tag>}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Row gutter={16} className="mb-4">
        {[
          { title: 'Total demandes', value: stats.total,    color: undefined },
          { title: 'En attente',     value: stats.pending,  color: '#faad14' },
          { title: 'Approuves',      value: stats.approved, color: '#52c41a' },
          { title: 'Appliques',      value: stats.applied,  color: '#8c8c8c' },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card size="small">
              <Statistic title={s.title} value={s.value} valueStyle={s.color ? { color: s.color } : undefined} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card
        title={<Space><ShoppingCartOutlined />Reapprovisionnements</Space>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Nouvelle demande
          </Button>
        }
      >
        <Row gutter={12} className="mb-4">
          <Col>
            <Select
              placeholder="Filtrer par statut"
              style={{ width: 180 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="Filtrer par motif"
              style={{ width: 280 }}
              showSearch
              optionFilterProp="label"
              allowClear
              value={motifFilter}
              onChange={setMotifFilter}
              options={MOTIFS}
            />
          </Col>
        </Row>
        <Spin spinning={loading}>
          {replenishments.length === 0
            ? <Empty description="Aucune demande de reapprovisionnement" />
            : (
              <Table
                columns={columns}
                dataSource={replenishments}
                rowKey="id"
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '8px 16px' }}>
                      <Title level={5} style={{ marginBottom: 8 }}>Articles demandes</Title>
                      <List
                        size="small"
                        dataSource={record.items || []}
                        renderItem={(item) => (
                          <List.Item>
                            <Space>
                              <Tag color="blue">{item.quantity} unite(s)</Tag>
                              <Text strong>{getProductName(item.itemId)}</Text>
                              {item.notes && <Text type="secondary">-- {item.notes}</Text>}
                            </Space>
                          </List.Item>
                        )}
                        locale={{ emptyText: 'Aucun article' }}
                      />
                    </div>
                  ),
                }}
                pagination={{ showTotal: (t) => `${t} demande(s)` }}
              />
            )
          }
        </Spin>
      </Card>
      <Modal
        title={<Space><ShoppingCartOutlined />Nouvelle demande de reapprovisionnement</Space>}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); setItems([{}]); }}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText="Creer la demande"
        cancelText="Annuler"
        width={680}
      >
        <Tabs
          items={[
            {
              key: '1',
              label: 'Informations generales',
              children: (
                <Form form={form} layout="vertical" className="mt-2">
                  <Form.Item name="motive" label="Motif du reapprovisionnement" rules={[{ required: true, message: 'Motif requis' }]}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Selectionner un motif"
                      options={MOTIFS}
                    />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="sourceType" label="Type de source" rules={[{ required: true }]}>
                        <Select placeholder="Source" options={SOURCE_TYPES} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sourceId" label="Source (UUID / Tournee)" rules={[{ required: true, message: 'Requis' }]}>
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Selectionner ou saisir"
                          options={tours.map(t => ({ value: t.id, label: `${t.tourDate} -- ${t.zone || 'Sans zone'}` }))}
                          mode="tags"
                          maxTagCount={1}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="targetType" label="Type de destination" rules={[{ required: true }]}>
                        <Select placeholder="Destination" options={TARGET_TYPES} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="targetId" label="Destination (UUID / Tournee)" rules={[{ required: true, message: 'Requis' }]}>
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Selectionner ou saisir"
                          options={tours.map(t => ({ value: t.id, label: `${t.tourDate} -- ${t.zone || 'Sans zone'}` }))}
                          mode="tags"
                          maxTagCount={1}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              ),
            },
            {
              key: '2',
              label: `Articles (${items.filter(i => i.itemId).length})`,
              children: (
                <div>
                  {items.map((item, idx) => (
                    <Row gutter={12} key={idx} align="middle" className="mb-2">
                      <Col flex="auto">
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Choisir un article..."
                          suffixIcon={<SearchOutlined />}
                          style={{ width: '100%' }}
                          value={item.itemId}
                          onChange={(v) => updateItem(idx, 'itemId', v)}
                          options={products.map(p => ({ value: p.id, label: `${p.name}${p.code ? ` -- ${p.code}` : ''}` }))}
                        />
                      </Col>
                      <Col style={{ width: 120 }}>
                        <InputNumber
                          min={1}
                          placeholder="Quantite"
                          value={item.quantity}
                          onChange={(v) => updateItem(idx, 'quantity', v)}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Divider dashed />
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addItem} block>
                    Ajouter un article
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Modal>
      <Modal
        title={<Space><CheckOutlined />Approuver la demande</Space>}
        open={approveModalOpen}
        forceRender
        onCancel={() => { setApproveModalOpen(false); approveForm.resetFields(); }}
        onOk={handleApprove}
        okText="Approuver"
        cancelText="Annuler"
      >
        <Form form={approveForm} layout="vertical" className="mt-4">
          <Form.Item name="approvedByUserId" label="Approuve par" rules={[{ required: true, message: 'Selectionner un approbateur' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Selectionner un utilisateur"
              options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal Transfert vers chargement ── */}
      <Modal
        title={<Space><SwapOutlined style={{ color: '#13c2c2' }} />Transférer vers Chargements véhicule</Space>}
        open={transferModalOpen}
        onCancel={() => { setTransferModalOpen(false); setTransferRecord(null); }}
        onOk={handleTransfer}
        confirmLoading={transferring}
        okText="Transférer"
        okButtonProps={{ style: { background: '#13c2c2', borderColor: '#13c2c2' } }}
        cancelText="Annuler"
        width={480}
      >
        {transferRecord && (
          <div style={{ marginTop: 12 }}>
            {/* Résumé du réappro */}
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#52c41a', fontWeight: 600, marginBottom: 6 }}>Réapprovisionnement sélectionné</div>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: '#8c8c8c' }}>Motif : </span>
                <strong>{MOTIFS.find(m => m.value === transferRecord.motive)?.label || transferRecord.motive}</strong>
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                <span style={{ color: '#8c8c8c' }}>Articles : </span>
                <strong>{transferRecord.items?.length || 0} article(s)</strong>
                {transferRecord.items?.map(i => (
                  <Tag key={i.id} style={{ marginLeft: 4, fontSize: 11 }}>
                    {products.find(p => p.id === i.itemId)?.name || i.itemId?.substring(0, 8)} × {i.quantity}
                  </Tag>
                ))}
              </div>
            </div>

            {/* Tournée cible — obligatoire si targetType != DELIVERY */}
            {transferRecord.targetType === 'DELIVERY' ? (
              <div style={{ fontSize: 12, color: '#595959' }}>
                <span style={{ color: '#8c8c8c' }}>Tournée cible : </span>
                <Tag color="blue">{getTourLabel(transferRecord.targetId)}</Tag>
                <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 11 }}>
                  La session sera créée dans cette tournée.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: '#595959', marginBottom: 6 }}>
                  <span style={{ color: '#ff4d4f' }}>* </span>
                  Sélectionnez la tournée de destination :
                </div>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Sélectionner une tournée…"
                  showSearch optionFilterProp="label"
                  value={transferTourId}
                  onChange={setTransferTourId}
                  options={tours.map(t => ({
                    value: t.id,
                    label: `${t.tourDate} — ${t.zone || t.region || 'Sans zone'}`,
                  }))}
                />
              </div>
            )}

            <div style={{ marginTop: 14, padding: '8px 12px', background: '#e6f7ff', borderRadius: 6, fontSize: 11, color: '#1677ff' }}>
              Une session de chargement DRAFT sera créée avec ces articles. Le statut du réappro passera à <strong>Transféré</strong>.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
