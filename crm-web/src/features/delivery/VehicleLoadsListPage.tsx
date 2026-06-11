import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Empty, Spin, Tag, Modal, Form, Select,
  Popconfirm, Row, Col, Statistic, DatePicker, Typography, InputNumber,
  Alert, Divider, Badge,
} from 'antd';
import { useMessage } from '@/hooks/useMessage';
import {
  PlusOutlined, CheckOutlined, TruckOutlined, InboxOutlined,
  SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { vehicleLoadApi, deliveryTourApi, VehicleLoad, VehicleLoadItem, DeliveryTour } from '@/api/delivery';
import { productsApi } from '@/api/products';
import type { ProductListItem } from '@/types/product';
import { warehousesApi } from '@/api/warehouses';
import type { Warehouse } from '@/types/warehouse';

const { Text } = Typography;

interface LoadLine {
  key: number;
  itemId?: string;
  quantity?: number;
}

interface LoadSession {
  sessionId: string;
  warehouseFromId?: string;
  loadDate?: string;
  status: string;
  items: VehicleLoadItem[];
  totalQty: number;
  sessionStatus: 'LOADED' | 'DRAFT';
}

let lineKey = 0;
const newLine = (): LoadLine => ({ key: ++lineKey });

function toSessions(loads: VehicleLoad[]): LoadSession[] {
  return loads.map(load => {
    const items = load.items || [];
    const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const status = load.status || 'DRAFT';
    return {
      sessionId: load.id || 'unknown',
      warehouseFromId: load.warehouseFromId,
      loadDate: load.loadDate,
      status,
      items,
      totalQty,
      sessionStatus: (status === 'LOADED' ? 'LOADED' : 'DRAFT') as 'LOADED' | 'DRAFT',
    };
  }).sort((a, b) => dayjs(b.loadDate || 0).unix() - dayjs(a.loadDate || 0).unix());
}

export default function VehicleLoadsListPage() {
  const { message } = useMessage();
  const [tours,          setTours]          = useState<DeliveryTour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [loads,          setLoads]          = useState<VehicleLoad[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [products,       setProducts]       = useState<ProductListItem[]>([]);
  const [warehouses,     setWarehouses]     = useState<Warehouse[]>([]);

  // Create modal
  const [createModal,    setCreateModal]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [form]                              = Form.useForm();
  const [lines,          setLines]          = useState<LoadLine[]>([newLine()]);

  // Detail session
  const [detailSession,  setDetailSession]  = useState<LoadSession | null>(null);

  // Edit item modal
  const [editModal,      setEditModal]      = useState(false);
  const [editForm]                          = Form.useForm();
  const [editTarget,     setEditTarget]     = useState<VehicleLoadItem | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Inline add lines
  const [inlineLines,    setInlineLines]    = useState<LoadLine[]>([]);
  const [savingLines,    setSavingLines]    = useState(false);

  useEffect(() => {
    deliveryTourApi.list({ status: 'VALIDE' }).then(data => {
      setTours(data);
      const first = data.find(t => t.status === 'VALIDE');
      if (first?.id) setSelectedTourId(first.id);
    }).catch(() => message.error('Erreur chargement tournées'));
    productsApi.getAll({ size: 200, isActive: true, isStockable: true })
      .then(r => setProducts(r.content)).catch(() => {});
    warehousesApi.getActive().then(setWarehouses).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedTourId) { setLoads([]); return; }
    setLoading(true);
    try { setLoads(await vehicleLoadApi.listByTour(selectedTourId)); }
    catch { message.error('Erreur chargement données'); }
    finally { setLoading(false); }
  }, [selectedTourId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getWarehouseName = (id?: string) => { const w = warehouses.find(w => w.id === id); return w ? `${w.name}${w.code ? ` (${w.code})` : ''}` : null; };
  const getTourRep       = (tourId?: string | null) => { const t = tours.find(t => t.id === tourId); return t?.assignedTo?.fullName || '—'; };

  const productOptions   = products.map(p => ({ value: p.id, label: `(${p.code || '?'}) ${p.name}` }));
  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: `${w.name}${w.code ? ` (${w.code})` : ''}` }));

  const sessions   = toSessions(loads);
  const totalQty   = sessions.reduce((s, sess) => s + sess.totalQty, 0);
  const totalItems = sessions.reduce((s, sess) => s + sess.items.length, 0);
  const loadedCount = sessions.filter(s => s.sessionStatus === 'LOADED').length;

  // ── Create ─────────────────────────────────────────────────────────────────
  const openCreate = () => {
    form.resetFields();
    setLines([newLine()]);
    setCreateModal(true);
  };

  const handleCreate = async () => {
    try {
      const header = await form.validateFields();
      if (!selectedTourId) return;
      const valid = lines.filter(l => l.itemId && l.quantity && l.quantity > 0);
      if (!valid.length) { message.warning('Ajoutez au moins une ligne'); return; }
      setSubmitting(true);
      await vehicleLoadApi.create({
        deliveryTourId: selectedTourId,
        warehouseFromId: header.warehouseFromId || undefined,
        loadDate: header.loadDate ? (header.loadDate as Dayjs).toISOString() : undefined,
        items: valid.map(l => ({ itemId: l.itemId, quantity: l.quantity })),
      });
      message.success(`Session créée avec ${valid.length} ligne(s)`);
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error('Erreur lors de la création');
    } finally { setSubmitting(false); }
  };

  // ── Edit item ──────────────────────────────────────────────────────────────
  const openEdit = (item: VehicleLoadItem) => {
    setEditTarget(item);
    editForm.setFieldsValue({ itemId: item.itemId, quantity: item.quantity });
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editTarget?.id) return;
    try {
      const v = await editForm.validateFields();
      setEditSubmitting(true);
      await vehicleLoadApi.updateItem(editTarget.id, { itemId: v.itemId, quantity: Number(v.quantity) });
      message.success('Ligne modifiée');
      setEditModal(false);
      loadData();
      if (detailSession) {
        setDetailSession(s => s ? {
          ...s,
          items: s.items.map(i => i.id === editTarget.id ? { ...i, itemId: v.itemId, quantity: Number(v.quantity) } : i),
        } : null);
      }
    } catch (err: any) {
      if (err.errorFields) return;
      message.error('Erreur modification');
    } finally { setEditSubmitting(false); }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleConfirmSession = async (s: LoadSession) => {
    try {
      await vehicleLoadApi.confirmSession(s.sessionId);
      message.success('Session confirmée');
      loadData();
      setDetailSession(null);
    } catch { message.error('Erreur confirmation'); }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await vehicleLoadApi.deleteItem(itemId);
      message.success('Ligne supprimée');
      loadData();
      setDetailSession(s => s ? { ...s, items: s.items.filter(i => i.id !== itemId) } : null);
    } catch { message.error('Erreur suppression'); }
  };

  const handleDeleteSession = async (s: LoadSession) => {
    try {
      await vehicleLoadApi.delete(s.sessionId);
      message.success('Session supprimée');
      loadData();
      setDetailSession(null);
    } catch { message.error('Erreur suppression session'); }
  };

  const refreshDetailSession = async (sessionId: string) => {
    try {
      const updated = await vehicleLoadApi.getById(sessionId);
      setDetailSession(toSessions([updated])[0] ?? null);
    } catch { /* silent */ }
  };

  const handleSaveAllInlineLines = async () => {
    if (!detailSession) return;
    const valid = inlineLines.filter(l => l.itemId && l.quantity && l.quantity > 0);
    if (!valid.length) { message.warning('Remplissez au moins une ligne (article + quantité)'); return; }
    setSavingLines(true);
    try {
      await Promise.all(valid.map(l => vehicleLoadApi.addItem(detailSession.sessionId, { itemId: l.itemId!, quantity: l.quantity! })));
      message.success(`${valid.length} ligne(s) enregistrée(s)`);
      setInlineLines([]);
      await Promise.all([loadData(), refreshDetailSession(detailSession.sessionId)]);
    } catch { message.error('Erreur lors de l\'enregistrement'); }
    finally { setSavingLines(false); }
  };

  // ── Session table columns ──────────────────────────────────────────────────
  const sessionColumns: TableColumnsType<LoadSession> = [
    {
      title: 'Date',
      render: (_, s) => s.loadDate
        ? <Text strong>{dayjs(s.loadDate).format('DD/MM/YYYY HH:mm')}</Text>
        : <Text type="secondary">—</Text>,
      width: 170,
    },
    {
      title: 'Dépôt source',
      render: (_, s) => {
        const name = getWarehouseName(s.warehouseFromId);
        return name ? <Tag icon={<InboxOutlined />} color="geekblue">{name}</Tag> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Représentant',
      render: () => <Text>{getTourRep(selectedTourId)}</Text>,
      width: 180,
    },
    {
      title: 'Statut',
      render: (_, s) =>
        s.sessionStatus === 'LOADED'
          ? <Badge status="success" text="Chargé" />
          : <Badge status="warning" text="En attente" />,
      align: 'center',
      width: 140,
    },
    {
      title: 'Nbr Articles',
      render: (_, s) => (
        <Space>
          <Tag color="blue">{s.items.length}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>/ {s.totalQty} unités</Text>
        </Space>
      ),
      align: 'center',
      width: 160,
    },
    {
      title: '',
      align: 'right',
      width: 60,
      render: (_, s) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => { setDetailSession(s); setInlineLines([]); }}
          style={{ color: '#1677ff' }}
        />
      ),
    },
  ];

  // ── Item table columns (inside detail popup) ───────────────────────────────
  const itemColumns: TableColumnsType<VehicleLoadItem> = [
    {
      title: 'Article',
      render: (_, l) => {
        const p = products.find(x => x.id === l.itemId);
        if (!p) return <Text type="secondary">{l.itemId ? l.itemId.substring(0, 8) + '…' : '—'}</Text>;
        return (
          <span>
            <Text type="secondary" style={{ fontSize: 11, marginRight: 6 }}>{p.code}</Text>
            <Text strong>{p.name}</Text>
          </span>
        );
      },
    },
    {
      title: 'Quantité', dataIndex: 'quantity', align: 'center', width: 90,
      render: (v) => <Tag color="blue" style={{ fontWeight: 600 }}>{v}</Tag>,
    },
    {
      title: 'Actions', align: 'right', width: 80,
      render: (_, record) => {
        if (detailSession?.sessionStatus === 'LOADED') return <Tag style={{ fontSize: 10 }}>Verrouillé</Tag>;
        return (
          <Space size={4}>
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
            <Popconfirm
              title="Supprimer cette ligne ?"
              onConfirm={() => handleDeleteItem(record.id!)}
              okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler"
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Stats */}
      <Row gutter={16} className="mb-4">
        {[
          { title: 'Sessions',       value: sessions.length,  color: '#1677ff' },
          { title: 'Total articles', value: totalItems,       color: undefined  },
          { title: 'Qté totale',     value: totalQty,         color: '#1677ff' },
          { title: 'Confirmées',     value: loadedCount,      color: '#52c41a' },
          { title: 'En attente',     value: sessions.length - loadedCount, color: '#faad14' },
        ].map(s => (
          <Col span={s.title === 'Sessions' ? 4 : 5} key={s.title}>
            <Card size="small">
              <Statistic title={s.title} value={s.value} valueStyle={s.color ? { color: s.color } : undefined} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Liste sessions */}
      <Card
        title={<Space><TruckOutlined />Chargements véhicule</Space>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!selectedTourId}>
            Nouveau chargement
          </Button>
        }
      >
        {tours.length === 0 ? (
          <Alert message="Créez d'abord une tournée validée" type="info" showIcon />
        ) : (
          <>
            <div className="mb-4">
              <Select
                style={{ width: 420 }}
                placeholder="Sélectionner une tournée"
                value={selectedTourId}
                onChange={setSelectedTourId}
                options={tours.filter(t => t.status === 'VALIDE').map(t => ({
                  value: t.id,
                  label: `${t.tourDate} — ${t.region || 'Sans zone'}`,
                }))}
                showSearch optionFilterProp="label"
              />
            </div>
            <Spin spinning={loading}>
              {sessions.length === 0
                ? <Empty description="Aucun chargement pour cette tournée" />
                : <Table<LoadSession>
                    columns={sessionColumns}
                    dataSource={sessions}
                    rowKey="sessionId"
                    size="middle"
                    pagination={{ showTotal: (t) => `${t} session(s)` }}
                    onRow={(s) => ({ onClick: () => { setDetailSession(s); setInlineLines([]); }, style: { cursor: 'pointer' } })}
                  />
              }
            </Spin>
          </>
        )}
      </Card>

      {/* ── Popup détail session ── */}
      <Modal
        title={
          <Space size={6}>
            <TruckOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontSize: 14 }}>Détail session</span>
            {detailSession && (
              detailSession.sessionStatus === 'LOADED'
                ? <Badge status="success" text="Chargé" />
                : <Badge status="warning" text="En attente" />
            )}
          </Space>
        }
        open={!!detailSession}
        onCancel={() => { setDetailSession(null); setInlineLines([]); }}
        footer={
          detailSession ? (
            <Space size={6}>
              {detailSession.sessionStatus !== 'LOADED' && (
                <>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => setInlineLines(prev => [...prev, newLine()])}>
                    Ajouter
                  </Button>
                  <Popconfirm title="Confirmer la session ?" onConfirm={() => handleConfirmSession(detailSession)} okText="Oui" cancelText="Non">
                    <Button size="small" type="primary" icon={<CheckOutlined />}>Confirmer</Button>
                  </Popconfirm>
                  <Popconfirm title="Supprimer la session ?" onConfirm={() => handleDeleteSession(detailSession)} okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Non">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </>
              )}
              <Button size="small" onClick={() => setDetailSession(null)}>Fermer</Button>
            </Space>
          ) : null
        }
        width={600}
        destroyOnHidden={false}
      >
        {detailSession && (
          <>
            {/* Entête compacte */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '6px 0 10px', borderBottom: '1px solid #f0f0f0', marginBottom: 10, fontSize: 12 }}>
              <span><Text type="secondary">Date : </Text><Text strong>{detailSession.loadDate ? dayjs(detailSession.loadDate).format('DD/MM/YYYY HH:mm') : '—'}</Text></span>
              <span><Text type="secondary">Dépôt : </Text>
                {getWarehouseName(detailSession.warehouseFromId)
                  ? <Tag icon={<InboxOutlined />} color="geekblue" style={{ fontSize: 11 }}>{getWarehouseName(detailSession.warehouseFromId)}</Tag>
                  : <Text type="secondary">—</Text>}
              </span>
              <span style={{ marginLeft: 'auto' }}>
                <Tag color="blue">{detailSession.items.length} article(s)</Tag>
                <Tag color="cyan">{detailSession.totalQty} unités</Tag>
              </span>
            </div>

            {/* Articles */}
            <Table<VehicleLoadItem>
              columns={itemColumns}
              dataSource={detailSession.items}
              rowKey="id"
              size="small"
              pagination={false}
              summary={(rows) => (
                <Table.Summary.Row style={{ background: '#fafafa' }}>
                  <Table.Summary.Cell index={0}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Tag color="blue" style={{ fontWeight: 700 }}>{rows.reduce((s, l) => s + (l.quantity || 0), 0)}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              )}
            />

            {/* Nouvelles lignes inline */}
            {inlineLines.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {inlineLines.map(line => (
                  <div key={line.key} style={{
                    display: 'grid', gridTemplateColumns: '1fr 90px 28px', gap: 6, alignItems: 'center',
                    background: '#f0f5ff', border: '1px dashed #adc6ff', borderRadius: 4, padding: '5px 8px',
                  }}>
                    <Select
                      showSearch size="small" placeholder="Article…"
                      optionFilterProp="label" options={productOptions}
                      suffixIcon={<SearchOutlined />} value={line.itemId}
                      onChange={v => setInlineLines(prev => prev.map(l => l.key === line.key ? { ...l, itemId: v } : l))}
                      style={{ width: '100%' }}
                    />
                    <InputNumber
                      min={1} size="small" placeholder="Qté" style={{ width: '100%' }} value={line.quantity}
                      onChange={v => setInlineLines(prev => prev.map(l => l.key === line.key ? { ...l, quantity: v ?? undefined } : l))}
                    />
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled={savingLines}
                      onClick={() => setInlineLines(prev => prev.filter(l => l.key !== line.key))} />
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <Button size="small" type="primary" icon={<CheckOutlined />} loading={savingLines} onClick={handleSaveAllInlineLines}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ── Modal création ── */}
      <Modal
        title={<Space><InboxOutlined />Nouveau chargement véhicule</Space>}
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText={`Créer ${lines.filter(l => l.itemId && l.quantity).length || ''} ligne(s)`}
        cancelText="Annuler"
        width={760}
        forceRender
      >
        {/* Entête */}
        <div style={{ background: '#f0f5ff', border: '1px solid #d6e4ff', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
          <Text strong style={{ fontSize: 12, color: '#1677ff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Entête</Text>
          <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="loadDate" label="Date / heure de chargement" style={{ marginBottom: 0 }}>
                  <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="warehouseFromId" label="Dépôt source" style={{ marginBottom: 0 }}>
                  <Select showSearch allowClear placeholder="Sélectionner un dépôt…"
                    optionFilterProp="label" options={warehouseOptions} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>

        <Divider style={{ margin: '0 0 16px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>LIGNES D'ARTICLES</Text>
        </Divider>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {lines.filter(l => l.itemId).length} article(s) — Total : <strong>{lines.reduce((s, l) => s + (l.quantity || 0), 0)}</strong> unité(s)
          </Text>
          <Button size="small" icon={<PlusOutlined />} onClick={() => setLines(prev => [...prev, newLine()])}>
            Ajouter une ligne
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 36px', gap: 8, marginBottom: 4, padding: '0 4px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Article <span style={{ color: '#ff4d4f' }}>*</span></Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Quantité <span style={{ color: '#ff4d4f' }}>*</span></Text>
          <span />
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={6}>
          {lines.map((line) => (
            <div key={line.key} style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 36px', gap: 8, alignItems: 'center',
              background: '#fff', border: '1px solid #e8eaed', borderRadius: 6, padding: '8px 10px',
            }}>
              <Select showSearch placeholder="Rechercher un article…" optionFilterProp="label"
                suffixIcon={<SearchOutlined />} options={productOptions} value={line.itemId}
                onChange={v => setLines(prev => prev.map(l => l.key === line.key ? { ...l, itemId: v } : l))}
                style={{ width: '100%' }} />
              <InputNumber min={1} placeholder="Qté" style={{ width: '100%' }} value={line.quantity}
                onChange={v => setLines(prev => prev.map(l => l.key === line.key ? { ...l, quantity: v ?? undefined } : l))} />
              <Button type="text" danger icon={<DeleteOutlined />}
                onClick={() => setLines(prev => prev.length > 1 ? prev.filter(l => l.key !== line.key) : prev)}
                disabled={lines.length === 1} />
            </div>
          ))}
        </Space>
      </Modal>

      {/* ── Modal édition ligne ── */}
      <Modal
        title={<Space><EditOutlined />Modifier la ligne</Space>}
        open={editModal}
        onCancel={() => { setEditModal(false); editForm.resetFields(); }}
        onOk={handleEdit}
        confirmLoading={editSubmitting}
        okText="Enregistrer" cancelText="Annuler"
        width={480} forceRender
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="itemId" label="Article" rules={[{ required: true, message: 'Article requis' }]}>
            <Select showSearch placeholder="Rechercher un article…" optionFilterProp="label"
              suffixIcon={<SearchOutlined />} options={productOptions} />
          </Form.Item>
          <Form.Item name="quantity" label="Quantité" rules={[{ required: true, message: 'Quantité requise' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
