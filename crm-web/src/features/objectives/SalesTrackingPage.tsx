import { useEffect, useState, useMemo } from 'react';
import {
  Card, Table, Button, Modal, Form, Select, InputNumber,
  Space, Popconfirm, Typography, Row, Col, Tag, Input,
  message, Tooltip, Progress, Statistic, DatePicker,
  Tabs, Badge, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, RiseOutlined,
  ReloadOutlined, TrophyOutlined, WarningOutlined,
  LineChartOutlined, TableOutlined, RobotOutlined,
} from '@ant-design/icons';
import { generateSalesInsights } from '@/api/ai';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import objectivesApi, {
  ObjectiveTrackingDto, SaleEntryDto, CreateSaleEntryRequest,
} from '@/api/objectives';
import apiClient from '@/api/client';

const { Title, Text } = Typography;
const { Option } = Select;

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const formatMAD = (v: number) =>
  v.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS_CONFIG = {
  EXCEEDED:    { color: '#52c41a', label: 'Dépassé',    icon: <TrophyOutlined /> },
  ON_TRACK:    { color: '#1677ff', label: 'En cours',   icon: <RiseOutlined /> },
  AT_RISK:     { color: '#faad14', label: 'À risque',   icon: <WarningOutlined /> },
  CRITICAL:    { color: '#ff4d4f', label: 'Critique',   icon: <WarningOutlined /> },
  NO_OBJECTIVE:{ color: '#8c8c8c', label: 'Sans obj.',  icon: null },
};

interface UserOption { id: string; label: string; }
interface ProductOption { id: string; code: string; name: string; }

function pctColor(pct: number) {
  if (pct >= 100) return '#52c41a';
  if (pct >= 75)  return '#1677ff';
  if (pct >= 50)  return '#faad14';
  return '#ff4d4f';
}

export default function SalesTrackingPage() {
  const [tracking, setTracking] = useState<ObjectiveTrackingDto[]>([]);
  const [sales, setSales] = useState<SaleEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [accounts, setAccounts] = useState<{id: string; name: string}[]>([]);

  // Filtres
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [filterUser, setFilterUser] = useState<string | undefined>();

  // Modal vente
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleEntryDto | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('tracking');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => {
    loadData();
    setAiInsights(null);
  }, [filterYear, filterMonth, filterUser]);

  async function loadRefs() {
    try {
      const [userRes, prodRes, accRes] = await Promise.all([
        apiClient.get<any>('/users?size=200'),
        apiClient.get<any>('/products?size=500&isActive=true&isSellable=true'),
        apiClient.get<any>('/accounts?size=500'),
      ]);
      setUsers((userRes.data?.data?.content ?? userRes.data?.data ?? [])
        .map((u: any) => ({ id: u.id, label: `${u.firstName} ${u.lastName}` })));
      setProducts((prodRes.data?.data?.content ?? prodRes.data?.data ?? [])
        .map((p: any) => ({ id: p.id, code: p.code, name: p.name })));
      setAccounts((accRes.data?.data?.content ?? accRes.data?.data ?? [])
        .map((a: any) => ({ id: a.id, name: a.name })));
    } catch { /* ignore */ }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        objectivesApi.getTracking(filterYear, filterMonth, filterUser),
        objectivesApi.listSales(filterYear, filterMonth, filterUser),
      ]);
      setTracking(t);
      setSales(s);
    } catch {
      message.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  }

  // ── KPIs globaux ──────────────────────────────────────────────────────────
  const globalKpis = useMemo(() => {
    const totalTargetAmt = tracking.reduce((s, r) => s + (r.targetAmount ?? 0), 0);
    const totalActualAmt = tracking.reduce((s, r) => s + (r.actualAmount ?? 0), 0);
    const totalTargetQty = tracking.reduce((s, r) => s + (r.targetQty ?? 0), 0);
    const totalActualQty = tracking.reduce((s, r) => s + (r.actualQty ?? 0), 0);
    const globalPct = totalTargetAmt > 0
      ? Math.round((totalActualAmt / totalTargetAmt) * 100)
      : 0;
    const exceeded = tracking.filter(r => r.status === 'EXCEEDED').length;
    const onTrack  = tracking.filter(r => r.status === 'ON_TRACK').length;
    const atRisk   = tracking.filter(r => r.status === 'AT_RISK').length;
    const critical = tracking.filter(r => r.status === 'CRITICAL').length;
    return { totalTargetAmt, totalActualAmt, totalTargetQty, totalActualQty, globalPct, exceeded, onTrack, atRisk, critical };
  }, [tracking]);

  // ── Synthèse par commercial ───────────────────────────────────────────────
  const byUser = useMemo(() => {
    const map: Record<string, { userName: string; targetAmt: number; actualAmt: number; targetQty: number; actualQty: number; lines: number }> = {};
    for (const r of tracking) {
      if (!map[r.userId]) map[r.userId] = { userName: r.userName, targetAmt: 0, actualAmt: 0, targetQty: 0, actualQty: 0, lines: 0 };
      map[r.userId].targetAmt += r.targetAmount ?? 0;
      map[r.userId].actualAmt += r.actualAmount ?? 0;
      map[r.userId].targetQty += r.targetQty ?? 0;
      map[r.userId].actualQty += r.actualQty ?? 0;
      map[r.userId].lines++;
    }
    return Object.entries(map).map(([userId, v]) => ({
      userId,
      ...v,
      pct: v.targetAmt > 0 ? Math.round((v.actualAmt / v.targetAmt) * 100) : 0,
    })).sort((a, b) => b.actualAmt - a.actualAmt);
  }, [tracking]);

  // ── Analyse IA ────────────────────────────────────────────────────────────
  async function handleGenerateInsights() {
    setAiInsightsLoading(true);
    setAiInsights(null);
    try {
      const monthLabel = filterMonth ? MONTHS[filterMonth - 1] : 'Tous les mois';
      const period = `${monthLabel} ${filterYear}`;
      const result = await generateSalesInsights({
        period,
        caRealise: globalKpis.totalActualAmt,
        caObjectif: globalKpis.totalTargetAmt,
        tauxAtteinte: globalKpis.globalPct,
        nbExceeded: globalKpis.exceeded,
        nbAchieved: globalKpis.onTrack,
        nbInProgress: globalKpis.atRisk,
        nbFailed: globalKpis.critical,
      });
      setAiInsights(result);
    } catch {
      message.error('Erreur lors de la génération des insights IA');
    } finally {
      setAiInsightsLoading(false);
    }
  }

  // ── Modal vente ───────────────────────────────────────────────────────────
  function openCreateSale() {
    setEditingSale(null);
    form.resetFields();
    form.setFieldsValue({ saleDate: dayjs() });
    setModalOpen(true);
  }

  function openEditSale(s: SaleEntryDto) {
    setEditingSale(s);
    form.setFieldsValue({
      userId: s.userId,
      productId: s.productId,
      accountId: s.accountId,
      saleDate: dayjs(s.saleDate),
      qty: s.qty,
      unitPrice: s.unitPrice,
      notes: s.notes,
    });
    setModalOpen(true);
  }

  async function handleSaveSale() {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const req: CreateSaleEntryRequest = {
        userId: vals.userId,
        productId: vals.productId,
        accountId: vals.accountId,
        saleDate: vals.saleDate.format('YYYY-MM-DD'),
        qty: vals.qty,
        unitPrice: vals.unitPrice,
        notes: vals.notes,
      };
      if (editingSale) {
        await objectivesApi.updateSale(editingSale.id, req);
        message.success('Vente modifiée');
      } else {
        await objectivesApi.createSale(req);
        message.success('Vente enregistrée');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSale(id: string) {
    try {
      await objectivesApi.deleteSale(id);
      message.success('Vente supprimée');
      loadData();
    } catch {
      message.error('Erreur suppression');
    }
  }

  // ── Colonnes tracking ─────────────────────────────────────────────────────
  const trackingColumns: ColumnsType<ObjectiveTrackingDto> = [
    {
      title: 'Commercial',
      dataIndex: 'userName',
      key: 'userName',
      fixed: 'left',
      width: 140,
      sorter: (a, b) => a.userName.localeCompare(b.userName),
      render: v => <Text strong>{v}</Text>,
    },
    {
      title: 'Article',
      key: 'product',
      width: 180,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{r.productName}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.productCode}</Text>
        </Space>
      ),
    },
    {
      title: 'Obj. Qté',
      dataIndex: 'targetQty',
      key: 'targetQty',
      align: 'right',
      width: 90,
      render: v => v?.toLocaleString('fr-MA') ?? '0',
    },
    {
      title: 'Réalisé Qté',
      dataIndex: 'actualQty',
      key: 'actualQty',
      align: 'right',
      width: 100,
      render: (v, r) => (
        <Text strong style={{ color: pctColor(r.achievementQtyPct) }}>
          {v?.toLocaleString('fr-MA') ?? '0'}
        </Text>
      ),
    },
    {
      title: '% Qté',
      dataIndex: 'achievementQtyPct',
      key: 'achievementQtyPct',
      width: 120,
      render: (v) => (
        <Progress
          percent={Math.min(v ?? 0, 100)}
          size="small"
          strokeColor={pctColor(v)}
          format={() => `${Math.round(v ?? 0)}%`}
        />
      ),
    },
    {
      title: 'Obj. CA',
      dataIndex: 'targetAmount',
      key: 'targetAmount',
      align: 'right',
      width: 130,
      render: v => formatMAD(v ?? 0),
    },
    {
      title: 'CA Réalisé',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      align: 'right',
      width: 130,
      render: (v, r) => (
        <Text strong style={{ color: pctColor(r.achievementAmountPct) }}>
          {formatMAD(v ?? 0)}
        </Text>
      ),
    },
    {
      title: '% CA',
      dataIndex: 'achievementAmountPct',
      key: 'achievementAmountPct',
      width: 120,
      render: (v) => (
        <Progress
          percent={Math.min(v ?? 0, 100)}
          size="small"
          strokeColor={pctColor(v)}
          format={() => `${Math.round(v ?? 0)}%`}
        />
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      filters: Object.entries(STATUS_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (val, r) => r.status === val,
      render: (v) => {
        const cfg = STATUS_CONFIG[v as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NO_OBJECTIVE;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
      },
    },
  ];

  // ── Colonnes ventes ───────────────────────────────────────────────────────
  const saleColumns: ColumnsType<SaleEntryDto> = [
    {
      title: 'Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
      width: 110,
      sorter: (a, b) => a.saleDate.localeCompare(b.saleDate),
      render: v => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Commercial',
      dataIndex: 'userName',
      key: 'userName',
      width: 140,
      render: v => <Text strong>{v}</Text>,
    },
    {
      title: 'Article',
      key: 'product',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.productName}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.productCode}</Text>
        </Space>
      ),
    },
    {
      title: 'Qté',
      dataIndex: 'qty',
      key: 'qty',
      align: 'right',
      width: 80,
      render: v => v?.toLocaleString('fr-MA'),
    },
    {
      title: 'Prix Unit.',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      width: 110,
      render: v => formatMAD(v ?? 0),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      width: 130,
      render: (v, r) => (
        <Text strong style={{ color: '#405189' }}>
          {formatMAD(v ?? (r.qty * r.unitPrice))}
        </Text>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: v => v ?? '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, r) => (
        <Space>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditSale(r)} />
          </Tooltip>
          <Popconfirm
            title="Supprimer cette vente ?"
            onConfirm={() => handleDeleteSale(r.id)}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LineChartOutlined style={{ fontSize: 16, color: '#405189' }} />
          <Title level={5} style={{ margin: 0 }}>Suivi des Ventes & KPIs</Title>
        </div>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateSale}>
          Saisir une vente
        </Button>
      </div>

      {/* Filtres */}
      <Card size="small" style={{ marginBottom: 10, borderRadius: 8 }}>
        <Row gutter={12} align="middle">
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>Année</Text>
            <Select value={filterYear} onChange={setFilterYear} style={{ width: 100 }}>
              {[2024, 2025, 2026, 2027].map(y => <Option key={y} value={y}>{y}</Option>)}
            </Select>
          </Col>
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>Mois</Text>
            <Select value={filterMonth} onChange={setFilterMonth} allowClear placeholder="Tous" style={{ width: 130 }}>
              {MONTHS.map((m, i) => <Option key={i + 1} value={i + 1}>{m}</Option>)}
            </Select>
          </Col>
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>Commercial</Text>
            <Select value={filterUser} onChange={setFilterUser} allowClear placeholder="Tous" showSearch optionFilterProp="children" style={{ width: 200 }}>
              {users.map(u => <Option key={u.id} value={u.id}>{u.label}</Option>)}
            </Select>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Actualiser</Button>
          </Col>
        </Row>
      </Card>

      {/* KPI Cards */}
      <Row gutter={8} style={{ marginBottom: 10 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #405189' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>CA Réalisé</span>}
              value={globalKpis.totalActualAmt}
              formatter={v => Number(v).toLocaleString('fr-MA')}
              valueStyle={{ color: '#405189', fontSize: 16 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Obj: {formatMAD(globalKpis.totalTargetAmt)}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: `4px solid ${pctColor(globalKpis.globalPct)}` }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>Taux d'atteinte CA</span>}
              value={globalKpis.globalPct}
              suffix="%"
              valueStyle={{ color: pctColor(globalKpis.globalPct), fontSize: 16 }}
            />
            <Progress percent={Math.min(globalKpis.globalPct, 100)} showInfo={false} strokeColor={pctColor(globalKpis.globalPct)} size="small" style={{ margin: '4px 0 0' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>Qté Vendue</span>}
              value={globalKpis.totalActualQty}
              formatter={v => Number(v).toLocaleString('fr-MA')}
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Obj: {globalKpis.totalTargetQty.toLocaleString('fr-MA')} unités
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #faad14' }}>
            <div style={{ marginBottom: 2 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Statut des objectifs</Text>
            </div>
            <Space wrap size={4}>
              <Badge color="#52c41a" text={<Text strong style={{ fontSize: 12 }}>{globalKpis.exceeded} Dépassé</Text>} />
              <Badge color="#1677ff" text={<Text strong style={{ fontSize: 12 }}>{globalKpis.onTrack} En cours</Text>} />
              <Badge color="#faad14" text={<Text strong style={{ fontSize: 12 }}>{globalKpis.atRisk} À risque</Text>} />
              <Badge color="#ff4d4f" text={<Text strong style={{ fontSize: 12 }}>{globalKpis.critical} Critique</Text>} />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Synthèse par commercial */}
      <Card
        title={<span style={{ fontSize: 13 }}>Synthèse par commercial</span>}
        size="small"
        style={{ borderRadius: 8, marginBottom: 10 }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        <Row gutter={8}>
          {byUser.map(u => {
            const pct = u.pct;
            return (
              <Col key={u.userId} xs={24} sm={12} md={8} lg={6} style={{ marginBottom: 8 }}>
                <Card size="small" style={{ borderRadius: 6, border: `1px solid ${pctColor(pct)}33`, padding: 0 }}
                  styles={{ body: { padding: '8px 10px' } }}>
                  <Text strong style={{ fontSize: 12 }}>{u.userName}</Text>
                  <div style={{ margin: '4px 0 2px' }}>
                    <Progress
                      percent={Math.min(pct, 100)}
                      strokeColor={pctColor(pct)}
                      size="small"
                      format={() => <span style={{ color: pctColor(pct), fontWeight: 600, fontSize: 11 }}>{pct}%</span>}
                    />
                  </div>
                  <Row gutter={4}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 10 }}>CA Réalisé</Text>
                      <div><Text strong style={{ fontSize: 11, color: pctColor(pct) }}>{formatMAD(u.actualAmt)}</Text></div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 10 }}>CA Objectif</Text>
                      <div><Text style={{ fontSize: 11 }}>{formatMAD(u.targetAmt)}</Text></div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
          {byUser.length === 0 && <Col><Text type="secondary">Aucune donnée pour cette période</Text></Col>}
        </Row>
      </Card>

      {/* Onglets : Tracking détaillé / Ventes saisies */}
      <Card size="small" style={{ borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'tracking',
              label: (
                <span><LineChartOutlined /> Tracking objectifs ({tracking.length})</span>
              ),
              children: (
                <Table
                  columns={trackingColumns}
                  dataSource={tracking}
                  rowKey={r => `${r.userId}-${r.productId}`}
                  loading={loading}
                  scroll={{ x: 1100 }}
                  pagination={{ pageSize: 20, showSizeChanger: true }}
                  size="small"
                  rowClassName={(r) => {
                    if (r.status === 'EXCEEDED') return 'row-exceeded';
                    if (r.status === 'CRITICAL') return 'row-critical';
                    return '';
                  }}
                  summary={(data) => {
                    const totalTgtAmt = data.reduce((s, r) => s + (r.targetAmount ?? 0), 0);
                    const totalActAmt = data.reduce((s, r) => s + (r.actualAmount ?? 0), 0);
                    const globalPct = totalTgtAmt > 0 ? Math.round((totalActAmt / totalTgtAmt) * 100) : 0;
                    return (
                      <Table.Summary.Row style={{ background: '#f8f9fa', fontWeight: 600 }}>
                        <Table.Summary.Cell index={0} colSpan={2}>
                          <Text strong>TOTAL</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text>{data.reduce((s, r) => s + (r.targetQty ?? 0), 0).toLocaleString('fr-MA')}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <Text strong style={{ color: pctColor(globalPct) }}>
                            {data.reduce((s, r) => s + (r.actualQty ?? 0), 0).toLocaleString('fr-MA')}
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          <Progress percent={Math.min(globalPct, 100)} size="small" strokeColor={pctColor(globalPct)} format={() => `${globalPct}%`} />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          <Text>{formatMAD(totalTgtAmt)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right">
                          <Text strong style={{ color: pctColor(globalPct) }}>{formatMAD(totalActAmt)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6}>
                          <Progress percent={Math.min(globalPct, 100)} size="small" strokeColor={pctColor(globalPct)} format={() => `${globalPct}%`} />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7} />
                      </Table.Summary.Row>
                    );
                  }}
                />
              ),
            },
            {
              key: 'sales',
              label: (
                <span><TableOutlined /> Ventes saisies ({sales.length})</span>
              ),
              children: (
                <Table
                  columns={saleColumns}
                  dataSource={sales}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 20, showSizeChanger: true }}
                  size="small"
                  summary={(data) => {
                    const totalAmt = data.reduce((s, r) => s + (r.totalAmount ?? r.qty * r.unitPrice), 0);
                    const totalQty = data.reduce((s, r) => s + (r.qty ?? 0), 0);
                    return (
                      <Table.Summary.Row style={{ background: '#f8f9fa' }}>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <Text strong>TOTAL ({data.length} ventes)</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text strong>{totalQty.toLocaleString('fr-MA')}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                        <Table.Summary.Cell index={3} align="right">
                          <Text strong style={{ color: '#405189' }}>{formatMAD(totalAmt)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} colSpan={2} />
                      </Table.Summary.Row>
                    );
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* ── Analyse IA ── */}
      <Card
        size="small"
        style={{ borderRadius: 8, marginTop: 10, borderColor: '#e9d5ff' }}
        title={
          <Space>
            <RobotOutlined style={{ color: '#7c3aed' }} />
            <Text strong style={{ fontSize: 13 }}>Analyse IA des performances</Text>
          </Space>
        }
        extra={
          <Button
            size="small"
            type="primary"
            icon={<RobotOutlined />}
            loading={aiInsightsLoading}
            onClick={handleGenerateInsights}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
            disabled={tracking.length === 0}
          >
            {aiInsights ? 'Réanalyser' : "Analyser avec l'IA"}
          </Button>
        }
      >
        {aiInsightsLoading && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#7c3aed' }}>
            <Spin size="small" style={{ marginRight: 8 }} />
            <Text type="secondary">Analyse en cours...</Text>
          </div>
        )}
        {!aiInsightsLoading && aiInsights && (
          <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{aiInsights}</Text>
        )}
        {!aiInsightsLoading && !aiInsights && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            Cliquez sur "Analyser avec l'IA" pour obtenir une synthèse narrative des performances commerciales et des recommandations personnalisées.
          </Text>
        )}
      </Card>

      {/* Modal saisie vente */}
      <Modal
        title={editingSale ? 'Modifier la vente' : 'Saisir une vente'}
        open={modalOpen}
        onOk={handleSaveSale}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Enregistrer"
        cancelText="Annuler"
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="saleDate" label="Date de vente" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="userId" label="Commercial" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children" placeholder="Choisir">
                  {users.map(u => <Option key={u.id} value={u.id}>{u.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="productId" label="Article" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" placeholder="Choisir un article">
              {products.map(p => (
                <Option key={p.id} value={p.id}>[{p.code}] {p.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="accountId" label="Client / Compte">
            <Select showSearch optionFilterProp="children" allowClear placeholder="Optionnel">
              {accounts.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="qty" label="Quantité" rules={[{ required: true }]}>
                <InputNumber min={0.001} precision={3} style={{ width: '100%' }} addonAfter="unités" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitPrice" label="Prix unitaire" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Client, chantier, région..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
