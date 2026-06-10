import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Select,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Tag,
  Alert,
  Tooltip,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ReloadOutlined,
  HourglassOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import agedBalanceApi from '@/api/agedBalance';
import { AgedBalanceRow } from '@/types/agedBalance';
import { selectUser } from '@/features/auth/authSlice';

const { Title, Text } = Typography;
const { Option } = Select;

// ── Couleurs par tranche d'âge ──────────────────────────────────────────────
const COLOR_NON_ECHU = '#52c41a';   // vert
const COLOR_1_30    = '#faad14';   // jaune-orange
const COLOR_31_60   = '#fa8c16';   // orange
const COLOR_61_90   = '#f5222d';   // rouge
const COLOR_91_PLUS = '#820014';   // rouge foncé

function formatMAD(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function AmountCell({ value, color }: { value: number; color: string }) {
  if (value <= 0) return <Text type="secondary">—</Text>;
  return <span style={{ color, fontWeight: 500 }}>{formatMAD(value)}</span>;
}

// ── Composant principal ──────────────────────────────────────────────────────
const AgedBalancePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const isCommercial = currentUser?.role?.name === 'COMMERCIAL';

  const [data, setData] = useState<AgedBalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommercialId, setSelectedCommercialId] = useState<string | null>(null);

  // Chargement des données
  const load = async (commercialId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await agedBalanceApi.getAll(commercialId);
      setData(rows);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Erreur inconnue';
      if (status === 401 || status === 403) {
        setError(`Accès refusé (${status}) — reconnectez-vous.`);
      } else if (status === 500) {
        setError(`Erreur serveur (500) : ${msg}`);
      } else if (status === 404) {
        setError('Endpoint introuvable (404) — redémarrez le backend.');
      } else if (status) {
        setError(`Erreur HTTP ${status} : ${msg}`);
      } else {
        setError(`Connexion impossible — vérifiez que le backend est démarré. (${msg})`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(null);
  }, []);

  const handleCommercialChange = (value: string | null) => {
    setSelectedCommercialId(value);
    load(value);
  };

  // Liste unique des commerciaux extraite des données (chargement initial)
  const [allData, setAllData] = useState<AgedBalanceRow[]>([]);

  useEffect(() => {
    if (!selectedCommercialId) {
      setAllData(data);
    }
  }, [data, selectedCommercialId]);

  const commercialOptions = useMemo(() => {
    const seen = new Map<string, string>();
    allData.forEach((row) => {
      if (row.commercialId && !seen.has(row.commercialId)) {
        seen.set(row.commercialId, row.commercialName ?? row.commercialId);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [allData]);

  // ── Calculs statistiques ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalDue    = data.reduce((s, r) => s + r.totalDue,   0);
    const nonEchu     = data.reduce((s, r) => s + r.nonEchu,    0);
    const echu1a30    = data.reduce((s, r) => s + r.echu1a30,   0);
    const echu31a60   = data.reduce((s, r) => s + r.echu31a60,  0);
    const echu61a90   = data.reduce((s, r) => s + r.echu61a90,  0);
    const echu91plus  = data.reduce((s, r) => s + r.echu91plus, 0);
    const echu        = echu1a30 + echu31a60 + echu61a90 + echu91plus;
    const clients     = data.length;

    // DSO = âge moyen pondéré des créances (jours)
    // Midpoints : 1-30j → 15j, 31-60j → 45j, 61-90j → 75j, 91j+ → 105j
    const dso = totalDue > 0
      ? Math.round(
          (echu1a30 * 15 + echu31a60 * 45 + echu61a90 * 75 + echu91plus * 105) / totalDue
        )
      : 0;

    return { totalDue, nonEchu, echu, clients, dso };
  }, [data]);

  // ── Colonnes du tableau ──────────────────────────────────────────────────
  const columns: ColumnsType<AgedBalanceRow> = [
    {
      title: 'Client',
      dataIndex: 'accountName',
      key: 'accountName',
      sorter: (a, b) => a.accountName.localeCompare(b.accountName),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Commercial',
      dataIndex: 'commercialName',
      key: 'commercialName',
      render: (name: string | null) =>
        name ? (
          <Tag color="blue">{name}</Tag>
        ) : (
          <Text type="secondary" italic>Non assigné</Text>
        ),
    },
    {
      title: (
        <Tooltip title="Factures dont la date d'échéance n'est pas encore dépassée">
          <span style={{ color: COLOR_NON_ECHU }}>Non échu</span>
        </Tooltip>
      ),
      dataIndex: 'nonEchu',
      key: 'nonEchu',
      align: 'right',
      sorter: (a, b) => a.nonEchu - b.nonEchu,
      render: (v: number) => <AmountCell value={v} color={COLOR_NON_ECHU} />,
    },
    {
      title: (
        <Tooltip title="Retard de 1 à 30 jours">
          <span style={{ color: COLOR_1_30 }}>1 – 30 j</span>
        </Tooltip>
      ),
      dataIndex: 'echu1a30',
      key: 'echu1a30',
      align: 'right',
      sorter: (a, b) => a.echu1a30 - b.echu1a30,
      render: (v: number) => <AmountCell value={v} color={COLOR_1_30} />,
    },
    {
      title: (
        <Tooltip title="Retard de 31 à 60 jours">
          <span style={{ color: COLOR_31_60 }}>31 – 60 j</span>
        </Tooltip>
      ),
      dataIndex: 'echu31a60',
      key: 'echu31a60',
      align: 'right',
      sorter: (a, b) => a.echu31a60 - b.echu31a60,
      render: (v: number) => <AmountCell value={v} color={COLOR_31_60} />,
    },
    {
      title: (
        <Tooltip title="Retard de 61 à 90 jours">
          <span style={{ color: COLOR_61_90 }}>61 – 90 j</span>
        </Tooltip>
      ),
      dataIndex: 'echu61a90',
      key: 'echu61a90',
      align: 'right',
      sorter: (a, b) => a.echu61a90 - b.echu61a90,
      render: (v: number) => <AmountCell value={v} color={COLOR_61_90} />,
    },
    {
      title: (
        <Tooltip title="Retard de plus de 90 jours">
          <span style={{ color: COLOR_91_PLUS }}>91 j +</span>
        </Tooltip>
      ),
      dataIndex: 'echu91plus',
      key: 'echu91plus',
      align: 'right',
      sorter: (a, b) => a.echu91plus - b.echu91plus,
      render: (v: number) => <AmountCell value={v} color={COLOR_91_PLUS} />,
    },
    {
      title: <span style={{ fontWeight: 700 }}>Total dû</span>,
      dataIndex: 'totalDue',
      key: 'totalDue',
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.totalDue - b.totalDue,
      render: (v: number) => (
        <span style={{ fontWeight: 700, fontSize: 13 }}>{formatMAD(v)}</span>
      ),
    },
    {
      title: 'Fact.',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
      align: 'center',
      sorter: (a, b) => a.invoiceCount - b.invoiceCount,
      render: (v: number) => <Tag>{v}</Tag>,
    },
  ];

  // ── Ligne des totaux ─────────────────────────────────────────────────────
  const tableSummary: TableProps<AgedBalanceRow>['summary'] = (pageData) => {
    const tot = {
      nonEchu:    pageData.reduce((s, r) => s + r.nonEchu,    0),
      echu1a30:   pageData.reduce((s, r) => s + r.echu1a30,   0),
      echu31a60:  pageData.reduce((s, r) => s + r.echu31a60,  0),
      echu61a90:  pageData.reduce((s, r) => s + r.echu61a90,  0),
      echu91plus: pageData.reduce((s, r) => s + r.echu91plus, 0),
      totalDue:   pageData.reduce((s, r) => s + r.totalDue,   0),
      invoiceCount: pageData.reduce((s, r) => s + r.invoiceCount, 0),
    };

    const cellStyle: React.CSSProperties = { fontWeight: 700, background: '#fafafa' };

    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={2}>
            <Text strong>TOTAL</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">
            <div style={cellStyle}><AmountCell value={tot.nonEchu} color={COLOR_NON_ECHU} /></div>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            <div style={cellStyle}><AmountCell value={tot.echu1a30} color={COLOR_1_30} /></div>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">
            <div style={cellStyle}><AmountCell value={tot.echu31a60} color={COLOR_31_60} /></div>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={5} align="right">
            <div style={cellStyle}><AmountCell value={tot.echu61a90} color={COLOR_61_90} /></div>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={6} align="right">
            <div style={cellStyle}><AmountCell value={tot.echu91plus} color={COLOR_91_PLUS} /></div>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={7} align="right">
            <div style={{ ...cellStyle, fontSize: 14 }}>{formatMAD(tot.totalDue)}</div>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={8} align="center">
            <div style={cellStyle}><Tag>{tot.invoiceCount}</Tag></div>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 4px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <ClockCircleOutlined style={{ marginRight: 10, color: '#4F46E5' }} />
          Balance Âgée
        </Title>
        <Text type="secondary">
          Créances ouvertes par client, groupées par tranche d'ancienneté
        </Text>
      </div>

      {/* Cartes statistiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="Total dû"
              value={formatMAD(stats.totalDue)}
              valueStyle={{ color: '#4F46E5', fontWeight: 700, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={
                <span>
                  <WarningOutlined style={{ color: COLOR_61_90, marginRight: 6 }} />
                  Échu (retard)
                </span>
              }
              value={formatMAD(stats.echu)}
              valueStyle={{ color: COLOR_61_90, fontWeight: 700, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={
                <span>
                  <CheckCircleOutlined style={{ color: COLOR_NON_ECHU, marginRight: 6 }} />
                  Non échu
                </span>
              }
              value={formatMAD(stats.nonEchu)}
              valueStyle={{ color: COLOR_NON_ECHU, fontWeight: 700, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic
              title={
                <span>
                  <TeamOutlined style={{ marginRight: 6 }} />
                  Clients concernés
                </span>
              }
              value={stats.clients}
              valueStyle={{ fontWeight: 700, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderTop: `3px solid ${stats.dso > 90 ? COLOR_91_PLUS : stats.dso > 60 ? COLOR_61_90 : stats.dso > 30 ? COLOR_31_60 : stats.dso > 0 ? COLOR_1_30 : COLOR_NON_ECHU}`,
            }}
          >
            <Tooltip title="DSO = âge moyen pondéré des créances en retard (echu1-30j×15 + echu31-60j×45 + echu61-90j×75 + echu91j+×105) / Total dû">
              <Statistic
                title={
                  <span>
                    <HourglassOutlined style={{ marginRight: 6 }} />
                    DSO — Retard moyen
                  </span>
                }
                value={stats.dso}
                suffix="j"
                valueStyle={{
                  fontWeight: 700,
                  fontSize: 20,
                  color: stats.dso > 90 ? COLOR_91_PLUS : stats.dso > 60 ? COLOR_61_90 : stats.dso > 30 ? COLOR_31_60 : stats.dso > 0 ? COLOR_1_30 : COLOR_NON_ECHU,
                }}
              />
            </Tooltip>
          </Card>
        </Col>
      </Row>

      {/* Barre de filtre */}
      <Card
        bordered={false}
        style={{ marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Space wrap>
          {isCommercial ? (
            // Commercial : vue restreinte, pas de filtre
            <>
              <UserOutlined style={{ color: '#4F46E5' }} />
              <Text strong style={{ color: '#4F46E5' }}>
                Vos créances — {currentUser?.firstName} {currentUser?.lastName}
              </Text>
            </>
          ) : (
            // Admin / Manager : filtre par commercial
            <>
              <Text strong>Filtrer par commercial :</Text>
              <Select
                allowClear
                placeholder="Tous les commerciaux"
                style={{ minWidth: 220 }}
                value={selectedCommercialId}
                onChange={(v) => handleCommercialChange(v ?? null)}
                disabled={loading}
              >
                {commercialOptions.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => load(isCommercial ? null : selectedCommercialId)}
            loading={loading}
          >
            Actualiser
          </Button>
        </Space>
      </Card>

      {/* Message d'erreur */}
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Tableau principal */}
      <Card
        bordered={false}
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table<AgedBalanceRow>
          columns={columns}
          dataSource={data}
          rowKey="accountId"
          loading={loading}
          pagination={{ pageSize: 25, showSizeChanger: true, showTotal: (t) => `${t} client(s)` }}
          scroll={{ x: 900 }}
          summary={tableSummary}
          size="middle"
          locale={{ emptyText: 'Aucune créance ouverte' }}
          onRow={(record) => ({
            onClick: () => navigate(`/accounts/${record.accountId}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
};

export default AgedBalancePage;
