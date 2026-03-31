import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Tag, Space, Card, Dropdown, Modal, message, Row, Col, Statistic, Select, Progress, Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined,
  FileTextOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DollarOutlined, ExclamationCircleOutlined, WarningOutlined, FilterOutlined, ReloadOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchInvoices, deleteInvoice, sendInvoice, markInvoicePaid, cancelInvoice, fetchInvoiceStats } from './invoicesSlice';
import InvoiceFormModal from './InvoiceFormModal';
import { InvoiceListItem, InvoiceStatus, INVOICE_STATUS_CONFIG } from '@/types/invoice';

const { Text } = Typography;
const { Search } = Input;

const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_CONFIG).map(([value, cfg]) => ({
  value, label: cfg.label,
}));

export default function InvoicesListPage() {
  const dispatch = useAppDispatch();
  const { invoices, loading, pagination, stats } = useAppSelector((state) => state.invoices);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceListItem | null>(null);

  const loadData = useCallback(() => {
    dispatch(fetchInvoices({
      page: pagination.page,
      size: pagination.size,
      search: search || undefined,
      status: statusFilter,
    }));
    dispatch(fetchInvoiceStats());
  }, [dispatch, pagination.page, pagination.size, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleEdit = (record: InvoiceListItem) => {
    setEditingInvoice(record);
    setModalOpen(true);
  };

  const handleDelete = (record: InvoiceListItem) => {
    Modal.confirm({
      title: 'Supprimer la facture',
      content: `Êtes-vous sûr de vouloir supprimer "${record.invoiceNumber}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteInvoice(record.id));
        message.success('Facture supprimée');
        loadData();
      },
    });
  };

  const handleSend = (record: InvoiceListItem) => {
    Modal.confirm({
      title: 'Envoyer la facture',
      content: `Marquer "${record.invoiceNumber}" comme envoyée ?`,
      okText: 'Envoyer',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(sendInvoice(record.id));
        message.success('Facture envoyée');
        loadData();
      },
    });
  };

  const handleMarkPaid = (record: InvoiceListItem) => {
    Modal.confirm({
      title: 'Marquer comme payée',
      content: `Marquer "${record.invoiceNumber}" comme payée ?`,
      okText: 'Confirmer',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(markInvoicePaid(record.id));
        message.success('Facture marquée comme payée');
        loadData();
      },
    });
  };

  const handleCancel = (record: InvoiceListItem) => {
    Modal.confirm({
      title: 'Annuler la facture',
      content: `Êtes-vous sûr de vouloir annuler "${record.invoiceNumber}" ?`,
      okText: 'Annuler la facture',
      okType: 'danger',
      cancelText: 'Retour',
      onOk: async () => {
        await dispatch(cancelInvoice(record.id));
        message.success('Facture annulée');
        loadData();
      },
    });
  };

  const getActions = (record: InvoiceListItem): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record) },
    ];

    if (record.status === 'DRAFT') {
      items.push({ key: 'send', icon: <SendOutlined />, label: 'Envoyer', onClick: () => handleSend(record) });
    }

    if (record.status !== 'PAID' && record.status !== 'CANCELLED') {
      items.push({ key: 'markPaid', icon: <CheckCircleOutlined />, label: 'Marquer payée', onClick: () => handleMarkPaid(record) });
    }

    if (record.status !== 'PAID' && record.status !== 'CANCELLED') {
      items.push({ type: 'divider' });
      items.push({ key: 'cancel', icon: <CloseCircleOutlined />, label: 'Annuler', danger: true, onClick: () => handleCancel(record) });
    }

    if (record.status === 'DRAFT') {
      items.push({ key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record) });
    }

    return items;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const columns = [
    {
      title: 'N° Facture',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 160,
      render: (num: string, record: InvoiceListItem) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{num}</span>
          {record.overdue && <Tag color="red" icon={<WarningOutlined />}>Retard</Tag>}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'invoiceType',
      width: 110,
      render: (type: string) => {
        const cfg: Record<string, { label: string; color: string }> = {
          INVOICE: { label: 'Facture', color: 'blue' },
          CREDIT_NOTE: { label: 'Avoir', color: 'orange' },
          PROFORMA: { label: 'Proforma', color: 'purple' },
        };
        const c = cfg[type] || { label: type, color: 'default' };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: 'Client',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      width: 110,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
    {
      title: 'Échéance',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 110,
      render: (date: string, record: InvoiceListItem) => {
        const d = date ? new Date(date).toLocaleDateString('fr-FR') : '-';
        return record.overdue ? <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{d}</span> : d;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      align: 'right' as const,
      render: (total: number, _record: InvoiceListItem) => (
        <span style={{ fontWeight: 600 }}>{formatAmount(total)}</span>
      ),
    },
    {
      title: 'Payé',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      width: 130,
      align: 'right' as const,
      render: (paid: number, record: any) => {
        if (!paid && paid !== 0) return '-';
        const total = record.total || 0;
        const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
        return (
          <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
            <span style={{ color: '#52c41a', fontWeight: 500 }}>
              {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(paid)}
            </span>
            <Progress percent={pct} size="small" style={{ width: 70 }} showInfo={false}
              strokeColor={pct >= 100 ? '#52c41a' : pct >= 50 ? '#faad14' : '#ff4d4f'} />
          </Space>
        );
      },
    },
    {
      title: 'Restant dû',
      dataIndex: 'amountDue',
      key: 'amountDue',
      width: 130,
      align: 'right' as const,
      render: (due: number, _record: InvoiceListItem) => (
        <span style={{ color: due > 0 ? '#fa8c16' : '#52c41a', fontWeight: 500 }}>
          {formatAmount(due)}
        </span>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: InvoiceStatus) => {
        const cfg = INVOICE_STATUS_CONFIG[status];
        return <Tag color={cfg?.color}>{cfg?.label || status}</Tag>;
      },
    },
    {
      title: 'Créé par',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 120,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: InvoiceListItem) => (
        <Dropdown menu={{ items: getActions(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Factures</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><FileTextOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            {(stats?.overdueAmount ?? 0) > 0 && (
              <span style={{ color: '#ff4d4f' }}><ExclamationCircleOutlined style={{ marginRight: 4 }} /><strong>{formatAmount(stats!.overdueAmount)}</strong> <Text type="secondary">en retard</Text></span>
            )}
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingInvoice(null); setModalOpen(true); }}>
            Nouvelle facture
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Total facturé" value={stats?.totalInvoiced || 0} prefix={<DollarOutlined />} suffix="" valueStyle={{ fontSize: 18, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Payé" value={stats?.totalPaid || 0} suffix="" valueStyle={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="En attente" value={stats?.totalDue || 0} suffix="" valueStyle={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="En retard" value={stats?.overdueAmount || 0} prefix={<ExclamationCircleOutlined />} suffix="" valueStyle={{ fontSize: 18, fontWeight: 600, color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      {/* ── Table Card ── */}
      <Card
        styles={{ body: { padding: '8px 16px 16px' } }}
        title={
          <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
            <Col flex="auto">
              <Search
                placeholder="Rechercher..."
                allowClear
                enterButton
                size="small"
                onSearch={handleSearch}
                style={{ maxWidth: 260 }}
              />
            </Col>
            <Col>
              <Space>
                <Button size="small" icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>Filtres</Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadData}>Actualiser</Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 10 }}>
            <Col span={6}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                options={STATUS_OPTIONS}
                onChange={(val) => setStatusFilter(val as InvoiceStatus)}
                value={statusFilter}
              />
            </Col>
            <Col>
              <Button onClick={() => { setStatusFilter(undefined); setSearch(''); }}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: (pagination.page || 0) + 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total) => `${total} facture(s)`,
            onChange: (page, pageSize) => {
              dispatch(fetchInvoices({
                page: page - 1,
                size: pageSize,
                search: search || undefined,
                status: statusFilter,
              }));
            },
          }}
          scroll={{ x: 1400, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <InvoiceFormModal
        open={modalOpen}
        invoiceId={editingInvoice?.id || null}
        onClose={() => { setModalOpen(false); setEditingInvoice(null); }}
        onSuccess={() => { setModalOpen(false); setEditingInvoice(null); loadData(); }}
      />
    </div>
  );
}
