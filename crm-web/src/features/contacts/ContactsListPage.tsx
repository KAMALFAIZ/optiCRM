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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchContacts, deleteContact, setFilters, clearFilters } from './contactsSlice';
import { ContactListItem, CONTACT_STATUSES } from '@/types/contact';
import type { ColumnsType } from 'antd/es/table';

interface StatusItem {
  value: string;
  label: string;
  color: string;
}
import type { MenuProps } from 'antd';
import ContactFormModal from './ContactFormModal';
import ExportButton from '@/components/ExportButton';
import ImportModal from '@/components/ImportModal';

const { Text } = Typography;
const { Search } = Input;

const ContactsListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters } = useAppSelector((state) => state.contacts);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const loadContacts = useCallback(() => {
    dispatch(fetchContacts(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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
      title: 'Supprimer le contact',
      content: 'Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteContact(id)).unwrap();
          message.success('Contact supprimé avec succès');
          loadContacts();
        } catch (error) {
          message.error('Erreur lors de la suppression du contact');
        }
      },
    });
  };

  const handleEdit = (id: string) => {
    setEditingContact(id);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setEditingContact(null);
    if (refresh) {
      loadContacts();
    }
  };

  const getActionItems = (record: ContactListItem): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Voir les détails',
      onClick: () => navigate(`/contacts/${record.id}`),
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

  const columns: ColumnsType<ContactListItem> = [
    {
      title: 'Nom',
      key: 'name',
      width: 180,
      sorter: true,
      ellipsis: { showTitle: false },
      render: (_, record) => (
        <Tooltip title={`${record.firstName} ${record.lastName}`} placement="topLeft">
          <a onClick={() => navigate(`/contacts/${record.id}`)}>
            <UserOutlined className="mr-2" />{record.firstName} {record.lastName}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Fonction',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 140,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Compte',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 160,
      ellipsis: { showTitle: false },
      render: (value, record) => value ? (
        <Tooltip title={value} placement="topLeft">
          <a onClick={() => navigate(`/accounts/${record.accountId}`)}>{value}</a>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 190,
      ellipsis: { showTitle: false },
      render: (value) => value ? (
        <Tooltip title={value} placement="topLeft">
          <a href={`mailto:${value}`}><MailOutlined /> {value}</a>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Téléphone',
      dataIndex: 'phoneOffice',
      key: 'phoneOffice',
      width: 150,
      ellipsis: { showTitle: false },
      render: (value) => value ? (
        <Tooltip title={value} placement="topLeft">
          <a href={`tel:${value}`}><PhoneOutlined /> {value}</a>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Ville',
      dataIndex: 'addressCity',
      key: 'addressCity',
      width: 130,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Rôle',
      dataIndex: 'contactRole',
      key: 'contactRole',
      width: 150,
      render: (role: string) => {
        if (!role) return '-';
        const roleColors: Record<string, string> = {
          'decision_maker': 'red',
          'buyer':          'orange',
          'influencer':     'blue',
          'technical':      'cyan',
          'billing':        'purple',
          'director':       'gold',
          'user':           'green',
        };
        const roleLabels: Record<string, string> = {
          'decision_maker': 'Décideur',
          'buyer':          'Acheteur',
          'influencer':     'Prescripteur',
          'technical':      'Tech.',
          'billing':        'Facturation',
          'director':       'Directeur',
          'user':           'Utilisateur',
        };
        return <Tag color={roleColors[role] || 'default'}>{roleLabels[role] || role}</Tag>;
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

  const totalContacts = pagination.totalElements;

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Contacts</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><UserOutlined style={{ marginRight: 4 }} /><strong>{totalContacts}</strong> <Text type="secondary">total</Text></span>
          </Space>
        </Space>
        <Space>
          <ExportButton entity="contacts" entityLabel="Contacts" size="small" />
          <Button size="small" onClick={() => setImportModalOpen(true)}>Importer</Button>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouveau contact
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
                placeholder="Rechercher un contact..."
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
                <Button size="small" icon={<ReloadOutlined />} onClick={loadContacts}>Actualiser</Button>
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
                options={CONTACT_STATUSES.map((s: StatusItem) => ({ value: s.value, label: s.label }))}
                onChange={(value) => dispatch(setFilters({ status: value, page: 0 }))}
                value={filters.status}
              />
            </Col>
            <Col>
              <Button onClick={() => dispatch(clearFilters())}>Réinitialiser</Button>
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
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} contacts`,
          }}
          scroll={{ x: 1320, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <ContactFormModal
        open={modalOpen}
        contactId={editingContact}
        onClose={handleModalClose}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadContacts}
        entity="contacts"
        entityLabel="Contacts"
        expectedColumns={[
          { key: 'firstName', label: 'Prénom' },
          { key: 'lastName', label: 'Nom' },
          { key: 'email', label: 'Email' },
          { key: 'phoneOffice', label: 'Téléphone fixe' },
          { key: 'phoneMobile', label: 'Mobile' },
          { key: 'jobTitle', label: 'Fonction' },
          { key: 'accountName', label: 'Compte' },
        ]}
      />
    </div>
  );
};

export default ContactsListPage;
