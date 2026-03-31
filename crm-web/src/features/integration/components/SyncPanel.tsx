import { useState } from 'react';
import {
  Card, Table, Button, Tag, Space, Spin,
  Tooltip, Badge, Typography, Empty,
  Popconfirm, message,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, MinusCircleOutlined, EyeOutlined,
  PlayCircleOutlined, StopOutlined, HistoryOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  SageSyncItemDto, SageSyncRequestDto, SyncEntityType,
} from '../../../api/sageIntegration';

const { Text } = Typography;

// ─── Action badge ─────────────────────────────────────────────────────────────

export function ActionTag({ action }: { action: string }) {
  const map: Record<string, { color: string; label: string }> = {
    CREATE: { color: 'green',   label: '+ Nouveau'     },
    UPDATE: { color: 'blue',    label: '↑ Mise à jour' },
    SKIP:   { color: 'default', label: '= Identique'   },
    ERROR:  { color: 'red',     label: '✗ Erreur'      },
  };
  const cfg = map[action] ?? { color: 'default', label: action };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

export function StatusTag({ status }: { status: string }) {
  const map: Record<string, { color: string; icon?: React.ReactNode }> = {
    PENDING:    { color: 'orange', icon: <SyncOutlined />       },
    PROCESSING: { color: 'blue',   icon: <SyncOutlined spin />  },
    DONE:       { color: 'green',  icon: <CheckCircleOutlined />},
    ERROR:      { color: 'red',    icon: <CloseCircleOutlined />},
    CANCELLED:  { color: 'default',icon: <MinusCircleOutlined />},
  };
  const cfg = map[status] ?? { color: 'default' };
  return <Tag color={cfg.color} icon={cfg.icon}>{status}</Tag>;
}

// ─── Preview Table ────────────────────────────────────────────────────────────

interface PreviewTableProps {
  items: SageSyncItemDto[];
  extraColumns?: ColumnsType<SageSyncItemDto>;
}

export function PreviewTable({ items, extraColumns = [] }: PreviewTableProps) {
  const baseColumns: ColumnsType<SageSyncItemDto> = [
    {
      title: '#',
      dataIndex: 'rowIndex',
      width: 50,
      render: (v: number) => <Text type="secondary">{v + 1}</Text>,
    },
    {
      title: 'Réf Sage',
      dataIndex: 'sageRef',
      width: 130,
      render: (v: string) => v ? <Text code>{v}</Text> : <Text type="secondary">—</Text>,
    },
    ...extraColumns,
    {
      title: 'Action',
      dataIndex: 'action',
      width: 130,
      render: (v: string) => <ActionTag action={v} />,
      filters: [
        { text: 'Nouveau', value: 'CREATE' },
        { text: 'Mise à jour', value: 'UPDATE' },
        { text: 'Identique', value: 'SKIP' },
        { text: 'Erreur', value: 'ERROR' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'Différences',
      dataIndex: 'diffData',
      render: (diff: Record<string, Record<string, unknown>> | null) => {
        if (!diff || Object.keys(diff).length === 0) return <Text type="secondary">—</Text>;
        return (
          <Tooltip
            title={
              <ul className="m-0 pl-4">
                {Object.entries(diff).map(([field, val]: [string, any]) => (
                  <li key={field}>
                    <strong>{field}</strong>: CRM={String(val.crm)} → Sage={String(val.sage)}
                  </li>
                ))}
              </ul>
            }
          >
            <Tag color="orange">{Object.keys(diff).length} champ(s)</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: 'Erreur',
      dataIndex: 'errorMessage',
      ellipsis: true,
      render: (v: string) => v
        ? <Text type="danger" ellipsis={{ tooltip: v }}>{v}</Text>
        : null,
    },
  ];

  return (
    <Table<SageSyncItemDto>
      dataSource={items}
      columns={baseColumns}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 10, showTotal: (t) => `${t} ligne(s)` }}
      rowClassName={(r) => r.action === 'ERROR' ? 'bg-red-50' : ''}
    />
  );
}

// ─── Historique des requêtes ──────────────────────────────────────────────────

interface HistoryPanelProps {
  entityType: SyncEntityType;
}

export function HistoryPanel({ entityType }: HistoryPanelProps) {
  const [requests, setRequests] = useState<SageSyncRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SageSyncRequestDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const page = await sageIntegrationApi.listRequests(entityType, 0, 10);
      setRequests(page.content);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!open) load();
    setOpen(!open);
  };

  const viewDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    try {
      const d = await sageIntegrationApi.getRequest(id);
      setDetail(d);
    } finally {
      setDetailLoading(false);
    }
  };

  const apply = async (id: string) => {
    setApplying(id);
    try {
      const updated = await sageIntegrationApi.applyRequest(id);
      message.success(`Synchronisation appliquée : ${updated.successItems} réussie(s), ${updated.errorItems} erreur(s)`);
      load();
      if (detailId === id) setDetail(updated);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Erreur lors de l\'application');
    } finally {
      setApplying(null);
    }
  };

  const cancel = async (id: string) => {
    try {
      await sageIntegrationApi.cancelRequest(id);
      message.success('Requête annulée');
      load();
    } catch {
      message.error('Impossible d\'annuler');
    }
  };

  const columns: ColumnsType<SageSyncRequestDto> = [
    {
      title: 'Label',
      dataIndex: 'label',
      render: (v, r) => v || <Text type="secondary">{r.entityType} — {new Date(r.createdAt).toLocaleDateString('fr-FR')}</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 130,
      render: (v) => <StatusTag status={v} />,
    },
    {
      title: 'Lignes',
      width: 200,
      render: (_, r) => (
        <Space size={4}>
          <Tag color="green">{r.successItems} ✓</Tag>
          <Tag color="default">{r.skipItems} =</Tag>
          <Tag color="red">{r.errorItems} ✗</Tag>
          <Text type="secondary">/ {r.totalItems}</Text>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 140,
      render: (v) => new Date(v).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      title: 'Par',
      dataIndex: 'createdByName',
      width: 130,
      render: (v) => v ?? '—',
    },
    {
      title: 'Actions',
      width: 140,
      render: (_, r) => (
        <Space>
          <Tooltip title="Voir le détail">
            <Button
              size="small" icon={<EyeOutlined />}
              onClick={() => viewDetail(r.id)}
            />
          </Tooltip>
          {r.status === 'PENDING' && (
            <>
              <Tooltip title="Appliquer">
                <Button
                  size="small" type="primary" icon={<PlayCircleOutlined />}
                  loading={applying === r.id}
                  onClick={() => apply(r.id)}
                />
              </Tooltip>
              <Popconfirm title="Annuler cette requête ?" onConfirm={() => cancel(r.id)}>
                <Tooltip title="Annuler">
                  <Button size="small" danger icon={<StopOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <Button
        icon={<HistoryOutlined />}
        onClick={toggleOpen}
        type={open ? 'primary' : 'default'}
        ghost={open}
      >
        {open ? 'Masquer l\'historique' : 'Voir l\'historique des requêtes'}
      </Button>

      {open && (
        <Card className="mt-4" size="small" title={`Historique — ${entityType}`}>
          {loading ? (
            <div className="flex justify-center py-8"><Spin /></div>
          ) : requests.length === 0 ? (
            <Empty description="Aucune requête de synchronisation" />
          ) : (
            <Table
              dataSource={requests}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          )}

          {/* Detail drawer inline */}
          {detailId && (
            <Card
              className="mt-4"
              size="small"
              title={`Détail de la requête`}
              extra={
                <Button size="small" onClick={() => { setDetailId(null); setDetail(null); }}>
                  Fermer
                </Button>
              }
            >
              {detailLoading ? (
                <div className="flex justify-center py-4"><Spin /></div>
              ) : detail ? (
                <>
                  <Space className="mb-4" wrap>
                    <StatusTag status={detail.status} />
                    <Text>Total : {detail.totalItems}</Text>
                    <Tag color="green">{detail.successItems} réussi(s)</Tag>
                    <Tag color="orange">{detail.skipItems} ignoré(s)</Tag>
                    <Tag color="red">{detail.errorItems} erreur(s)</Tag>
                  </Space>
                  {detail.items && <PreviewTable items={detail.items} />}
                </>
              ) : null}
            </Card>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Résumé preview ───────────────────────────────────────────────────────────

export function PreviewSummary({ items }: { items: SageSyncItemDto[] }) {
  const creates = items.filter(i => i.action === 'CREATE').length;
  const updates = items.filter(i => i.action === 'UPDATE').length;
  const skips   = items.filter(i => i.action === 'SKIP').length;
  const errors  = items.filter(i => i.action === 'ERROR').length;

  return (
    <div className="flex gap-4 flex-wrap my-3">
      <Badge count={creates} color="green" overflowCount={999}>
        <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>Nouveaux</Tag>
      </Badge>
      <Badge count={updates} color="blue" overflowCount={999}>
        <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>Mises à jour</Tag>
      </Badge>
      <Badge count={skips} color="default" overflowCount={999}>
        <Tag color="default" style={{ fontSize: 13, padding: '2px 10px' }}>Identiques</Tag>
      </Badge>
      {errors > 0 && (
        <Badge count={errors} color="red" overflowCount={999}>
          <Tag color="red" style={{ fontSize: 13, padding: '2px 10px' }}>Erreurs</Tag>
        </Badge>
      )}
    </div>
  );
}
