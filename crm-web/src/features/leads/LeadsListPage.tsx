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
  Progress,
  Tooltip,
  Form,
  InputNumber,
  Checkbox,
  DatePicker,
  Divider,
  Tabs,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  SwapOutlined,
  FireOutlined,
  EnvironmentOutlined,
  FunnelPlotOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchLeads, deleteLead, setFilters, clearFilters } from './leadsSlice';
import { LeadListItem, LEAD_STATUSES, LEAD_SOURCES, LEAD_RATINGS } from '@/types/lead';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
dayjs.extend(relativeTime);
dayjs.locale('fr');
import LeadFormModal from './LeadFormModal';
import ExportButton from '@/components/ExportButton';
import ImportModal from '@/components/ImportModal';
import { leadsApi } from '@/api/leads';
import { opportunitiesApi } from '@/api/opportunities';
import type { OpportunityStage } from '@/types/opportunity';

const { Text } = Typography;
const { Search } = Input;

interface StatusItem {
  value: string;
  label: string;
  color: string;
}

const LeadsListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, pagination, filters } = useAppSelector((state) => state.leads);
  const currentUser = useAppSelector((state) => state.auth.user);
  const canDelete = currentUser?.role?.name !== 'COMMERCIAL' && currentUser?.role?.name !== 'READ_ONLY';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [convertingLead, setConvertingLead] = useState<LeadListItem | null>(null);
  const [convertForm] = Form.useForm();
  const [stages, setStages] = useState<OpportunityStage[]>([]);
  const [convertLoading, setConvertLoading] = useState(false);
  const [createOpportunity, setCreateOpportunity] = useState(false);

  const loadLeads = useCallback(() => {
    dispatch(fetchLeads(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value, page: 0 }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    dispatch(setFilters({ status: tab === 'all' ? undefined : tab, page: 0 }));
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
      title: 'Supprimer la piste',
      content: 'Êtes-vous sûr de vouloir supprimer cette piste ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteLead(id)).unwrap();
          message.success('Piste supprimée avec succès');
          loadLeads();
        } catch (error) {
          message.error('Erreur lors de la suppression de la piste');
        }
      },
    });
  };

  const handleView = (id: string) => {
    navigate(`/leads/${id}`);
  };

  const handleEdit = (id: string) => {
    setEditingLead(id);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setEditingLead(null);
    if (refresh) {
      loadLeads();
    }
  };

  const handleConvertOpen = async (record: LeadListItem) => {
    setConvertingLead(record);
    setCreateOpportunity(false);
    convertForm.setFieldsValue({
      createAccount: true,
      createContact: true,
      createOpportunity: false,
      accountName: record.companyName || record.fullName,
      accountType: 'prospect',
      opportunityName: `Opportunité - ${record.fullName}`,
    });
    if (stages.length === 0) {
      try {
        const data = await opportunitiesApi.getStages();
        setStages(data);
      } catch {
        // ignore
      }
    }
  };

  const handleConvertSubmit = async () => {
    try {
      const values = await convertForm.validateFields();
      setConvertLoading(true);
      await leadsApi.convert(convertingLead!.id, {
        createAccount: values.createAccount,
        createContact: values.createContact,
        createOpportunity: values.createOpportunity,
        accountName: values.accountName,
        accountType: values.accountType,
        opportunityName: values.opportunityName,
        opportunityAmount: values.opportunityAmount,
        opportunityStageId: values.opportunityStageId,
        closeDate: values.closeDate ? dayjs(values.closeDate).format('YYYY-MM-DD') : undefined,
      });
      message.success('Piste convertie avec succès');
      setConvertingLead(null);
      convertForm.resetFields();
      loadLeads();
    } catch (error: any) {
      if (error?.errorFields) return; // validation error
      message.error('Erreur lors de la conversion');
    } finally {
      setConvertLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = LEAD_STATUSES.find((s: StatusItem) => s.value === status);
    return statusObj?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusObj = LEAD_STATUSES.find((s: StatusItem) => s.value === status);
    return statusObj?.label || status;
  };

  const getRatingColor = (rating: string) => {
    const ratingObj = LEAD_RATINGS.find((r) => r.value === rating);
    return ratingObj?.color || 'default';
  };

  const getRatingLabel = (rating: string) => {
    const ratingObj = LEAD_RATINGS.find((r) => r.value === rating);
    return ratingObj?.label || rating;
  };

  const getActionItems = (record: LeadListItem): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Voir les détails',
      onClick: () => handleView(record.id),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Modifier',
      onClick: () => handleEdit(record.id),
    },
    {
      key: 'convert',
      icon: <SwapOutlined />,
      label: 'Convertir',
      onClick: () => handleConvertOpen(record),
    },
    ...(canDelete ? [
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Supprimer',
        danger: true,
        onClick: () => handleDelete(record.id),
      },
    ] : []),
  ];

  const columns: ColumnsType<LeadListItem> = [
    {
      title: 'Nom',
      key: 'name',
      width: 170,
      sorter: true,
      ellipsis: { showTitle: false },
      render: (_, record) => (
        <Tooltip title={record.fullName} placement="topLeft">
          <a onClick={() => handleView(record.id)}>
            <UserOutlined className="mr-2" />
            {record.fullName}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Entreprise',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Poste',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 140,
      ellipsis: { showTitle: true },
      render: (value: string) => value || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 190,
      ellipsis: { showTitle: false },
      render: (value) => value ? (
        <Tooltip title={value} placement="topLeft">
          <a href={`mailto:${value}`}>
            <MailOutlined /> {value}
          </a>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      ellipsis: { showTitle: false },
      render: (value) => value ? (
        <Tooltip title={value} placement="topLeft">
          <a href={`tel:${value}`}>
            <PhoneOutlined /> {value}
          </a>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Ville',
      dataIndex: 'city',
      key: 'city',
      width: 130,
      ellipsis: { showTitle: false },
      render: (city: string, record: any) => {
        const loc = [city, record.country].filter(Boolean).join(', ');
        return loc ? (
          <Tooltip title={loc} placement="topLeft">
            <Space size={4}><EnvironmentOutlined style={{ color: '#1890ff' }} /><span>{loc}</span></Space>
          </Tooltip>
        ) : '-';
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) => (
        <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 130,
      ellipsis: { showTitle: false },
      render: (value) => {
        const sourceObj = LEAD_SOURCES.find((s) => s.value === value);
        const label = sourceObj?.label || value || '-';
        return <Tooltip title={label} placement="topLeft"><span>{label}</span></Tooltip>;
      },
    },
    {
      title: 'Note',
      dataIndex: 'rating',
      key: 'rating',
      width: 90,
      render: (value) => value ? (
        <Tag color={getRatingColor(value)} icon={<FireOutlined />}>
          {getRatingLabel(value)}
        </Tag>
      ) : '-',
    },
    {
      title: 'Score',
      dataIndex: 'leadScore',
      key: 'leadScore',
      width: 80,
      align: 'center',
      sorter: true,
      render: (value) => (
        <Progress
          percent={value || 0}
          size="small"
          strokeColor={value >= 70 ? '#52c41a' : value >= 40 ? '#faad14' : '#ff4d4f'}
          showInfo={false}
          style={{ width: 60 }}
        />
      ),
    },
    {
      title: 'Propriétaire',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 140,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Dernière activité',
      dataIndex: 'lastActivityAt',
      key: 'lastActivityAt',
      width: 140,
      render: (date: string) => {
        if (!date) return <span style={{ color: '#d9d9d9' }}>Aucune</span>;
        const d = dayjs(date);
        const isOld = d.isBefore(dayjs().subtract(30, 'day'));
        return (
          <Tooltip title={d.format('DD/MM/YYYY HH:mm')}>
            <span style={{ color: isOld ? '#ff4d4f' : '#52c41a', fontWeight: isOld ? 600 : undefined }}>
              {d.fromNow()}
            </span>
          </Tooltip>
        );
      },
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

  // Compteurs par statut (sur les items chargés)
  const countByStatus = (status: string) => items.filter(l => l.status === status).length;
  const totalLeads = pagination.totalElements;
  const hotLeads = items.filter(l => l.rating === 'hot').length;

  // Couleur hex pour chaque statut
  const statusHexColor: Record<string, string> = {
    blue: '#1890ff', cyan: '#13c2c2', green: '#52c41a',
    red: '#ff4d4f', purple: '#722ed1', gold: '#faad14',
  };

  // Définition des tabs
  const tabItems = [
    {
      key: 'all',
      label: (
        <Space size={6}>
          <FunnelPlotOutlined />
          <span>Toutes</span>
          <Badge count={totalLeads} showZero style={{ backgroundColor: '#8c8c8c' }} overflowCount={9999} />
        </Space>
      ),
    },
    ...LEAD_STATUSES.map((s: StatusItem) => {
      const cnt = activeTab === s.value ? totalLeads : countByStatus(s.value);
      const bgColor = activeTab === s.value ? (statusHexColor[s.color] || '#1890ff') : '#d9d9d9';
      const textColor = activeTab === s.value ? '#fff' : '#595959';
      return {
        key: s.value,
        label: (
          <Space size={6}>
            <Tag color={s.color} style={{ margin: 0, fontSize: 11 }}>{s.label}</Tag>
            <Badge count={cnt} showZero style={{ backgroundColor: bgColor, color: textColor }} overflowCount={999} />
          </Space>
        ),
      };
    }),
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Pistes</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span style={{ color: '#ff4d4f' }}><FireOutlined style={{ marginRight: 4 }} /><strong>{hotLeads}</strong> <Text type="secondary">chaudes</Text></span>
          </Space>
        </Space>
        <Space>
          <ExportButton entity="leads" entityLabel="Pistes" size="small" />
          <Button size="small" onClick={() => setImportModalOpen(true)}>Importer</Button>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouvelle piste
          </Button>
        </Space>
      </div>

      {/* ── Card avec Tabs ── */}
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          style={{ paddingLeft: 16, paddingRight: 16 }}
          tabBarExtraContent={
            <Space style={{ paddingBottom: 4 }}>
              <Search
                placeholder="Rechercher..."
                allowClear
                size="small"
                onSearch={handleSearch}
                style={{ width: 220 }}
              />
              <Button size="small" icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
                Filtres
              </Button>
              <Button size="small" icon={<ReloadOutlined />} onClick={loadLeads} />
            </Space>
          }
        />

        <div style={{ padding: '0 16px 16px' }}>
          {showFilters && (
            <Row gutter={12} style={{ marginBottom: 12 }}>
              <Col span={6}>
                <Select
                  placeholder="Source"
                  allowClear
                  style={{ width: '100%' }}
                  options={LEAD_SOURCES.map((s) => ({ value: s.value, label: s.label }))}
                  onChange={(value) => dispatch(setFilters({ source: value, page: 0 }))}
                  value={filters.source}
                  size="small"
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Note"
                  allowClear
                  style={{ width: '100%' }}
                  options={LEAD_RATINGS.map((r) => ({ value: r.value, label: r.label }))}
                  size="small"
                />
              </Col>
              <Col>
                <Button size="small" onClick={() => { dispatch(clearFilters()); setActiveTab('all'); }}>
                  Réinitialiser
                </Button>
              </Col>
            </Row>
          )}

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
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} piste${total > 1 ? 's' : ''}`,
            }}
            scroll={{ x: 1600, y: 'calc(100vh - 340px)' }}
          />
        </div>
      </Card>

      <LeadFormModal
        open={modalOpen}
        leadId={editingLead}
        onClose={handleModalClose}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadLeads}
        entity="leads"
        entityLabel="Pistes"
        expectedColumns={[
          { key: 'firstName', label: 'Prénom' },
          { key: 'lastName', label: 'Nom' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Téléphone' },
          { key: 'company', label: 'Société' },
          { key: 'source', label: 'Source' },
        ]}
      />

      <Modal
        open={!!convertingLead}
        title={`Convertir la piste — ${convertingLead?.fullName}`}
        onCancel={() => { setConvertingLead(null); convertForm.resetFields(); }}
        onOk={handleConvertSubmit}
        okText="Convertir"
        cancelText="Annuler"
        confirmLoading={convertLoading}
        width={520}
      >
        <Form form={convertForm} layout="vertical" size="small">
          <Divider orientation="left" plain style={{ fontSize: 13 }}>Compte</Divider>
          <Form.Item name="createAccount" valuePropName="checked" initialValue={true}>
            <Checkbox>Créer un compte</Checkbox>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.createAccount !== c.createAccount}>
            {({ getFieldValue }) => getFieldValue('createAccount') && (
              <Row gutter={8}>
                <Col span={14}>
                  <Form.Item name="accountName" label="Nom du compte" rules={[{ required: true, message: 'Obligatoire' }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item name="accountType" label="Type">
                    <Select options={[
                      { value: 'prospect', label: 'Prospect' },
                      { value: 'client', label: 'Client' },
                      { value: 'partenaire', label: 'Partenaire' },
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form.Item>

          <Divider orientation="left" plain style={{ fontSize: 13 }}>Contact</Divider>
          <Form.Item name="createContact" valuePropName="checked" initialValue={true}>
            <Checkbox>Créer un contact</Checkbox>
          </Form.Item>

          <Divider orientation="left" plain style={{ fontSize: 13 }}>Opportunité</Divider>
          <Form.Item name="createOpportunity" valuePropName="checked" initialValue={false}>
            <Checkbox onChange={(e) => setCreateOpportunity(e.target.checked)}>Créer une opportunité</Checkbox>
          </Form.Item>
          {createOpportunity && (
            <>
              <Form.Item name="opportunityName" label="Nom de l'opportunité" rules={[{ required: true, message: 'Obligatoire' }]}>
                <Input />
              </Form.Item>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="opportunityAmount" label="Montant">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="opportunityStageId" label="Étape">
                    <Select
                      options={stages.map(s => ({ value: s.id, label: s.name }))}
                      placeholder="Sélectionner"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="closeDate" label="Date de clôture">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default LeadsListPage;
