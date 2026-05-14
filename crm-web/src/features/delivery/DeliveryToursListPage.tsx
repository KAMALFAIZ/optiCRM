import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Empty, Spin, Tag, Modal, Form, Input,
  Select, DatePicker, Popconfirm, Row, Col, Statistic, Tooltip, Typography,
  Drawer, Tabs, Descriptions, Badge, Divider, InputNumber, Radio,
  Progress, Alert,
} from 'antd';
import { useMessage } from '@/hooks/useMessage';
import {
  PlusOutlined, CloseCircleOutlined, CalendarOutlined, TruckOutlined,
  UserOutlined, EnvironmentOutlined, CheckCircleOutlined, EditOutlined,
  EyeOutlined, ShoppingOutlined, InboxOutlined, RollbackOutlined,
  DollarOutlined, CreditCardOutlined, ThunderboltOutlined, SearchOutlined,
  DeleteOutlined, SafetyCertificateOutlined, LockOutlined,
  StopOutlined, QuestionCircleOutlined, DownloadOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
  deliveryTourApi, deliveryLineApi, vehicleLoadApi, returnEntryApi,
  settlementApi, vehicleUnloadApi,
  DeliveryTour, DeliveryLine, VehicleLoad, ReturnEntry, SettlementReport, AvailableStock,
  VehicleUnload,
} from '@/api/delivery';
import { usersApi } from '@/api/users';
import { accountsApi } from '@/api/accounts';
import { productsApi } from '@/api/products';
import type { UserListItem } from '@/types/user';
import type { AccountListItem } from '@/types/account';
import type { ProductListItem } from '@/types/product';
import PrintReceiptModal, { type PrintDocType } from './PrintReceiptModal';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT:  { color: 'blue',    label: 'Brouillon' },
  VALIDE: { color: 'green',   label: 'Validée'   },
  CLOSED: { color: 'default', label: 'Clôturée'  },
};

// ─── Onglet Lignes ────────────────────────────────────────────────────────────
function LignesTab({ tour, products, accounts }: {
  tour: DeliveryTour;
  products: ProductListItem[];
  accounts: AccountListItem[];
}) {
  const { message } = useMessage();
  const [lines, setLines] = useState<DeliveryLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLine, setEditLine] = useState<DeliveryLine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stock, setStock] = useState<AvailableStock[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadLines = useCallback(async () => {
    if (!tour.id) return;
    setLoading(true);
    try { setLines(await deliveryLineApi.listByTour(tour.id)); }
    catch { message.error('Erreur chargement lignes'); }
    finally { setLoading(false); }
  }, [tour.id]);

  const loadStock = useCallback(async () => {
    if (!tour.id || tour.status === 'CLOSED') return;
    try { setStock(await deliveryLineApi.getAvailableStock(tour.id)); }
    catch { setStock([]); }
  }, [tour.id, tour.status]);

  useEffect(() => { loadLines(); }, [loadLines]);
  useEffect(() => { loadStock(); }, [loadStock]);

  const getAvail = (itemId?: string) => stock.find(s => s.itemId === itemId);

  const openCreate = () => {
    setEditLine(null);
    setSelectedItemId(null);
    form.resetFields();
    form.setFieldsValue({ paymentMode: 'CASH', paidAmount: 0, visitResult: 'DELIVERED' });
    loadStock();
    setModalOpen(true);
  };

  const openEdit = (line: DeliveryLine) => {
    setEditLine(line);
    setSelectedItemId(line.itemId || null);
    form.setFieldsValue({
      customerId: line.customerId, itemId: line.itemId,
      quantity: line.quantity, unitPrice: line.unitPrice,
      paymentMode: line.paymentMode || 'CASH', paidAmount: line.paidAmount || 0,
      visitResult: line.visitResult || 'DELIVERED',
      visitNotes: line.visitNotes || '',
    });
    loadStock();
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      const visitResult = v.visitResult || 'DELIVERED';
      const isDelivered = visitResult === 'DELIVERED' || visitResult === 'PARTIAL';
      const payload: DeliveryLine = {
        deliveryTourId: tour.id!,
        customerId: v.customerId, itemId: v.itemId,
        quantity: isDelivered ? Number(v.quantity) : 0,
        unitPrice: Number(v.unitPrice || 0),
        paymentMode: isDelivered ? (v.paymentMode || 'CASH') : 'CASH',
        paidAmount: isDelivered ? Number(v.paidAmount || 0) : 0,
        visitResult,
        visitNotes: v.visitNotes || undefined,
      };
      if (editLine?.id) { await deliveryLineApi.update(editLine.id, payload); message.success('Ligne mise à jour'); }
      else { await deliveryLineApi.create(payload); message.success('Ligne ajoutée'); }
      setModalOpen(false); loadLines(); loadStock();
    } catch (e: any) {
      if (e.errorFields) return;
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur';
      message.error(msg);
    }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deliveryLineApi.delete(id); message.success('Ligne supprimée'); loadLines(); loadStock(); }
    catch { message.error('Erreur'); }
  };

  const name = (arr: any[], id?: string, field = 'name') => {
    if (!id) return '—';
    return arr.find(x => x.id === id)?.[field] || id.substring(0, 8) + '…';
  };

  const total  = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const paid   = lines.reduce((s, l) => s + (l.paidAmount || 0), 0);
  const credit = total - paid;

  const avail = getAvail(selectedItemId || undefined);
  // qté déjà livrée dans les lignes existantes (hors ligne en cours d'édition)
  const alreadyDelivered = lines
    .filter(l => l.itemId === selectedItemId && (!editLine || l.id !== editLine.id))
    .reduce((s, l) => s + (l.quantity || 0), 0);
  const maxQty = avail ? avail.loaded - alreadyDelivered : undefined;

  const cols: TableColumnsType<DeliveryLine> = [
    { title: 'Client',  dataIndex: 'customerId', render: id => <Text strong>{name(accounts, id)}</Text> },
    { title: 'Article', dataIndex: 'itemId',     render: id => name(products, id) },
    {
      title: 'Visite', dataIndex: 'visitResult',
      render: (vr: string) => {
        const cfg: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
          DELIVERED: { color: 'green',   label: 'Livré',    icon: <CheckCircleOutlined /> },
          PARTIAL:   { color: 'cyan',    label: 'Partiel',  icon: <CheckCircleOutlined /> },
          ABSENT:    { color: 'orange',  label: 'Absent',   icon: <QuestionCircleOutlined /> },
          REFUSED:   { color: 'red',     label: 'Refus',    icon: <StopOutlined /> },
          CLOSED:    { color: 'default', label: 'Fermé',    icon: <LockOutlined /> },
        };
        const c = cfg[vr] || cfg.DELIVERED;
        return <Tag color={c.color} icon={c.icon}>{c.label}</Tag>;
      },
    },
    { title: 'Qté', dataIndex: 'quantity', align: 'center', render: v => <Tag>{v}</Tag> },
    { title: 'Montant', dataIndex: 'amount', align: 'right', render: v => <Text strong>{Number(v || 0).toFixed(2)} DH</Text> },
    { title: 'Payé', dataIndex: 'paidAmount', align: 'right', render: v => <Text style={{ color: '#52c41a' }}>{Number(v || 0).toFixed(2)} DH</Text> },
    {
      title: 'Mode', dataIndex: 'paymentMode',
      render: m => m === 'CASH'
        ? <Tag icon={<DollarOutlined />} color="green">Espèces</Tag>
        : <Tag icon={<CreditCardOutlined />} color="orange">Crédit</Tag>,
    },
    {
      title: 'Statut',
      render: (_, r) => {
        if (r.visitResult && r.visitResult !== 'DELIVERED' && r.visitResult !== 'PARTIAL')
          return <Tag color="default">—</Tag>;
        const a = r.amount || 0, p = r.paidAmount || 0;
        if (p >= a && a > 0) return <Tag color="green" icon={<CheckCircleOutlined />}>Payé</Tag>;
        if (p > 0) return <Tag color="orange">Partiel</Tag>;
        return <Tag color="red">Impayé</Tag>;
      },
    },
    {
      title: '', align: 'right',
      render: (_, r) => tour.status === 'CLOSED' ? (
        <Tag color="default" style={{ fontSize: 11 }}>Verrouillé</Tag>
      ) : (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Popconfirm title="Supprimer ?" onConfirm={() => handleDelete(r.id!)} okText="Oui" cancelText="Non">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Articles disponibles = seulement ceux qui ont du stock chargé
  const availableProducts = products.filter(p => {
    if (!p.id) return false;
    const s = getAvail(p.id);
    // En mode édition, inclure l'article déjà sur la ligne
    if (editLine?.itemId === p.id) return true;
    return s && s.available > 0;
  });

  return (
    <>
      <Row gutter={12} className="mb-3">
        <Col span={6}><Card size="small"><Statistic title="Lignes" value={lines.length} prefix={<ShoppingOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Total facturé" value={total.toFixed(2)} suffix="DH" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Encaissé" value={paid.toFixed(2)} suffix="DH" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Crédit" value={credit.toFixed(2)} suffix="DH" valueStyle={{ color: credit > 0 ? '#ff4d4f' : undefined }} /></Card></Col>
      </Row>

      {tour.status !== 'CLOSED' && stock.length === 0 && (
        <Alert className="mb-2" type="warning" showIcon
          message="Aucun article chargé sur ce véhicule. Chargez des articles avant d'ajouter des lignes de livraison." />
      )}

      <div className="mb-2 flex justify-end">
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}
          disabled={tour.status === 'CLOSED' || stock.length === 0}>
          Ajouter une ligne
        </Button>
      </div>

      <Spin spinning={loading}>
        {lines.length === 0
          ? <Empty description="Aucune ligne de livraison" />
          : <Table columns={cols} dataSource={lines} rowKey="id" size="small" pagination={{ pageSize: 8, showTotal: t => `${t} ligne(s)` }} />
        }
      </Spin>

      <Modal
        title={editLine ? 'Modifier la ligne' : 'Nouvelle ligne de livraison'}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); setEditLine(null); setSelectedItemId(null); form.resetFields(); }}
        onOk={handleSave}
        confirmLoading={submitting}
        okText={editLine ? 'Mettre à jour' : 'Ajouter'}
        cancelText="Annuler"
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item name="customerId" label="Client" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" suffixIcon={<SearchOutlined />}
              placeholder="Rechercher un client…"
              options={accounts.map(a => ({ value: a.id, label: a.name }))} />
          </Form.Item>
          <Form.Item name="itemId" label="Article (chargés sur ce véhicule)" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" suffixIcon={<SearchOutlined />}
              placeholder="Sélectionner un article chargé…"
              onChange={(id: string) => {
                setSelectedItemId(id);
                const p = products.find(p => p.id === id);
                if (p) form.setFieldsValue({ unitPrice: p.unitPrice });
              }}
              options={availableProducts.map(p => {
                const s = getAvail(p.id);
                const dispo = s ? (editLine?.itemId === p.id ? s.loaded - alreadyDelivered : s.available) : 0;
                return {
                  value: p.id,
                  label: `${p.name}${p.code ? ` — ${p.code}` : ''} · dispo: ${dispo}`,
                };
              })}
            />
          </Form.Item>
          {selectedItemId && avail && (
            <Alert
              className="mb-3"
              type={maxQty! > 0 ? 'info' : 'error'}
              showIcon
              message={
                maxQty! > 0
                  ? `Stock disponible : ${maxQty} unité(s) (chargé: ${avail.loaded}, déjà livré: ${alreadyDelivered})`
                  : `Stock épuisé pour cet article (chargé: ${avail.loaded}, livré: ${alreadyDelivered})`
              }
            />
          )}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantité" rules={[
                { required: true },
                {
                  validator: (_, val) => {
                    if (!val || !maxQty) return Promise.resolve();
                    if (Number(val) > maxQty) return Promise.reject(`Max disponible : ${maxQty}`);
                    return Promise.resolve();
                  }
                }
              ]}>
                <InputNumber min={1} max={maxQty || undefined} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitPrice" label="Prix unitaire (DH)" rules={[{ required: true }]}>
                <Space.Compact style={{ width: '100%' }}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /><span className="ant-input-group-addon" style={{ display:'flex',alignItems:'center',padding:'0 11px',background:'#fafafa',border:'1px solid #d9d9d9',borderLeft:'none',borderRadius:'0 6px 6px 0',fontSize:14 }}>DH</span></Space.Compact>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="visitResult" label="Résultat de la visite" rules={[{ required: true }]}>
            <Select options={[
              { value: 'DELIVERED', label: '✅ Livraison effectuée' },
              { value: 'PARTIAL',   label: '🔵 Livraison partielle' },
              { value: 'ABSENT',    label: '⚠️ Client absent' },
              { value: 'REFUSED',   label: '🚫 Client a refusé' },
              { value: 'CLOSED',    label: '🔒 Commerce fermé' },
            ]} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.visitResult !== cur.visitResult}>
            {({ getFieldValue }) => {
              const vr = getFieldValue('visitResult') || 'DELIVERED';
              const isDelivered = vr === 'DELIVERED' || vr === 'PARTIAL';
              return isDelivered ? (
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="paymentMode" label="Mode paiement">
                      <Radio.Group>
                        <Radio.Button value="CASH"><DollarOutlined /> Espèces</Radio.Button>
                        <Radio.Button value="CREDIT"><CreditCardOutlined /> Crédit</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="paidAmount" label="Montant payé (DH)">
                      <Space.Compact style={{ width: '100%' }}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /><span className="ant-input-group-addon" style={{ display:'flex',alignItems:'center',padding:'0 11px',background:'#fafafa',border:'1px solid #d9d9d9',borderLeft:'none',borderRadius:'0 6px 6px 0',fontSize:14 }}>DH</span></Space.Compact>
                    </Form.Item>
                  </Col>
                </Row>
              ) : null;
            }}
          </Form.Item>
          <Form.Item name="visitNotes" label="Notes (optionnel)">
            <Input.TextArea rows={2} placeholder="Motif refus, infos client…" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Onglet Chargements ───────────────────────────────────────────────────────
function ChargementsTab({ tour, products }: { tour: DeliveryTour; products: ProductListItem[] }) {
  const { message } = useMessage();
  const [loads, setLoads] = useState<VehicleLoad[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    if (!tour.id) return;
    setLoading(true);
    try { setLoads(await vehicleLoadApi.listByTour(tour.id)); }
    catch { message.error('Erreur'); }
    finally { setLoading(false); }
  }, [tour.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      await vehicleLoadApi.create({
        deliveryTourId: tour.id!,
        warehouseFromId: v.warehouseFromId?.[0],
        loadDate: v.loadDate ? (v.loadDate as Dayjs).toISOString() : undefined,
        items: [{ itemId: v.itemId, quantity: Number(v.quantity) }],
      });
      message.success('Chargement ajouté'); setModalOpen(false); form.resetFields(); load();
    } catch (e: any) { if (!e.errorFields) message.error('Erreur'); }
    finally { setSubmitting(false); }
  };

  const handleMarkLoaded = async (id: string) => {
    try { await vehicleLoadApi.markLoaded(id); message.success('Marqué chargé'); load(); }
    catch { message.error('Erreur'); }
  };

  const pName = (id?: string) => products.find(p => p.id === id)?.name || (id ? id.substring(0, 8) + '…' : '—');

  const cols: TableColumnsType<VehicleLoad> = [
    { title: 'Article', dataIndex: 'itemId', render: id => <Text strong>{pName(id)}</Text> },
    { title: 'Qté', dataIndex: 'quantity', align: 'center', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Dépôt', dataIndex: 'warehouseFromId', render: v => v ? <Text code style={{ fontSize: 11 }}>{v.substring(0, 8)}…</Text> : '—' },
    { title: 'Date', dataIndex: 'loadDate', render: d => d ? dayjs(d).format('DD/MM HH:mm') : '—' },
    { title: 'Statut', dataIndex: 'status', render: s => s === 'LOADED' ? <Tag color="green" icon={<CheckCircleOutlined />}>Chargé</Tag> : <Tag color="blue">En attente</Tag> },
    {
      title: '', align: 'right',
      render: (_, r) => {
        if (tour.status === 'CLOSED') return <Tag color="default" style={{ fontSize: 11 }}>Verrouillé</Tag>;
        if (r.status !== 'LOADED' && r.id) return (
          <Popconfirm title="Confirmer le chargement ?" onConfirm={() => handleMarkLoaded(r.id!)} okText="Oui" cancelText="Non">
            <Button type="primary" ghost size="small" icon={<CheckCircleOutlined />}>Confirmer</Button>
          </Popconfirm>
        );
        return null;
      },
    },
  ];

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} disabled={tour.status === 'CLOSED'}>
          Nouveau chargement
        </Button>
      </div>
      <Spin spinning={loading}>
        {loads.length === 0
          ? <Empty description="Aucun chargement" />
          : <Table columns={cols} dataSource={loads} rowKey="id" size="small" pagination={{ pageSize: 8 }} />
        }
      </Spin>
      <Modal title="Nouveau chargement" open={modalOpen} forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleCreate} confirmLoading={submitting} okText="Ajouter" cancelText="Annuler" width={460}>
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item name="itemId" label="Article" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="Rechercher…"
              options={products.map(p => ({ value: p.id, label: `${p.name}${p.code ? ` — ${p.code}` : ''}` }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantité" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="loadDate" label="Date/heure">
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="warehouseFromId" label="Dépôt source (UUID)">
            <Select mode="tags" maxTagCount={1} placeholder="UUID du dépôt" options={[]} notFoundContent="Saisir UUID" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Onglet Retours ────────────────────────────────────────────────────────────
function RetoursTab({ tour, products }: { tour: DeliveryTour; products: ProductListItem[] }) {
  const { message } = useMessage();
  const [returns, setReturns] = useState<ReturnEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const REASONS = ['Non vendu', 'Défaut qualité', 'Produit endommagé', 'Mauvaise référence', 'Client absent', 'Refus client', 'Surplus de stock', 'Autre'];

  const load = useCallback(async () => {
    if (!tour.id) return;
    setLoading(true);
    try { setReturns(await returnEntryApi.listByTour(tour.id)); }
    catch { message.error('Erreur'); }
    finally { setLoading(false); }
  }, [tour.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      await returnEntryApi.create({
        deliveryTourId: tour.id!, itemId: v.itemId,
        quantity: Number(v.quantity), reason: v.reason,
        warehouseToId: v.warehouseToId?.[0],
        receivedDate: v.receivedDate ? (v.receivedDate as Dayjs).toISOString() : undefined,
      });
      message.success('Retour créé'); setModalOpen(false); form.resetFields(); load();
    } catch (e: any) { if (!e.errorFields) message.error('Erreur'); }
    finally { setSubmitting(false); }
  };

  const statusCfg: Record<string, { color: string; label: string }> = {
    DRAFT: { color: 'blue', label: 'En attente' },
    RECEIVED: { color: 'orange', label: 'Reçu' },
    VALIDATED: { color: 'green', label: 'Validé' },
  };

  const pName = (id?: string) => products.find(p => p.id === id)?.name || (id ? id.substring(0, 8) + '…' : '—');

  const cols: TableColumnsType<ReturnEntry> = [
    { title: 'Article', dataIndex: 'itemId', render: id => <Text strong>{pName(id)}</Text> },
    { title: 'Qté', dataIndex: 'quantity', align: 'center', render: v => <Tag color="red">{v}</Tag> },
    { title: 'Motif', dataIndex: 'reason', render: r => r ? <Tag>{r}</Tag> : '—' },
    { title: 'Date réception', dataIndex: 'receivedDate', render: d => d ? dayjs(d).format('DD/MM HH:mm') : '—' },
    { title: 'Statut', dataIndex: 'status', render: s => { const c = statusCfg[s] || statusCfg.DRAFT; return <Tag color={c.color}>{c.label}</Tag>; } },
    {
      title: '', align: 'right',
      render: (_, r) => {
        if (tour.status === 'CLOSED') return <Tag color="default" style={{ fontSize: 11 }}>Verrouillé</Tag>;
        return (
          <Space>
            {r.status === 'DRAFT' && r.id && (
              <Popconfirm title="Marquer reçu ?" onConfirm={async () => { await returnEntryApi.receive(r.id!); load(); }} okText="Oui" cancelText="Non">
                <Button size="small" ghost type="primary" icon={<CheckCircleOutlined />}>Reçu</Button>
              </Popconfirm>
            )}
            {r.status === 'RECEIVED' && r.id && (
              <Popconfirm title="Valider ?" onConfirm={async () => { await returnEntryApi.validate(r.id!); load(); }} okText="Oui" cancelText="Non">
                <Button size="small" type="primary" icon={<SafetyCertificateOutlined />}>Valider</Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} disabled={tour.status === 'CLOSED'}>
          Nouveau retour
        </Button>
      </div>
      <Spin spinning={loading}>
        {returns.length === 0
          ? <Empty description="Aucun retour" />
          : <Table columns={cols} dataSource={returns} rowKey="id" size="small" pagination={{ pageSize: 8 }} />
        }
      </Spin>
      <Modal title="Nouveau retour" open={modalOpen} forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleCreate} confirmLoading={submitting} okText="Créer" cancelText="Annuler" width={480}>
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item name="itemId" label="Article" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="Rechercher…"
              options={products.map(p => ({ value: p.id, label: `${p.name}${p.code ? ` — ${p.code}` : ''}` }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantité" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="receivedDate" label="Date réception">
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="Motif">
            <Select placeholder="Choisir un motif" allowClear options={REASONS.map(r => ({ value: r, label: r }))} />
          </Form.Item>
          <Form.Item name="warehouseToId" label="Dépôt destination (UUID)">
            <Select mode="tags" maxTagCount={1} placeholder="UUID du dépôt" options={[]} notFoundContent="Saisir UUID" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Onglet Déchargement ──────────────────────────────────────────────────────
function DechargementTab({ tour, products }: { tour: DeliveryTour; products: ProductListItem[] }) {
  const { message } = useMessage();
  const [unload, setUnload] = useState<VehicleUnload | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const load = useCallback(async () => {
    if (!tour.id) return;
    setLoading(true);
    try {
      const data = await vehicleUnloadApi.getByTour(tour.id);
      setUnload(data);
    } catch { setUnload(null); }
    finally { setLoading(false); }
  }, [tour.id]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await vehicleUnloadApi.generate(tour.id!);
      setUnload(data);
      message.success('Déchargement généré');
    } catch { message.error('Erreur lors de la génération'); }
    finally { setGenerating(false); }
  };

  const handleConfirm = async () => {
    if (!unload?.id) return;
    setConfirming(true);
    try {
      const data = await vehicleUnloadApi.confirm(unload.id);
      setUnload(data);
      message.success('Déchargement confirmé');
    } catch { message.error('Erreur lors de la confirmation'); }
    finally { setConfirming(false); }
  };

  const pName = (id?: string) => products.find(p => p.id === id)?.name || (id ? id.substring(0, 8) + '…' : '—');

  const cols = [
    { title: 'Article', dataIndex: 'itemId', render: (id: string) => <Text strong>{pName(id)}</Text> },
    { title: 'Chargé', dataIndex: 'quantityLoaded', align: 'center' as const, render: (v: number) => <Tag color="blue">{v}</Tag> },
    { title: 'Vendu', dataIndex: 'quantitySold', align: 'center' as const, render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: 'Retourné', dataIndex: 'quantityReturned', align: 'center' as const, render: (v: number) => <Tag color="orange">{v}</Tag> },
    { title: 'Déchargé', dataIndex: 'quantityUnloaded', align: 'center' as const, render: (v: number) => <Tag color="purple">{v}</Tag> },
    {
      title: 'Écart',
      render: (_: any, r: any) => {
        const ecart = r.quantityLoaded - r.quantitySold - r.quantityReturned - r.quantityUnloaded;
        return ecart !== 0
          ? <Tag color="red">{ecart > 0 ? `+${ecart}` : ecart}</Tag>
          : <Tag color="green">OK</Tag>;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="mb-3 flex gap-2 justify-end">
        {unload && (
          <Button icon={<DownloadOutlined />} onClick={() => setPrintOpen(true)}>
            Imprimer
          </Button>
        )}
        <Button onClick={handleGenerate} loading={generating} disabled={tour.status === 'CLOSED' && !!unload?.id}>
          {unload ? 'Regénérer' : 'Générer le déchargement'}
        </Button>
        {unload && unload.status === 'DRAFT' && (
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleConfirm} loading={confirming}>
            Confirmer le déchargement
          </Button>
        )}
      </div>

      {unload ? (
        <>
          <div className="mb-3 flex gap-3 items-center">
            <Tag color={unload.status === 'CONFIRMED' ? 'green' : 'blue'} icon={unload.status === 'CONFIRMED' ? <CheckCircleOutlined /> : undefined}>
              {unload.status === 'CONFIRMED' ? 'Confirmé' : 'Brouillon'}
            </Tag>
            {unload.unloadDate && <Text type="secondary">Généré le {dayjs(unload.unloadDate).format('DD/MM/YYYY HH:mm')}</Text>}
          </div>
          <Table
            columns={cols}
            dataSource={unload.items || []}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </>
      ) : (
        <Empty description="Aucun déchargement — cliquez sur Générer pour calculer le bilan" />
      )}
      {unload && (
        <PrintReceiptModal
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          docType={'UNLOAD' as PrintDocType}
          title="Bon de Déchargement"
          tourDate={tour.tourDate}
          unloadItems={(unload.items ?? []).map(item => ({
            itemName: pName(item.itemId),
            loadedQty: item.quantityLoaded ?? 0,
            soldQty: item.quantitySold ?? 0,
            returnedQty: item.quantityReturned ?? 0,
            confirmedQty: item.quantityUnloaded,
          }))}
        />
      )}
    </Spin>
  );
}

// ─── Onglet Règlement ──────────────────────────────────────────────────────────
function ReglementTab({ tour }: { tour: DeliveryTour }) {
  const { message } = useMessage();
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (!tour.id) return;
    setLoading(true);
    settlementApi.getByTour(tour.id).then(setReport).catch(() => setReport(null)).finally(() => setLoading(false));
  }, [tour.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await settlementApi.generate(tour.id!);
      setReport(data);
      message.success('Rapport généré');
    } catch { message.error('Erreur'); }
    finally { setGenerating(false); }
  };

  const rate = report?.totalAmount && report.totalAmount > 0
    ? Math.min(100, Math.round(((report.collectedAmount || 0) / report.totalAmount) * 100))
    : 0;

  return (
    <Spin spinning={loading}>
      <div className="mb-3 flex justify-end gap-2">
        <Space>
          {report && (
            <Button icon={<DownloadOutlined />} onClick={() => setPrintOpen(true)}>
              Imprimer
            </Button>
          )}
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate} loading={generating} disabled={tour.status !== 'CLOSED'}>
            {report ? 'Régénérer' : 'Générer le rapport'}
          </Button>
        </Space>
      </div>
      {tour.status !== 'CLOSED' && (
        <div style={{ color: '#faad14', marginBottom: 12 }}>
          ⚠️ Le règlement est disponible après clôture de la tournée.
        </div>
      )}
      {report ? (
        <>
          <Row gutter={12} className="mb-3">
            <Col span={6}><Card size="small"><Statistic title="Total facturé" value={report.totalAmount?.toFixed(2) || '0.00'} suffix="DH" prefix={<DollarOutlined />} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Espèces" value={report.cashAmount?.toFixed(2) || '0.00'} suffix="DH" valueStyle={{ color: '#52c41a' }} prefix={<DollarOutlined />} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Crédit vendu" value={report.creditAmount?.toFixed(2) || '0.00'} suffix="DH" valueStyle={{ color: '#fa8c16' }} prefix={<CreditCardOutlined />} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Solde crédit" value={report.creditBalance?.toFixed(2) || '0.00'} suffix="DH" valueStyle={{ color: (report.creditBalance || 0) > 0 ? '#ff4d4f' : '#52c41a' }} /></Card></Col>
          </Row>
          <Card size="small">
            <div className="mb-2"><Text type="secondary">Taux d'encaissement</Text></div>
            <Progress percent={rate} strokeColor={rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'} />
            <Divider />
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Total encaissé">{report.collectedAmount?.toFixed(2) || '0.00'} DH</Descriptions.Item>
              <Descriptions.Item label="Écart caisse">{report.discrepancy?.toFixed(2) || '0.00'} DH</Descriptions.Item>
              <Descriptions.Item label="Statut rapport">
                <Tag color={report.status === 'FINALIZED' ? 'green' : 'blue'}>
                  {report.status === 'FINALIZED' ? 'Finalisé' : 'Brouillon'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Généré le">
                {report.generatedAt ? dayjs(report.generatedAt).format('DD/MM/YYYY HH:mm') : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      ) : (
        <Empty description="Aucun rapport — cliquez sur Générer" />
      )}
      {report && (
        <PrintReceiptModal
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          docType={'SETTLEMENT' as PrintDocType}
          title="Rapport de Règlement"
          tourDate={tour.tourDate}
          zone={tour.region}
          settlement={{
            tourDate: tour.tourDate,
            zone: tour.region,
            totalAmount: report.totalAmount ?? 0,
            cashAmount: report.cashAmount ?? 0,
            chequeAmount: report.chequeAmount ?? 0,
            creditAmount: report.creditAmount ?? 0,
            unloadedValue: report.unloadedValue,
            discrepancy: report.discrepancy,
          }}
        />
      )}
    </Spin>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function DeliveryToursListPage() {
  const { message } = useMessage();
  const [tours, setTours] = useState<DeliveryTour[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [drawerTour, setDrawerTour] = useState<DeliveryTour | null>(null);
  const [form] = Form.useForm();

  const loadTours = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter.format('YYYY-MM-DD');
      setTours(await deliveryTourApi.list(params));
    } catch { message.error('Erreur chargement des tournées'); }
    finally { setLoading(false); }
  }, [statusFilter, dateFilter]);

  useEffect(() => { loadTours(); }, [loadTours]);

  useEffect(() => {
    usersApi.getAll({ size: 200, isActive: true }).then(r => setUsers(r.content)).catch(() => {});
    accountsApi.getAll({ size: 200 }).then(r => setAccounts(r.content)).catch(() => {});
    productsApi.getAll({ size: 200, isActive: true }).then(r => setProducts(r.content)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await deliveryTourApi.create({
        name: values.name,
        tourDate: (values.tourDate as Dayjs).format('YYYY-MM-DD'),
        assignedToId: values.assignedToId,
        region: values.region,
        vehicleType: values.vehicleType,
      });
      message.success('Tournée créée avec succès');
      setModalOpen(false); form.resetFields(); loadTours();
    } catch (err: any) {
      if (err.errorFields) return;
      const msg = err?.response?.data?.error?.message
                || err?.response?.data?.message
                || 'Erreur lors de la création';
      message.error(msg, 5);
    } finally { setSubmitting(false); }
  };

  const handleValidate = async (id: string) => {
    try {
      const updated = await deliveryTourApi.validate(id);
      message.success('Tournée validée');
      loadTours();
      if (drawerTour?.id === id) setDrawerTour(prev => prev ? { ...prev, status: updated.status } : null);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Erreur lors de la validation';
      message.error(msg, 5);
    }
  };

  const handleClose = async (id: string) => {
    try {
      const updated = await deliveryTourApi.close(id);
      message.success('Tournée clôturée');
      loadTours();
      if (drawerTour?.id === id) setDrawerTour(prev => prev ? { ...prev, status: updated.status } : null);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Erreur lors de la clôture';
      message.error(msg, 5);
    }
  };

  const getUserName = (id?: string) => {
    if (!id) return <Text type="secondary">—</Text>;
    const u = users.find(u => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : <Text code>{id.substring(0, 8)}…</Text>;
  };

  const stats = {
    total:  tours.length,
    draft:  tours.filter(t => t.status === 'DRAFT').length,
    valide: tours.filter(t => t.status === 'VALIDE').length,
    closed: tours.filter(t => t.status === 'CLOSED').length,
  };

  const columns: TableColumnsType<DeliveryTour> = [
    {
      title: 'Date tournée', dataIndex: 'tourDate',
      sorter: (a, b) => (a.tourDate || '').localeCompare(b.tourDate || ''),
      render: (d) => (
        <Space><CalendarOutlined style={{ color: '#1677ff' }} />
          <Text strong>{d ? dayjs(d).format('DD/MM/YYYY') : '—'}</Text>
        </Space>
      ),
    },
    {
      title: 'Zone', dataIndex: 'zone',
      render: (z) => z ? <Space><EnvironmentOutlined style={{ color: '#52c41a' }} />{z}</Space> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Représentant', dataIndex: 'representativeId',
      render: (id) => <Space><UserOutlined />{getUserName(id)}</Space>,
    },
    {
      title: 'Statut', dataIndex: 'status',
      filters: Object.entries(STATUS_CONFIG).map(([v, c]) => ({ text: c.label, value: v })),
      onFilter: (v, r) => r.status === v,
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
        return <Badge status={status === 'VALIDE' ? 'processing' : 'default'}><Tag color={cfg.color}>{cfg.label}</Tag></Badge>;
      },
    },
    {
      title: 'Créée le', dataIndex: 'createdAt',
      render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Actions', align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary" ghost size="small" icon={<EyeOutlined />}
            onClick={() => setDrawerTour(record)}
          >
            Détails
          </Button>
          {record.status === 'DRAFT' && record.id && (
            <Tooltip title="Valider la tournée">
              <Popconfirm
                title="Valider cette tournée ?"
                description="La tournée passera en statut Validée."
                onConfirm={() => handleValidate(record.id!)}
                okText="Valider" cancelText="Annuler"
              >
                <Button type="text" icon={<CheckCircleOutlined />} size="small" style={{ color: '#52c41a' }} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'VALIDE' && record.id && (
            <Tooltip title="Clôturer">
              <Popconfirm
                title="Clôturer cette tournée ?"
                description="Cette action est irréversible."
                onConfirm={() => handleClose(record.id!)}
                okText="Clôturer" okButtonProps={{ danger: true }} cancelText="Annuler"
              >
                <Button type="text" danger icon={<CloseCircleOutlined />} size="small" />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Stats */}
      <Row gutter={16} className="mb-4">
        {[
          { title: 'Total tournées', value: stats.total,  color: undefined,  prefix: <TruckOutlined /> },
          { title: 'Brouillons',     value: stats.draft,  color: '#1677ff',  prefix: <EditOutlined /> },
          { title: 'Validées',       value: stats.valide, color: '#52c41a',  prefix: <CheckCircleOutlined /> },
          { title: 'Clôturées',      value: stats.closed, color: '#8c8c8c',  prefix: <CloseCircleOutlined /> },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card size="small" variant="outlined">
              <Statistic title={s.title} value={s.value} valueStyle={s.color ? { color: s.color } : undefined} prefix={s.prefix} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={<Space><TruckOutlined />Tournées de livraison</Space>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Nouvelle tournée
          </Button>
        }
      >
        <Row gutter={12} className="mb-4">
          <Col>
            <DatePicker placeholder="Filtrer par date" format="DD/MM/YYYY"
              value={dateFilter} onChange={setDateFilter} allowClear />
          </Col>
          <Col>
            <Select placeholder="Filtrer par statut" style={{ width: 180 }} allowClear
              value={statusFilter} onChange={setStatusFilter}
              options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
          </Col>
        </Row>
        <Spin spinning={loading}>
          {tours.length === 0 ? (
            <Empty description="Aucune tournée trouvée">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                Créer la première tournée
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={tours}
              rowKey="id"
              onRow={(record) => ({ onDoubleClick: () => setDrawerTour(record), style: { cursor: 'pointer' } })}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `${t} tournée(s)` }}
            />
          )}
        </Spin>
      </Card>

      {/* ── Drawer détail tournée ── */}
      <Drawer
        title={
          drawerTour && (
            <Space>
              <TruckOutlined />
              <span>Tournée du {drawerTour.tourDate ? dayjs(drawerTour.tourDate).format('DD/MM/YYYY') : '—'}</span>
              {drawerTour.zone && <Tag color="green"><EnvironmentOutlined /> {drawerTour.zone}</Tag>}
              <Tag color={STATUS_CONFIG[drawerTour.status || 'DRAFT']?.color}>
                {STATUS_CONFIG[drawerTour.status || 'DRAFT']?.label}
              </Tag>
            </Space>
          )
        }
        open={!!drawerTour}
        onClose={() => setDrawerTour(null)}
        width={900}
        extra={
          <Space>
            {drawerTour?.status === 'DRAFT' && drawerTour?.id && (
              <Popconfirm
                title="Valider cette tournée ?"
                description="La tournée passera en statut Validée."
                onConfirm={() => handleValidate(drawerTour.id!)}
                okText="Valider" cancelText="Annuler"
              >
                <Button icon={<CheckCircleOutlined />} style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                  Valider la tournée
                </Button>
              </Popconfirm>
            )}
            {drawerTour?.status === 'VALIDE' && drawerTour?.id && (
              <Popconfirm
                title="Clôturer cette tournée ?"
                description="Cette action est irréversible."
                onConfirm={() => handleClose(drawerTour.id!)}
                okText="Clôturer" okButtonProps={{ danger: true }} cancelText="Annuler"
              >
                <Button danger icon={<CloseCircleOutlined />}>Clôturer la tournée</Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        {drawerTour && (
          <>
            {/* Bandeau verrouillage */}
            {drawerTour.status === 'CLOSED' && (
              <Alert
                className="mb-3"
                type="warning"
                showIcon
                icon={<LockOutlined />}
                message="Tournée clôturée — lecture seule"
                description="Cette tournée est clôturée. Aucune modification, ajout ou suppression n'est possible sur les lignes, chargements et retours associés."
                banner
              />
            )}
            {/* Infos résumé */}
            <Descriptions size="small" column={3} className="mb-4" style={{ background: '#fafafa', padding: '12px 16px', borderRadius: 8 }}>
              <Descriptions.Item label="Date">{dayjs(drawerTour.tourDate).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Zone">{drawerTour.region || '—'}</Descriptions.Item>
              <Descriptions.Item label="Représentant">{drawerTour.assignedTo?.fullName || '—'}</Descriptions.Item>
            </Descriptions>

            <Tabs
              defaultActiveKey="lignes"
              items={[
                {
                  key: 'lignes',
                  label: <Space><ShoppingOutlined />Lignes de livraison</Space>,
                  children: <LignesTab tour={drawerTour} products={products} accounts={accounts} />,
                },
                {
                  key: 'chargements',
                  label: <Space><InboxOutlined />Chargements</Space>,
                  children: <ChargementsTab tour={drawerTour} products={products} />,
                },
                {
                  key: 'retours',
                  label: <Space><RollbackOutlined />Retours</Space>,
                  children: <RetoursTab tour={drawerTour} products={products} />,
                },
                {
                  key: 'dechargement',
                  label: <Space><InboxOutlined />Déchargement</Space>,
                  children: <DechargementTab tour={drawerTour} products={products} />,
                },
                {
                  key: 'reglement',
                  label: <Space><DollarOutlined />Règlement</Space>,
                  children: <ReglementTab tour={drawerTour} />,
                },
              ]}
            />
          </>
        )}
      </Drawer>

      {/* Modal création tournée */}
      <Modal
        title={<Space><TruckOutlined />Nouvelle tournée de livraison</Space>}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText="Créer la tournée"
        cancelText="Annuler"
        width={540}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Nom de la tournée" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input prefix={<TruckOutlined />} placeholder="Ex: Tournée Casablanca Nord — 05/05" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tourDate" label="Date de la tournée" rules={[{ required: true, message: 'Date requise' }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="region" label="Zone géographique">
                <Input prefix={<EnvironmentOutlined />} placeholder="Ex: Casablanca Nord" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="assignedToId" label="Représentant commercial">
            <Select showSearch placeholder="Sélectionner un représentant"
              optionFilterProp="label" allowClear
              options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))} />
          </Form.Item>
          <Form.Item name="vehicleType" label="Type de véhicule">
            <Input prefix={<TruckOutlined />} placeholder="Ex: Camion, Fourgon…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
