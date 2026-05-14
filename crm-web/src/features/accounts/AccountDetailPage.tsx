import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Spin,
  Modal,
  Result,
  message,
  Avatar,
  Statistic,
  Table,
  Empty,
  Upload,
  Image,
  Popconfirm,
  Progress,
  Alert,
} from 'antd';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  GlobalOutlined,
  BankOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  BuildOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  PlusOutlined,
  CameraOutlined,
  PictureOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import { analyzeAccount, accountSummary360 } from '@/api/ai';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAccountById, fetchAccountStats, deleteAccount, clearSelectedAccount, patchSelectedAccount } from './accountsSlice';
import { ACCOUNT_TYPES, AccountPhoto } from '@/types/account';
import accountsApi from '@/api/accounts';
import AccountFormModal from './AccountFormModal';
import HealthScoreWidget from './HealthScoreWidget';
import { LocationMap, GpsLocationPicker } from '@/components/maps';
import type { GpsCoordinates } from '@/components/maps';
import AccountTimeline from './AccountTimeline';
import contactsApi from '@/api/contacts';
import { ContactListItem } from '@/types/contact';
import { chantiersApi, ChantierListItem } from '@/api/chantiers';
import ChantierFormModal from '../chantiers/ChantierFormModal';
import { invoicesApi } from '@/api/invoices';
import { salesOrdersApi } from '@/api/salesOrders';
import { paymentsApi } from '@/api/payments';
import type { InvoiceListItem } from '@/types/invoice';
import type { SalesOrderListItem } from '@/types/salesOrder';
import type { PaymentListItem } from '@/types/payment';
import { customFieldsApi, type CustomFieldValue } from '@/api/customFields';

const { Title, Text } = Typography;

interface TypeItem {
  value: string;
  label: string;
  color: string;
}

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedAccount: account, accountStats, loading, error } = useAppSelector((state) => state.accounts);

  const [modalOpen, setModalOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [orders, setOrders] = useState<SalesOrderListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [photos, setPhotos] = useState<AccountPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [chantiers, setChantiers] = useState<ChantierListItem[]>([]);
  const [loadingChantiers, setLoadingChantiers] = useState(false);
  const [chantierModalOpen, setChantierModalOpen] = useState(false);
  const [editingChantierId, setEditingChantierId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [ai360, setAi360] = useState<string | null>(null);
  const [ai360Loading, setAi360Loading] = useState(false);
  const [savingGps, setSavingGps] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue[]>([]);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [editingCustomFields, setEditingCustomFields] = useState(false);
  const [customFieldDraft, setCustomFieldDraft] = useState<Record<string, string | null>>({});
  const [savingCustomFields, setSavingCustomFields] = useState(false);

  const handleGpsCapture = async (coords: GpsCoordinates | undefined) => {
    if (!id) return;
    setSavingGps(true);
    try {
      await accountsApi.update(id, { latitude: coords?.latitude, longitude: coords?.longitude });
      dispatch(patchSelectedAccount({ latitude: coords?.latitude, longitude: coords?.longitude }));
      message.success(coords ? 'Position GPS enregistrée' : 'Position GPS effacée');
    } catch {
      message.error('Erreur lors de la sauvegarde GPS');
    } finally {
      setSavingGps(false);
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchAccountById(id));
      dispatch(fetchAccountStats(id));
      loadContacts(id);
      loadInvoices(id);
      loadOrders(id);
      loadPayments(id);
      loadChantiers(id);
      loadCustomFields(id);
    }
    return () => {
      dispatch(clearSelectedAccount());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (account?.photos) {
      setPhotos(account.photos);
    }
  }, [account?.photos]);

  const handleAiAnalysis = async () => {
    if (!account) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeAccount({
        accountName: account.name,
        industry: account.industry?.name ?? undefined,
        city: account.billingCity ?? undefined,
        revenueCurrentYear: accountStats?.caCurrentYear ?? undefined,
        pipelineValue: accountStats?.openPipeline ?? undefined,
        overdueAmount: accountStats?.overdueAmount ?? undefined,
        contactCount: accountStats?.totalContacts ?? undefined,
      });
      setAiAnalysis(result);
    } catch {
      message.error('Erreur lors de l\'analyse IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAi360 = async () => {
    if (!id) return;
    setAi360Loading(true);
    setAi360(null);
    try {
      const result = await accountSummary360({ accountId: id });
      setAi360(result);
    } catch {
      message.error('Erreur lors de la génération du résumé 360');
    } finally {
      setAi360Loading(false);
    }
  };

  const loadContacts = async (accountId: string) => {
    setLoadingContacts(true);
    try {
      const data = await contactsApi.getByAccount(accountId);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadInvoices = async (accountId: string) => {
    setLoadingInvoices(true);
    try {
      const response = await invoicesApi.getByAccount(accountId);
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadPayments = async (accountId: string) => {
    setLoadingPayments(true);
    try {
      const response = await paymentsApi.getByAccount(accountId);
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadOrders = async (accountId: string) => {
    setLoadingOrders(true);
    try {
      const response = await salesOrdersApi.getByAccount(accountId);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadChantiers = async (accountId: string) => {
    setLoadingChantiers(true);
    try {
      const data = await chantiersApi.getByAccount(accountId);
      setChantiers(data);
    } catch (error) {
      console.error('Error loading chantiers:', error);
    } finally {
      setLoadingChantiers(false);
    }
  };

  const loadCustomFields = async (accountId: string) => {
    setLoadingCustomFields(true);
    try {
      const data = await customFieldsApi.getAccountValues(accountId);
      setCustomFieldValues(data);
    } catch {
      // ignore — custom fields are optional
    } finally {
      setLoadingCustomFields(false);
    }
  };

  const startEditCustomFields = () => {
    const draft: Record<string, string | null> = {};
    customFieldValues.forEach((f) => { draft[f.fieldId] = f.value; });
    setCustomFieldDraft(draft);
    setEditingCustomFields(true);
  };

  const cancelEditCustomFields = () => {
    setEditingCustomFields(false);
    setCustomFieldDraft({});
  };

  const saveCustomFields = async () => {
    if (!id) return;
    setSavingCustomFields(true);
    try {
      const updated = await customFieldsApi.saveAccountValues(id, customFieldDraft);
      setCustomFieldValues(updated);
      setEditingCustomFields(false);
      message.success('Informations libres enregistrées');
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingCustomFields(false);
    }
  };

  const handleChantierModalClose = (refresh?: boolean) => {
    setChantierModalOpen(false);
    setEditingChantierId(null);
    if (refresh && id) loadChantiers(id);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Supprimer le compte',
      content: 'Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteAccount(id!)).unwrap();
          message.success('Compte supprimé avec succès');
          navigate('/accounts');
        } catch (error) {
          message.error('Erreur lors de la suppression du compte');
        }
      },
    });
  };

  const getTypeColor = (type: string) => {
    const typeObj = ACCOUNT_TYPES.find((t: TypeItem) => t.value === type);
    return typeObj?.color || 'default';
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    if (refresh && id) {
      dispatch(fetchAccountById(id));
      dispatch(fetchAccountStats(id));
    }
  };

  const handlePhotoUpload = async (options: UploadRequestOption) => {
    if (!id) return;
    setUploadingPhoto(true);
    try {
      const photo = await accountsApi.uploadPhoto(id, options.file as File);
      setPhotos(prev => [...prev, photo]);
      message.success('Photo ajoutée avec succès');
      options.onSuccess?.({});
    } catch (error: any) {
      message.error(error.message || 'Erreur lors de l\'upload');
      options.onError?.(error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogoUpload = async (options: UploadRequestOption) => {
    if (!id) return;
    setUploadingLogo(true);
    try {
      await accountsApi.uploadLogo(id, options.file as File);
      dispatch(fetchAccountById(id));
      message.success('Logo mis à jour');
      options.onSuccess?.({});
    } catch (error: any) {
      message.error(error.message || 'Erreur lors de l\'upload du logo');
      options.onError?.(error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!id) return;
    try {
      await accountsApi.deletePhoto(id, photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      message.success('Photo supprimée');
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  if (loading && !account) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!account) {
    return (
      <Result
        status="404"
        title="Compte introuvable"
        subTitle={error || "Ce compte n'existe pas ou vous n'avez pas accès."}
        extra={
          <Button type="primary" onClick={() => navigate('/accounts')}>
            Retour aux comptes
          </Button>
        }
      />
    );
  }

  const contactColumns = [
    {
      title: 'Nom',
      key: 'name',
      render: (_: any, record: ContactListItem) => (
        <a onClick={() => navigate(`/contacts/${record.id}`)}>
          {record.firstName} {record.lastName}
        </a>
      ),
    },
    {
      title: 'Fonction',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
    },
  ];

  const invoiceColumns = [
    {
      title: 'N° Facture',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; label: string }> = {
          DRAFT: { color: 'default', label: 'Brouillon' },
          SENT: { color: 'blue', label: 'Envoyée' },
          PAID: { color: 'green', label: 'Payée' },
          PARTIALLY_PAID: { color: 'orange', label: 'Partiel' },
          OVERDUE: { color: 'red', label: 'En retard' },
          CANCELLED: { color: 'default', label: 'Annulée' },
        };
        const cfg = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
    },
    {
      title: 'Échéance',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string, record: InvoiceListItem) => (
        <span style={{ color: record.overdue ? '#ff4d4f' : undefined }}>
          {date} {record.overdue && <WarningOutlined />}
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Reste dû',
      dataIndex: 'amountDue',
      key: 'amountDue',
      align: 'right' as const,
      render: (val: number) => (
        <Text type={val > 0 ? 'danger' : 'success'}>{formatCurrency(val)}</Text>
      ),
    },
  ];

  const orderColumns = [
    {
      title: 'N° Commande',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; label: string }> = {
          DRAFT: { color: 'default', label: 'Brouillon' },
          CONFIRMED: { color: 'blue', label: 'Confirmée' },
          SHIPPED: { color: 'orange', label: 'Expédiée' },
          DELIVERED: { color: 'green', label: 'Livrée' },
          CANCELLED: { color: 'default', label: 'Annulée' },
        };
        const cfg = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
  ];

  // Compute CA variation
  const caVariation = accountStats?.caPreviousYear && accountStats.caPreviousYear > 0
    ? ((accountStats.caCurrentYear - accountStats.caPreviousYear) / accountStats.caPreviousYear * 100)
    : null;

  const tabItems = [
    {
      key: 'details',
      label: 'Détails',
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Informations générales" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Nom commercial">{account.name}</Descriptions.Item>
                <Descriptions.Item label="Raison sociale">{account.legalName || '-'}</Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color={getTypeColor(account.accountType)}>{account.accountType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Secteur d'activité">{account.industry?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Catégorie client">
                  {account.segment ? (
                    <Tag color={
                      account.segment === 'REVENDEUR' ? 'green' :
                      account.segment === 'CHANTIER' ? 'orange' :
                      account.segment === 'EXPORT' ? 'blue' :
                      account.segment === 'SHOWROOM' ? 'purple' :
                      account.segment === 'GROSSISTE' ? 'cyan' :
                      account.segment === 'PROMOTEUR' ? 'gold' : 'default'
                    }>{account.segment}</Tag>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Catégorie tarifaire">
                  {account.pricingCategory ? (
                    <Space size={4}>
                      <Tag color="purple">{account.pricingCategory.code}</Tag>
                      <span>{account.pricingCategory.name}</span>
                      {account.pricingCategory.isDefault && <Tag color="gold">Défaut</Tag>}
                    </Space>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone">
                  {account.phone ? (
                    <a href={`tel:${account.phone}`}>
                      <PhoneOutlined style={{ color: '#1890ff' }} /> {account.phone}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="WhatsApp">
                  {account.whatsapp ? (
                    <a
                      href={`https://wa.me/${account.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppOutlined style={{ color: '#25D366' }} /> {account.whatsapp}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Site web">
                  {account.website ? (
                    <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noopener noreferrer">
                      <GlobalOutlined /> {account.website}
                    </a>
                  ) : '-'}
                </Descriptions.Item>
                {/* Champ Société mère masqué */}
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Identification légale (Maroc)" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="ICE">
                  {account.ice ? <Tag color="blue">{account.ice}</Tag> : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="IF (Identifiant Fiscal)">{account.identifiantFiscal || '-'}</Descriptions.Item>
                <Descriptions.Item label="RC">{account.rc || '-'}</Descriptions.Item>
                <Descriptions.Item label="CNSS">{account.cnss || '-'}</Descriptions.Item>
                <Descriptions.Item label="Patente">{account.patente || '-'}</Descriptions.Item>
                <Descriptions.Item label="N° TVA">{account.vatNumber || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="Données financières" size="small" className="mt-4">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="CA annuel">{formatCurrency(account.annualRevenue)}</Descriptions.Item>
                <Descriptions.Item label="Effectif">{account.employeeCount || '-'}</Descriptions.Item>
                <Descriptions.Item label="Limite de crédit">{formatCurrency(account.creditLimit)}</Descriptions.Item>
              </Descriptions>
            </Card>
            {(account.secteurActivite || account.categorieClient || account.categorieTarifaire ||
              account.typeCompteOdyssee || account.prefecture || account.statutCompte || account.representant) && (
              <Card title="Classification Sage 100C" size="small" className="mt-4">
                <Descriptions column={1} size="small">
                  {account.categorieClient && (
                    <Descriptions.Item label="Catégorie client">
                      <Tag color="blue">{account.categorieClient}</Tag>
                    </Descriptions.Item>
                  )}
                  {account.secteurActivite && (
                    <Descriptions.Item label="Secteur d'activité">
                      <Tag color="geekblue">{account.secteurActivite}</Tag>
                    </Descriptions.Item>
                  )}
                  {account.categorieTarifaire && (
                    <Descriptions.Item label="Catégorie tarifaire">
                      <Tag color="cyan">{account.categorieTarifaire}</Tag>
                    </Descriptions.Item>
                  )}
                  {account.typeCompteOdyssee && (
                    <Descriptions.Item label="Type de compte ODYSSÉE">
                      <Tag color="purple">{account.typeCompteOdyssee}</Tag>
                    </Descriptions.Item>
                  )}
                  {account.prefecture && (
                    <Descriptions.Item label="Préfecture">{account.prefecture}</Descriptions.Item>
                  )}
                  {account.statutCompte && (
                    <Descriptions.Item label="Statut du compte">
                      <Tag color={account.statutCompte === 'ACTIF' ? 'green' : account.statutCompte === 'INACTIF' ? 'red' : 'orange'}>
                        {account.statutCompte}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  {account.representant && (
                    <Descriptions.Item label="Représentant">{account.representant}</Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </Col>
          <Col span={12} className="mt-4">
            <Card title="Adresse de facturation" size="small">
              {account.fullBillingAddress || (
                <>
                  {account.billingStreet && <div>{account.billingStreet}</div>}
                  {(account.billingPostalCode || account.billingCity) && (
                    <div>{account.billingPostalCode} {account.billingCity}</div>
                  )}
                  {account.billingCountry && <div>{account.billingCountry}</div>}
                  {!account.billingStreet && !account.billingCity && '-'}
                </>
              )}
            </Card>
          </Col>
          <Col span={12} className="mt-4">
            <Card title="Adresse de livraison" size="small">
              {account.shippingStreet && <div>{account.shippingStreet}</div>}
              {(account.shippingPostalCode || account.shippingCity) && (
                <div>{account.shippingPostalCode} {account.shippingCity}</div>
              )}
              {account.shippingCountry && <div>{account.shippingCountry}</div>}
              {!account.shippingStreet && !account.shippingCity && '-'}
            </Card>
          </Col>
          {/* ── Informations libres ── */}
          {customFieldValues.length > 0 && (
            <Col span={24} className="mt-4">
              <Card
                title="Informations libres"
                size="small"
                loading={loadingCustomFields}
                extra={
                  editingCustomFields ? (
                    <Space size={4}>
                      <Button size="small" type="primary" onClick={saveCustomFields} loading={savingCustomFields}
                        style={{ background: '#405189', borderColor: '#405189' }}>
                        Enregistrer
                      </Button>
                      <Button size="small" onClick={cancelEditCustomFields}>Annuler</Button>
                    </Space>
                  ) : (
                    <Button size="small" icon={<EditOutlined />} onClick={startEditCustomFields}>
                      Modifier
                    </Button>
                  )
                }
              >
                <Descriptions column={2} size="small" bordered>
                  {customFieldValues.map((field) => (
                    <Descriptions.Item key={field.fieldId} label={field.fieldName}>
                      {editingCustomFields ? (
                        field.fieldType === 'BOOLEAN' ? (
                          <select
                            value={customFieldDraft[field.fieldId] ?? ''}
                            onChange={(e) => setCustomFieldDraft(prev => ({ ...prev, [field.fieldId]: e.target.value }))}
                            style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
                          >
                            <option value="">-</option>
                            <option value="true">Oui</option>
                            <option value="false">Non</option>
                          </select>
                        ) : field.fieldType === 'SELECT' ? (
                          <select
                            value={customFieldDraft[field.fieldId] ?? ''}
                            onChange={(e) => setCustomFieldDraft(prev => ({ ...prev, [field.fieldId]: e.target.value }))}
                            style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
                          >
                            <option value="">-</option>
                            {/* Options loaded from field def would go here — for now show value */}
                          </select>
                        ) : (
                          <input
                            type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : 'text'}
                            value={customFieldDraft[field.fieldId] ?? ''}
                            onChange={(e) => setCustomFieldDraft(prev => ({ ...prev, [field.fieldId]: e.target.value }))}
                            style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
                          />
                        )
                      ) : (
                        field.fieldType === 'BOOLEAN'
                          ? (field.value === 'true'
                              ? <CheckSquareOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                              : <BorderOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />)
                          : (field.value || <Text type="secondary">-</Text>)
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            </Col>
          )}

          <Col span={24} className="mt-4">
            <HealthScoreWidget accountId={id!} initialScore={account.accountScore} />
          </Col>
          <Col span={24} className="mt-4">
            <Card
              title={<><EnvironmentOutlined className="mr-2 text-blue-500" />Localisation GPS</>}
              size="small"
              extra={
                <GpsLocationPicker
                  compact
                  value={account.latitude && account.longitude ? { latitude: account.latitude, longitude: account.longitude } : undefined}
                  onChange={handleGpsCapture}
                />
              }
              loading={savingGps}
            >
              {account.latitude && account.longitude ? (
                <LocationMap
                  height="300px"
                  center={[account.latitude, account.longitude]}
                  zoom={15}
                  markers={[{
                    lat: account.latitude,
                    lng: account.longitude,
                    label: account.name,
                    color: 'blue',
                    popup: `<strong>${account.name}</strong><br/>${account.fullBillingAddress || account.billingCity || ''}`,
                  }]}
                />
              ) : (
                <div
                  style={{
                    height: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#bfbfbf',
                    border: '2px dashed #f0f0f0',
                    borderRadius: 8,
                    gap: 12,
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 32 }} />
                  <GpsLocationPicker onChange={handleGpsCapture} />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'contacts',
      label: `Contacts (${contacts.length})`,
      children: (
        <Card>
          <div className="flex justify-between mb-4">
            <Title level={5} className="!mb-0">Contacts associés</Title>
            <Button type="primary" onClick={() => navigate('/contacts?accountId=' + id)}>
              Ajouter un contact
            </Button>
          </div>
          <Table
            columns={contactColumns}
            dataSource={contacts}
            rowKey="id"
            loading={loadingContacts}
            pagination={false}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'situation',
      label: (
        <span>
          <SafetyOutlined className="mr-1" />
          Situation Client
        </span>
      ),
      children: (() => {
        // Compute encours = sum of outstanding invoice amounts
        const encours = invoices
          .filter(inv => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
        const creditLimit = account.creditLimit || 0;
        const insuranceAmount = account.insuranceAmount || 0;
        const overdueAmount = accountStats?.overdueAmount || 0;
        const totalPaid = accountStats?.totalPaid || 0;
        const utilisationPct = creditLimit > 0 ? Math.min(Math.round((encours / creditLimit) * 100), 100) : null;
        const couverturePct = encours > 0 && insuranceAmount > 0
          ? Math.min(Math.round((insuranceAmount / encours) * 100), 100)
          : null;
        const isOverLimit = creditLimit > 0 && encours > creditLimit;

        const paymentMethodLabel: Record<string, string> = {
          BANK_TRANSFER: 'Virement',
          CHECK: 'Chèque',
          CASH: 'Espèces',
          CREDIT_CARD: 'Carte bancaire',
          DEBIT_CARD: 'Carte de débit',
          OTHER: 'Autre',
        };
        const paymentStatusConfig: Record<string, { color: string; label: string }> = {
          PENDING: { color: 'blue', label: 'En attente' },
          ALLOCATED: { color: 'green', label: 'Alloué' },
          PARTIALLY_ALLOCATED: { color: 'orange', label: 'Part. alloué' },
          CANCELLED: { color: 'default', label: 'Annulé' },
        };

        const paymentColumns = [
          {
            title: 'N° Règlement',
            dataIndex: 'paymentNumber',
            key: 'paymentNumber',
            render: (v: string) => <Text strong>{v}</Text>,
          },
          {
            title: 'Date',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
          },
          {
            title: 'Mode',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (v: string) => paymentMethodLabel[v] || v,
          },
          {
            title: 'Référence',
            dataIndex: 'reference',
            key: 'reference',
            render: (v: string) => v || '-',
          },
          {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (v: string) => {
              const cfg = paymentStatusConfig[v] || { color: 'default', label: v };
              return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
          },
          {
            title: 'Montant',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right' as const,
            render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>,
          },
          {
            title: 'Non alloué',
            dataIndex: 'unallocatedAmount',
            key: 'unallocatedAmount',
            align: 'right' as const,
            render: (v: number) => (
              <Text type={v > 0 ? 'warning' : 'secondary'}>{formatCurrency(v)}</Text>
            ),
          },
        ];

        const cardBody = { padding: '8px 12px' };
        const valStyle = (color?: string): React.CSSProperties => ({ fontSize: 15, fontWeight: 700, color });

        return (
          <div>
            {/* Cartes compactes — une seule ligne */}
            <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
              <Col xs={12} sm={8} lg={24/7 as unknown as number} style={{ flex: '0 0 14.28%', maxWidth: '14.28%' }}>
                <Card size="small" styles={{ body: cardBody }} style={{ borderLeft: `4px solid ${isOverLimit ? '#ff4d4f' : '#1890ff'}` }}>
                  <Statistic
                    title={<span style={{ fontSize: 11 }}>Encours actuel</span>}
                    value={encours}
                    formatter={(v) => formatCurrency(v as number)}
                    valueStyle={valStyle(isOverLimit ? '#ff4d4f' : undefined)}
                    prefix={isOverLimit ? <ExclamationCircleOutlined style={{ fontSize: 12 }} /> : undefined}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} style={{ flex: '0 0 14.28%', maxWidth: '14.28%' }}>
                <Card size="small" styles={{ body: cardBody }} style={{ borderLeft: '4px solid #722ed1' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11 }}>Limite de crédit</span>}
                    value={creditLimit}
                    formatter={(v) => creditLimit > 0 ? formatCurrency(v as number) : 'Non définie'}
                    valueStyle={valStyle()}
                  />
                  {utilisationPct !== null && (
                    <Progress percent={utilisationPct} size="small" showInfo={false}
                      status={utilisationPct >= 100 ? 'exception' : utilisationPct >= 80 ? 'active' : 'normal'}
                      style={{ marginTop: 4 }}
                    />
                  )}
                </Card>
              </Col>
              <Col xs={12} sm={8} style={{ flex: '0 0 14.28%', maxWidth: '14.28%' }}>
                <Card size="small" styles={{ body: cardBody }} style={{ borderLeft: `4px solid ${overdueAmount > 0 ? '#ff4d4f' : '#52c41a'}` }}>
                  <Statistic
                    title={<span style={{ fontSize: 11 }}>Impayé / retard</span>}
                    value={overdueAmount}
                    formatter={(v) => formatCurrency(v as number)}
                    valueStyle={valStyle(overdueAmount > 0 ? '#ff4d4f' : '#52c41a')}
                    prefix={overdueAmount > 0 ? <ExclamationCircleOutlined style={{ fontSize: 12 }} /> : <CheckCircleOutlined style={{ fontSize: 12 }} />}
                  />
                  {accountStats && accountStats.overdueInvoices > 0 && (
                    <Tag color="red" style={{ fontSize: 10, marginTop: 2 }}>{accountStats.overdueInvoices} en retard</Tag>
                  )}
                </Card>
              </Col>
              <Col xs={12} sm={8} style={{ flex: '0 0 14.28%', maxWidth: '14.28%' }}>
                <Card size="small" styles={{ body: cardBody }} style={{ borderLeft: '4px solid #fa8c16' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11 }}>Assurance crédit</span>}
                    value={insuranceAmount}
                    formatter={(v) => insuranceAmount > 0 ? formatCurrency(v as number) : 'Non assurée'}
                    valueStyle={valStyle()}
                  />
                  {couverturePct !== null && (
                    <Tag color="orange" style={{ fontSize: 10, marginTop: 2 }}>Couv. {couverturePct}%</Tag>
                  )}
                </Card>
              </Col>
              <Col xs={12} sm={8} style={{ flex: '0 0 14.28%', maxWidth: '14.28%' }}>
                <Card size="small" styles={{ body: cardBody }} style={{ borderLeft: '4px solid #52c41a' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11 }}>Total payé</span>}
                    value={totalPaid}
                    formatter={(v) => formatCurrency(v as number)}
                    valueStyle={valStyle('#52c41a')}
                    prefix={<CheckCircleOutlined style={{ fontSize: 12 }} />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} style={{ flex: '0 0 14.28%', maxWidth: '14.28%' }}>
                <Card size="small" styles={{ body: cardBody }} style={{ borderLeft: '4px solid #1890ff' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11 }}>Nb Factures</span>}
                    value={invoices.length}
                    valueStyle={valStyle()}
                    prefix={<ClockCircleOutlined style={{ fontSize: 12 }} />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} style={{ flex: '0 0 14.28%', maxWidth: '14.28%' }}>
                <Card size="small" styles={{ body: cardBody }} style={{ borderLeft: '4px solid #13c2c2' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11 }}>Nb Règlements</span>}
                    value={payments.length}
                    valueStyle={valStyle()}
                    prefix={<CheckCircleOutlined style={{ fontSize: 12 }} />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Risk alert */}
            {isOverLimit && (
              <Alert
                type="error"
                showIcon
                message="Dépassement de limite de crédit"
                description={`L'encours actuel (${formatCurrency(encours)}) dépasse la limite de crédit autorisée (${formatCurrency(creditLimit)}).`}
                style={{ marginBottom: 10 }}
              />
            )}

            {/* Invoices */}
            <Card
              title={`Factures (${invoices.length})`}
              size="small"
              style={{ marginBottom: 16 }}
            >
              {invoices.length === 0 ? (
                <Empty description="Aucune facture" />
              ) : (
                <Table
                  columns={invoiceColumns}
                  dataSource={invoices}
                  rowKey="id"
                  loading={loadingInvoices}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  size="small"
                  rowClassName={(r) => r.overdue ? 'ant-table-row-danger' : ''}
                  summary={(data) => {
                    const total = data.reduce((s, r) => s + (r.total || 0), 0);
                    const due = data.reduce((s, r) => s + (r.amountDue || 0), 0);
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                          <Text strong>TOTAL</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text strong>{formatCurrency(total)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <Text strong type={due > 0 ? 'danger' : 'success'}>{formatCurrency(due)}</Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              )}
            </Card>

            {/* Payments */}
            <Card title={`Règlements (${payments.length})`} size="small">
              {payments.length === 0 ? (
                <Empty description="Aucun règlement" />
              ) : (
                <Table
                  columns={paymentColumns}
                  dataSource={payments}
                  rowKey="id"
                  loading={loadingPayments}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  size="small"
                  summary={(data) => {
                    const total = data.reduce((s, r) => s + (r.amount || 0), 0);
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={5}>
                          <Text strong>TOTAL</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text strong style={{ color: '#52c41a' }}>{formatCurrency(total)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                      </Table.Summary.Row>
                    );
                  }}
                />
              )}
            </Card>
          </div>
        );
      })(),
    },
    {
      key: 'invoices',
      label: `Factures (${invoices.length})`,
      children: (
        <Card>
          <div className="flex justify-between mb-4">
            <Title level={5} className="!mb-0">Factures</Title>
            <Button type="primary" onClick={() => navigate('/invoices')}>
              Voir toutes les factures
            </Button>
          </div>
          {invoices.length === 0 ? (
            <Empty description="Aucune facture pour ce compte" />
          ) : (
            <Table
              columns={invoiceColumns}
              dataSource={invoices}
              rowKey="id"
              loading={loadingInvoices}
              pagination={false}
              size="small"
            />
          )}
        </Card>
      ),
    },
    {
      key: 'orders',
      label: `Commandes (${orders.length})`,
      children: (
        <Card>
          <div className="flex justify-between mb-4">
            <Title level={5} className="!mb-0">Commandes</Title>
            <Button type="primary" onClick={() => navigate('/orders')}>
              Voir toutes les commandes
            </Button>
          </div>
          {orders.length === 0 ? (
            <Empty description="Aucune commande pour ce compte" />
          ) : (
            <Table
              columns={orderColumns}
              dataSource={orders}
              rowKey="id"
              loading={loadingOrders}
              pagination={false}
              size="small"
            />
          )}
        </Card>
      ),
    },
    {
      key: 'chantiers',
      label: (
        <span>
          <BuildOutlined className="mr-1" />
          Chantiers ({chantiers.length})
        </span>
      ),
      children: (
        <Card>
          <div className="flex justify-between mb-4">
            <Title level={5} className="!mb-0">Chantiers liés</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingChantierId(null); setChantierModalOpen(true); }}
            >
              Nouveau chantier
            </Button>
          </div>
          {chantiers.length === 0 ? (
            <Empty description="Aucun chantier associé à ce compte" />
          ) : (
            <Table
              dataSource={chantiers}
              rowKey="id"
              loading={loadingChantiers}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Nom',
                  dataIndex: 'nom',
                  key: 'nom',
                  render: (text: string, record: ChantierListItem) => (
                    <a onClick={() => navigate(`/chantiers/${record.id}`)}>{text}</a>
                  ),
                },
                { title: 'Ville', dataIndex: 'ville', key: 'ville', render: (v: string) => v || '-' },
                { title: 'Type', dataIndex: 'typeProjet', key: 'typeProjet', render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
                {
                  title: 'Stade',
                  dataIndex: 'stadeChantier',
                  key: 'stadeChantier',
                  render: (v: string) => v ? <Tag color="blue">{v.replace(/_/g, ' ')}</Tag> : '-',
                },
                {
                  title: 'Statut',
                  dataIndex: 'statutChantier',
                  key: 'statutChantier',
                  render: (v: string) => {
                    const colorMap: Record<string, string> = { ACTIF: 'green', PRIORITAIRE: 'orange', GAGNE: 'purple', PERDU: 'red' };
                    return v ? <Tag color={colorMap[v] || 'default'}>{v}</Tag> : '-';
                  },
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_: any, record: ChantierListItem) => (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => { setEditingChantierId(record.id); setChantierModalOpen(true); }}
                    />
                  ),
                },
              ]}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'opportunities',
      label: 'Opportunités',
      children: (
        <Card>
          <Text type="secondary">Les opportunités seront affichées ici</Text>
        </Card>
      ),
    },
    {
      key: 'activities',
      label: 'Activités',
      children: (
        <Card>
          <Text type="secondary">Les activités seront affichées ici</Text>
        </Card>
      ),
    },
    {
      key: 'timeline',
      label: 'Chronologie 360°',
      children: id ? <AccountTimeline accountId={id} /> : null,
    },
    {
      key: 'gallery',
      label: (
        <span>
          <PictureOutlined className="mr-1" />
          Galerie ({photos.length})
        </span>
      ),
      children: (
        <div>
          {/* Logo section */}
          <Card size="small" title={<><CameraOutlined className="mr-2" />Logo / Photo principale</>} className="mb-4">
            <div className="flex items-center gap-6">
              {account.logoUrl ? (
                <Image
                  src={account.logoUrl}
                  alt="Logo"
                  style={{ width: 120, height: 120, objectFit: 'contain', border: '1px solid #f0f0f0', borderRadius: 8 }}
                  preview={{ mask: 'Voir' }}
                />
              ) : (
                <div style={{
                  width: 120, height: 120, border: '2px dashed #d9d9d9', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf'
                }}>
                  <BankOutlined style={{ fontSize: 40 }} />
                </div>
              )}
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleLogoUpload}
                maxCount={1}
              >
                <Button
                  icon={<CameraOutlined />}
                  loading={uploadingLogo}
                  type={account.logoUrl ? 'default' : 'primary'}
                >
                  {account.logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
                </Button>
              </Upload>
            </div>
          </Card>

          {/* Photo gallery */}
          <Card size="small" title={<><PictureOutlined className="mr-2" />Photos ({photos.length})</>}
            extra={
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handlePhotoUpload}
                multiple
              >
                <Button icon={<PlusOutlined />} type="primary" loading={uploadingPhoto}>
                  Ajouter des photos
                </Button>
              </Upload>
            }
          >
            {photos.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Aucune photo. Cliquez sur 'Ajouter des photos' pour commencer."
              />
            ) : (
              <Image.PreviewGroup>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      style={{ position: 'relative', width: 150, height: 150 }}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        style={{
                          width: 150, height: 150,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid #f0f0f0',
                        }}
                        preview={{ mask: photo.caption || 'Voir' }}
                      />
                      <Popconfirm
                        title="Supprimer cette photo ?"
                        onConfirm={() => handleDeletePhoto(photo.id)}
                        okText="Supprimer"
                        cancelText="Annuler"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            opacity: 0.85,
                          }}
                        />
                      </Popconfirm>
                      {photo.caption && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'rgba(0,0,0,0.5)', color: '#fff',
                          fontSize: 11, padding: '2px 6px',
                          borderRadius: '0 0 8px 8px',
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Upload zone at the end */}
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    customRequest={handlePhotoUpload}
                    multiple
                  >
                    <div style={{
                      width: 150, height: 150,
                      border: '2px dashed #d9d9d9', borderRadius: 8,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#bfbfbf',
                      transition: 'border-color 0.3s',
                    }}
                    className="hover:border-blue-400 hover:text-blue-400"
                    >
                      <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                      <span style={{ fontSize: 12 }}>Ajouter</span>
                    </div>
                  </Upload>
                </div>
              </Image.PreviewGroup>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'ai360',
      label: (
        <span>
          <RobotOutlined className="mr-1" style={{ color: '#7c3aed' }} />
          Résumé IA 360
        </span>
      ),
      children: (
        <Card
          size="small"
          style={{ borderColor: '#e9d5ff' }}
          title={
            <Space>
              <RobotOutlined style={{ color: '#7c3aed' }} />
              <Text strong>Résumé exécutif 360° — {account.name}</Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={ai360Loading}
              onClick={handleAi360}
              style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
            >
              {ai360 ? 'Régénérer' : 'Générer le résumé 360'}
            </Button>
          }
        >
          {ai360Loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#7c3aed' }}>
              <Spin size="large" />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Analyse complète en cours (contacts, opportunités, activités, tickets)...</Text>
              </div>
            </div>
          )}
          {!ai360Loading && ai360 && (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7 }}>{ai360}</div>
          )}
          {!ai360Loading && !ai360 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RobotOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Cliquez sur "Générer le résumé 360" pour obtenir un brief complet de ce compte :
                </Text>
              </div>
              <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13 }}>
                Résumé exécutif · Contacts clés · Pipeline · Activités récentes · Tickets ouverts · Actions prioritaires
              </div>
            </div>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div className="px-6 pb-6 pt-2">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/accounts')}
        className="!pl-0 mb-4"
      >
        Retour à la liste
      </Button>

      <Card styles={{ body: { padding: '14px 20px' } }}>
        {/* ── En-tête compact ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {account.logoUrl ? (
            <Avatar size={56} src={account.logoUrl} style={{ border: '2px solid #f0f0f0', flexShrink: 0 }} />
          ) : (
            <Avatar size={56} icon={<BankOutlined />} style={{ background: '#7c3aed', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>{account.name}</Title>
              <Tag color={getTypeColor(account.accountType)} style={{ margin: 0 }}>{account.accountType}</Tag>
              {account.segment && (
                <Tag style={{ margin: 0 }} color={
                  account.segment === 'REVENDEUR' ? 'green' : account.segment === 'CHANTIER' ? 'orange' :
                  account.segment === 'EXPORT' ? 'blue' : account.segment === 'SHOWROOM' ? 'purple' :
                  account.segment === 'GROSSISTE' ? 'cyan' : account.segment === 'PROMOTEUR' ? 'gold' : 'default'
                }>{account.segment}</Tag>
              )}
            </div>
            <div style={{ marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {account.industry && <Text type="secondary" style={{ fontSize: 12 }}>{account.industry.name}</Text>}
              {(account.billingCity || account.billingCountry) && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined style={{ marginRight: 3 }} />
                  {account.billingCity}{account.billingCountry ? `, ${account.billingCountry}` : ''}
                </Text>
              )}
            </div>
          </div>
          <Space size="small" style={{ flexShrink: 0 }}>
            <Button size="small" icon={<EditOutlined />} onClick={() => setModalOpen(true)}>Modifier</Button>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete}>Supprimer</Button>
          </Space>
        </div>

        {/* ── Barre de stats compacte ── */}
        {accountStats && (
          <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0', marginTop: 12, paddingTop: 10 }}>
            {[
              {
                label: 'CA Année',
                value: formatCurrency(accountStats.caCurrentYear || 0),
                valueColor: undefined,
                sub: caVariation !== null ? (
                  <Tag color={caVariation >= 0 ? 'green' : 'red'} style={{ fontSize: 10, marginTop: 2 }}>
                    {caVariation >= 0 ? <RiseOutlined /> : <FallOutlined />} {caVariation >= 0 ? '+' : ''}{caVariation.toFixed(1)}%
                  </Tag>
                ) : null,
              },
              { label: 'CA N-1', value: formatCurrency(accountStats.caPreviousYear || 0), valueColor: undefined, sub: null },
              {
                label: 'Pipeline',
                value: formatCurrency(accountStats.openPipeline || 0),
                valueColor: undefined,
                sub: <span style={{ fontSize: 10, color: '#8c8c8c' }}>{accountStats.openOpportunities} opp.</span>,
              },
              { label: 'Payé', value: formatCurrency(accountStats.totalPaid || 0), valueColor: '#52c41a', sub: null },
              {
                label: 'En retard',
                value: formatCurrency(accountStats.overdueAmount || 0),
                valueColor: accountStats.overdueInvoices > 0 ? '#ff4d4f' : undefined,
                sub: accountStats.overdueInvoices > 0
                  ? <span style={{ fontSize: 10, color: '#ff4d4f' }}>{accountStats.overdueInvoices} fact.</span>
                  : null,
              },
              {
                label: 'Contacts',
                value: String(accountStats.totalContacts),
                valueColor: undefined,
                sub: accountStats.wonOpportunities > 0
                  ? <Tag color="gold" style={{ fontSize: 10, marginTop: 2 }}><TrophyOutlined /> {accountStats.wonOpportunities}</Tag>
                  : null,
              },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{
                flex: 1, textAlign: 'center', padding: '0 6px',
                borderRight: i < arr.length - 1 ? '1px solid #f0f0f0' : undefined,
              }}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: stat.valueColor, lineHeight: 1.2 }}>{stat.value}</div>
                {stat.sub && <div>{stat.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Bande IA ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '6px 12px', background: '#faf5ff', borderRadius: 6, border: '1px solid #e9d5ff' }}>
          <RobotOutlined style={{ color: '#7c3aed', flexShrink: 0 }} />
          {aiLoading ? (
            <Text type="secondary" style={{ fontSize: 12, flex: 1 }}><Spin size="small" style={{ marginRight: 6 }} />Analyse en cours…</Text>
          ) : aiAnalysis ? (
            <Text style={{ fontSize: 12, flex: 1, whiteSpace: 'pre-wrap' }}>{aiAnalysis}</Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12, flex: 1 }}>Score de santé · risque de churn · opportunités d'upsell</Text>
          )}
          <Button size="small" type="primary" icon={<RobotOutlined />} loading={aiLoading} onClick={handleAiAnalysis}
            style={{ background: '#7c3aed', borderColor: '#7c3aed', flexShrink: 0 }}>
            {aiAnalysis ? 'Réanalyser' : "Analyser avec l'IA"}
          </Button>
        </div>

        <Tabs items={tabItems} style={{ marginTop: 12 }} />
      </Card>

      <AccountFormModal
        open={modalOpen}
        accountId={id || null}
        onClose={handleModalClose}
      />

      <ChantierFormModal
        open={chantierModalOpen}
        chantierId={editingChantierId}
        onClose={handleChantierModalClose}
        defaultAccountId={id}
      />
    </div>
  );
};

export default AccountDetailPage;
