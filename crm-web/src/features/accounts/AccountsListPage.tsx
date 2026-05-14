import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Dropdown,
  Modal,
  message,
  Card,
  Row,
  Col,
  Select,
  Typography,
  Tooltip,
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PhoneOutlined,
  GlobalOutlined,
  FilterOutlined,
  ReloadOutlined,
  BankOutlined,
  TeamOutlined,
  CloudSyncOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import AccountsMap from './AccountsMap';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAccounts, deleteAccount, setFilters, clearFilters, fetchIndustries } from './accountsSlice';
import { AccountListItem, ACCOUNT_TYPES, SOCIETES_AFFECTATION } from '@/types/account';
import { accountsApi } from '@/api/accounts';
import { referenceDataApi, REFERENCE_CATEGORIES, type ReferenceDataItem } from '@/api/referenceData';
import type { ColumnsType } from 'antd/es/table';

interface TypeItem {
  value: string;
  label: string;
  color: string;
}
import type { MenuProps } from 'antd';
import AccountFormModal from './AccountFormModal';
import ExportButton from '@/components/ExportButton';
import ImportModal from '@/components/ImportModal';

const { Text } = Typography;
const { Search } = Input;

const AccountsListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters, industries } = useAppSelector((state) => state.accounts);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapAccounts, setMapAccounts] = useState<AccountListItem[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [refSocietes, setRefSocietes] = useState<ReferenceDataItem[]>([]);
  const [refTypes, setRefTypes] = useState<ReferenceDataItem[]>([]);

  useEffect(() => {
    referenceDataApi.getAll().then((data) => {
      setRefSocietes(data[REFERENCE_CATEGORIES.SOCIETE_AFFECTATION] ?? []);
      setRefTypes(data[REFERENCE_CATEGORIES.TYPE_COMPTE] ?? []);
    }).catch(() => {});
  }, []);

  const loadGeolocated = useCallback(async () => {
    setMapLoading(true);
    try {
      const data = await accountsApi.getGeolocated();
      setMapAccounts(data);
    } catch {
      // ignore
    } finally {
      setMapLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(() => {
    dispatch(fetchAccounts(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadAccounts();
    dispatch(fetchIndustries());
  }, [loadAccounts, dispatch]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value, page: 0 }));
  };

  const handleTableChange = (paginationConfig: any, _filters: any, sorter: any) => {
    dispatch(setFilters({
      page: paginationConfig.current - 1,
      size: paginationConfig.pageSize,
      sortBy: sorter.field || 'createdAt',
      sortDirection: sorter.order === 'ascend' ? 'asc' : 'desc',
    }));
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Supprimer le compte',
      content: 'Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteAccount(id)).unwrap();
          message.success('Compte supprimé avec succès');
          loadAccounts();
        } catch (error) {
          message.error('Erreur lors de la suppression du compte');
        }
      },
    });
  };

  const handleEdit = (id: string) => {
    setEditingAccount(id);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setEditingAccount(null);
    if (refresh) {
      loadAccounts();
    }
  };

  const getTypeColor = (type: string) => {
    const typeObj = ACCOUNT_TYPES.find((t: TypeItem) => t.value === type);
    return typeObj?.color || 'default';
  };

  const getScoreColor = (score?: number): string => {
    if (score === undefined || score === null) return 'default';
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#73d13d';
    if (score >= 40) return '#faad14';
    if (score >= 20) return '#ff7a45';
    return '#ff4d4f';
  };

  const getScoreLabel = (score?: number): string => {
    if (score === undefined || score === null) return '-';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    if (score >= 20) return 'Faible';
    return 'Critique';
  };

  const getActionItems = (record: AccountListItem): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Voir les détails',
      onClick: () => navigate(`/accounts/${record.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Modifier',
      onClick: () => handleEdit(record.id),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Supprimer',
      danger: true,
      onClick: () => handleDelete(record.id),
    },
  ];

  const columns: ColumnsType<AccountListItem> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      sorter: true,
      ellipsis: { showTitle: false },
      render: (value, record) => (
        <Tooltip title={value} placement="topLeft">
          <a onClick={() => navigate(`/accounts/${record.id}`)}>
            <BankOutlined className="mr-2" />{value}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Société',
      dataIndex: 'societeAffectation',
      key: 'societeAffectation',
      width: 150,
      ellipsis: { showTitle: false },
      render: (value: string) => value ? (
        <Tooltip title={value} placement="topLeft">
          <Tag color={value === 'Odyssée' ? 'geekblue' : 'cyan'}>{value}</Tag>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Type',
      dataIndex: 'accountType',
      key: 'accountType',
      width: 120,
      render: (value) => (
        <Tag color={getTypeColor(value)}>{value}</Tag>
      ),
    },
    {
      title: 'Catégorie client',
      dataIndex: 'categorieClient',
      key: 'categorieClient',
      width: 130,
      render: (value: string) => value || '-',
    },
    {
      title: "Secteur d'activité",
      dataIndex: 'secteurActivite',
      key: 'secteurActivite',
      width: 150,
      ellipsis: { showTitle: true },
      render: (value: string) => value || '-',
    },
    {
      title: 'Ville',
      key: 'location',
      width: 160,
      ellipsis: { showTitle: false },
      render: (_, record) => {
        const loc = record.billingCity
          ? `${record.billingCity}${record.billingCountry ? `, ${record.billingCountry}` : ''}`
          : null;
        return loc ? (
          <Tooltip title={loc} placement="topLeft"><span>{loc}</span></Tooltip>
        ) : '-';
      },
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      ellipsis: { showTitle: false },
      render: (value) => value ? (
        <Tooltip title={value} placement="topLeft">
          <a href={`tel:${value}`}><PhoneOutlined /> {value}</a>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Code CRM',
      dataIndex: 'codeClientCrm',
      key: 'codeClientCrm',
      width: 110,
      render: (value: string) => value
        ? <Tag color="purple">{value}</Tag>
        : '-',
    },
    {
      title: 'Code Sage',
      dataIndex: 'sageCode',
      key: 'sageCode',
      width: 120,
      render: (value: string) => value
        ? <Tag color="blue" icon={<CloudSyncOutlined />}>{value}</Tag>
        : '-',
    },
    {
      title: 'Site web',
      dataIndex: 'website',
      key: 'website',
      width: 100,
      render: (value) => value ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer">
          <GlobalOutlined /> Visiter
        </a>
      ) : '-',
    },
    {
      title: 'Représentant',
      dataIndex: 'representant',
      key: 'representant',
      width: 140,
      render: (value: string) => value || '-',
    },
    {
      title: 'Contacts',
      dataIndex: 'contactCount',
      key: 'contactCount',
      width: 90,
      align: 'center',
      render: (value) => (
        <Tag icon={<TeamOutlined />}>{value || 0}</Tag>
      ),
    },
    {
      title: 'Score Santé',
      dataIndex: 'accountScore',
      key: 'accountScore',
      width: 110,
      align: 'center',
      sorter: true,
      render: (score?: number) => {
        if (score === undefined || score === null) {
          return <span style={{ color: '#bfbfbf', fontSize: 12 }}>—</span>;
        }
        return (
          <Tooltip title={getScoreLabel(score)}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: getScoreColor(score),
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Propriétaire',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 140,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // Calculate stats
  const totalAccounts = pagination.totalElements;
  const clientCount = items.filter(a => a.accountType === 'Client').length;
  const prospectCount = items.filter(a => a.accountType === 'Prospect').length;

  const handleViewModeChange = (mode: string) => {
    const m = mode as 'list' | 'map';
    setViewMode(m);
    if (m === 'map') loadGeolocated();
  };

  useEffect(() => {
    if (viewMode === 'map') loadGeolocated();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Comptes</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><BankOutlined style={{ marginRight: 4 }} /><strong>{totalAccounts}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{clientCount}</strong> <Text type="secondary">clients</Text></span>
            <span style={{ color: '#1890ff' }}><strong>{prospectCount}</strong> <Text type="secondary">prospects</Text></span>
          </Space>
        </Space>
        <Space>
          <Segmented
            value={viewMode}
            onChange={handleViewModeChange}
            options={[
              { value: 'list', icon: <UnorderedListOutlined />, label: 'Liste' },
              { value: 'map',  icon: <EnvironmentOutlined />,   label: 'Carte' },
            ]}
          />
          <ExportButton entity="accounts" entityLabel="Comptes" size="small" />
          <Button size="small" onClick={() => setImportModalOpen(true)}>Importer</Button>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouveau compte
          </Button>
        </Space>
      </div>

      {/* ── Table Card ── */}
      <Card
        styles={{ body: { padding: '8px 16px 16px' } }}
        title={
          <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
            <Col flex="auto">
              <Search
                placeholder="Rechercher un compte..."
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
                <Button size="small" icon={<ReloadOutlined />} onClick={viewMode === 'map' ? loadGeolocated : loadAccounts}>Actualiser</Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 10 }}>
            <Col span={5}>
              <Select
                placeholder="Société d'affectation"
                allowClear
                style={{ width: '100%' }}
                options={refSocietes.length > 0
                  ? refSocietes.filter(r => r.active).map(r => ({ value: r.value, label: r.label }))
                  : SOCIETES_AFFECTATION}
                onChange={(value) => dispatch(setFilters({ societeAffectation: value, page: 0 }))}
                value={filters.societeAffectation}
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="Type de compte"
                allowClear
                style={{ width: '100%' }}
                options={refTypes.length > 0
                  ? refTypes.filter(r => r.active).map(r => ({ value: r.value, label: r.label }))
                  : ACCOUNT_TYPES.map((t: TypeItem) => ({ value: t.value, label: t.label }))}
                onChange={(value) => dispatch(setFilters({ accountType: value, page: 0 }))}
                value={filters.accountType}
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="Secteur d'activité"
                allowClear
                style={{ width: '100%' }}
                options={industries.map(i => ({ value: i.id, label: i.name }))}
                onChange={(value) => dispatch(setFilters({ industryId: value, page: 0 }))}
                value={filters.industryId}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Col>
            <Col>
              <Button
                icon={<CloudSyncOutlined />}
                type={filters.hasSageCode ? 'primary' : 'default'}
                onClick={() => dispatch(setFilters({ hasSageCode: filters.hasSageCode ? undefined : true, page: 0 }))}
              >
                Importé Sage
              </Button>
            </Col>
            <Col>
              <Button onClick={() => dispatch(clearFilters())}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        {viewMode === 'map' ? (
          <AccountsMap accounts={mapAccounts} loading={mapLoading} />
        ) : (
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              current: pagination.page + 1,
              pageSize: pagination.size,
              total: pagination.totalElements,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} comptes`,
            }}
            scroll={{ x: 1590, y: 'calc(100vh - 330px)' }}
          />
        )}
      </Card>

      <AccountFormModal
        open={modalOpen}
        accountId={editingAccount}
        onClose={handleModalClose}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadAccounts}
        entity="accounts"
        entityLabel="Comptes"
        expectedColumns={[
          { key: 'name', label: 'Nom' },
          { key: 'type', label: 'Type' },
          { key: 'industry', label: 'Secteur' },
          { key: 'phone', label: 'Téléphone' },
          { key: 'website', label: 'Site web' },
          { key: 'city', label: 'Ville' },
        ]}
      />
    </div>
  );
};

export default AccountsListPage;
