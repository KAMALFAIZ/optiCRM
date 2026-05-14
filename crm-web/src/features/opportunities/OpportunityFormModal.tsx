import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  message,
  Slider,
  Space,
  Divider,
  Collapse,
  Card,
  Button,
  Spin,
  Typography,
} from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { analyzeOpportunity } from '@/api/ai';

const { Text } = Typography;
import { useAppDispatch, useAppSelector } from '@/store';
import { createOpportunity, updateOpportunity, fetchOpportunityStages } from './opportunitiesSlice';
import {
  OpportunityListItem,
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  OPPORTUNITY_TYPES,
  CLOSE_REASONS,
} from '@/types/opportunity';
import { accountsApi } from '@/api/accounts';
import { contactsApi } from '@/api/contacts';
import { usersApi } from '@/api/users';
import { opportunitiesApi } from '@/api/opportunities';
import { AccountListItem } from '@/types/account';
import { ContactListItem } from '@/types/contact';
import { UserListItem } from '@/types/user';
import type { RootState } from '@/store';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const OPP_LEAD_SOURCES = [
  { value: 'website', label: 'Site web' },
  { value: 'referral', label: 'Recommandation' },
  { value: 'cold_call', label: 'Appel à froid' },
  { value: 'trade_show', label: 'Salon professionnel' },
  { value: 'social_media', label: 'Réseaux sociaux' },
  { value: 'advertising', label: 'Publicité' },
  { value: 'email_campaign', label: 'Campagne email' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'event', label: 'Événement' },
  { value: 'other', label: 'Autre' },
];

interface OpportunityFormModalProps {
  visible: boolean;
  opportunity: OpportunityListItem | null;
  onClose: (success?: boolean) => void;
}

const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({
  visible,
  opportunity,
  onClose,
}) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { stages, loading, stagesLoading } = useAppSelector((state: RootState) => state.opportunities);

  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [probability, setProbability] = useState<number>(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const isEditing = !!opportunity;

  useEffect(() => {
    if (visible && stages.length === 0) {
      dispatch(fetchOpportunityStages());
    }
  }, [visible, dispatch, stages.length]);

  useEffect(() => {
    if (visible) {
      loadAccounts();
      loadUsers();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedAccountId) {
      loadContacts(selectedAccountId);
    } else {
      setContacts([]);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (visible && opportunity) {
      loadFullDetails(opportunity.id);
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({ currency: 'MAD', probability: 0 });
      setSelectedAccountId(null);
      setProbability(0);
    }
    if (!visible) {
      setAiAnalysis(null);
      setAiLoading(false);
    }
  }, [visible, opportunity]);

  const loadAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await accountsApi.getAll({ size: 200 });
      setAccounts(response.content);
    } catch {}
    finally { setAccountsLoading(false); }
  };

  const loadContacts = async (accountId: string) => {
    setContactsLoading(true);
    try {
      const response = await contactsApi.getByAccount(accountId);
      setContacts(response);
    } catch {}
    finally { setContactsLoading(false); }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await usersApi.getAll({ size: 100, isActive: true });
      setUsers(response.content);
    } catch {}
    finally { setUsersLoading(false); }
  };

  const loadFullDetails = async (id: string) => {
    try {
      const full = await opportunitiesApi.getById(id);
      const accountId = full.account.id;
      const prob = full.probability || 0;
      setSelectedAccountId(accountId);
      setProbability(prob);
      if (accountId) loadContacts(accountId);
      form.setFieldsValue({
        name: full.name,
        amount: full.amount,
        currency: full.currency || 'MAD',
        probability: prob,
        stageId: full.stage?.id,
        closeDate: full.closeDate ? dayjs(full.closeDate) : undefined,
        accountId,
        primaryContactId: full.primaryContact?.id,
        assignedToId: full.assignedTo?.id,
        type: full.type,
        leadSource: full.leadSource,
        nextStep: full.nextStep,
        tags: full.tags || [],
        description: full.description,
        closeReason: full.closeReason,
        campaignId: full.campaignId,
        leadId: full.leadId,
      });
    } catch {
      // Fallback to list item data
      const prob = opportunity!.probability || 0;
      setSelectedAccountId(opportunity!.accountId);
      setProbability(prob);
      form.setFieldsValue({
        name: opportunity!.name,
        amount: opportunity!.amount,
        currency: opportunity!.currency || 'MAD',
        probability: prob,
        stageId: opportunity!.stageId,
        closeDate: opportunity!.closeDate ? dayjs(opportunity!.closeDate) : undefined,
        accountId: opportunity!.accountId,
        primaryContactId: opportunity!.primaryContactId,
        assignedToId: opportunity!.assignedToId,
      });
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    form.setFieldValue('primaryContactId', undefined);
  };

  const handleStageChange = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage?.probability !== undefined) {
      const prob = stage.probability;
      form.setFieldValue('probability', prob);
      setProbability(prob);
    }
  };

  const handleProbabilityChange = (val: number | null) => {
    const v = Math.min(100, Math.max(0, val ?? 0));
    setProbability(v);
    form.setFieldValue('probability', v);
  };

  const handleAiAnalysis = async () => {
    if (!opportunity) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const values = form.getFieldsValue();
      const stage = stages.find((s) => s.id === values.stageId);
      const account = accounts.find((a) => a.id === values.accountId);
      const result = await analyzeOpportunity({
        opportunityName: values.name || opportunity.name,
        stageName: stage?.name,
        amount: values.amount,
        probability: values.probability,
        closeDate: values.closeDate ? values.closeDate.format('DD/MM/YYYY') : undefined,
        accountName: account?.name,
        notes: values.description,
      });
      setAiAnalysis(result);
    } catch {
      message.error('Erreur lors de l\'analyse IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: any = {
        ...values,
        closeDate: values.closeDate ? values.closeDate.format('YYYY-MM-DD') : undefined,
        probability: values.probability ?? 0,
      };

      if (isEditing && opportunity) {
        await dispatch(
          updateOpportunity({ id: opportunity.id, data: formData as UpdateOpportunityRequest })
        ).unwrap();
        message.success('Opportunité mise à jour avec succès');
      } else {
        await dispatch(createOpportunity(formData as CreateOpportunityRequest)).unwrap();
        message.success('Opportunité créée avec succès');
      }
      onClose(true);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message || 'Une erreur est survenue');
    }
  };

  return (
    <Modal
      title={isEditing ? "Modifier l'opportunité" : 'Nouvelle opportunité'}
      open={visible}
      onCancel={() => onClose()}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={860}
      okText={isEditing ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" size="small">

        {/* ── Identification ── */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="name"
              label="Nom de l'opportunité"
              rules={[{ required: true, message: 'Obligatoire' }]}
            >
              <Input placeholder="Ex: Projet CRM Enterprise" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="stageId"
              label="Étape"
              rules={[{ required: true, message: 'Obligatoire' }]}
            >
              <Select placeholder="Étape" loading={stagesLoading} onChange={handleStageChange}>
                {stages.map((stage) => (
                  <Option key={stage.id} value={stage.id}>
                    <Space size={6}>
                      <span style={{
                        display: 'inline-block', width: 10, height: 10,
                        borderRadius: '50%', backgroundColor: stage.color,
                      }} />
                      {stage.name}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* ── Montant & Probabilité ── */}
        <Divider orientation="left" plain style={{ fontSize: 12, margin: '4px 0 10px' }}>Montant</Divider>
        <Row gutter={12} align="middle">
          <Col span={7}>
            <Form.Item name="amount" label="Montant">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                precision={2}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={(v) => (v?.replace(/\s/g, '') || '0') as unknown as 0}
              />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="currency" label="Devise" initialValue="MAD">
              <Select>
                <Option value="MAD">MAD</Option>
                <Option value="EUR">EUR</Option>
                <Option value="USD">USD</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item label="Probabilité">
              <Row gutter={8} align="middle" wrap={false}>
                <Col flex="80px">
                  <Form.Item name="probability" noStyle initialValue={0}>
                    <InputNumber
                      min={0}
                      max={100}
                      addonAfter="%"
                      style={{ width: 80 }}
                      onChange={handleProbabilityChange}
                    />
                  </Form.Item>
                </Col>
                <Col flex="auto">
                  <Slider
                    min={0}
                    max={100}
                    value={probability}
                    onChange={handleProbabilityChange}
                    tooltip={{ open: false }}
                    style={{ margin: '0 8px' }}
                  />
                </Col>
              </Row>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Pondéré">
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const amt = form.getFieldValue('amount') || 0;
                  const weighted = (amt * probability) / 100;
                  return (
                    <span style={{ fontWeight: 600, color: '#52c41a', fontSize: 13 }}>
                      {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(weighted)}
                    </span>
                  );
                }}
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>

        {/* ── Relations ── */}
        <Divider orientation="left" plain style={{ fontSize: 12, margin: '4px 0 10px' }}>Relations</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="accountId"
              label="Compte"
              rules={[{ required: true, message: 'Obligatoire' }]}
            >
              <Select
                placeholder="Sélectionner un compte"
                loading={accountsLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleAccountChange}
              >
                {accounts.map((a) => (
                  <Option key={a.id} value={a.id}>{a.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="primaryContactId" label="Contact principal">
              <Select
                placeholder="Sélectionner un contact"
                loading={contactsLoading}
                disabled={!selectedAccountId}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {contacts.map((c) => (
                  <Option key={c.id} value={c.id}>{c.fullName}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="assignedToId" label="Responsable">
              <Select
                placeholder="Assigner à..."
                loading={usersLoading}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {users.map((u) => (
                  <Option key={u.id} value={u.id}>{u.firstName} {u.lastName}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="nextStep" label="Prochaine étape">
              <Input placeholder="Ex: Réunion de présentation" />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Informations ── */}
        <Divider orientation="left" plain style={{ fontSize: 12, margin: '4px 0 10px' }}>Informations</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="closeDate" label="Date de clôture prévue">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="type" label="Type">
              <Select placeholder="Type" allowClear>
                {OPPORTUNITY_TYPES.map((t) => (
                  <Option key={t.value} value={t.value}>{t.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="leadSource" label="Source">
              <Select
                placeholder="Source"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {OPP_LEAD_SOURCES.map((s) => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="Ajouter des tags" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Description de l'opportunité..." />
        </Form.Item>

        {/* ── Champs avancés ── */}
        <Collapse
          ghost
          size="small"
          style={{ marginTop: 4, borderTop: '1px solid #f0f0f0' }}
          items={[{
            key: 'advanced',
            label: <span style={{ color: '#8c8c8c', fontSize: 12 }}>Champs avancés</span>,
            children: (
              <>
                <Row gutter={16}>
                  {isEditing && (
                    <Col span={12}>
                      <Form.Item name="closeReason" label="Motif de clôture">
                        <Select placeholder="Motif de clôture" allowClear>
                          {CLOSE_REASONS.map((r) => (
                            <Option key={r.value} value={r.value}>{r.label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={isEditing ? 12 : 24}>
                    <Form.Item
                      name="campaignId"
                      label="Campagne (ID)"
                      tooltip="Identifiant UUID de la campagne associée"
                    >
                      <Input placeholder="Ex: a1b2c3d4-..." />
                    </Form.Item>
                  </Col>
                </Row>
                {!isEditing && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="leadId"
                        label="Piste source (ID)"
                        tooltip="ID de la piste qui a généré cette opportunité"
                      >
                        <Input placeholder="Ex: a1b2c3d4-..." />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </>
            ),
          }]}
        />

        {/* ── Analyse IA ── visible uniquement en mode édition */}
        {isEditing && (
          <Card
            size="small"
            style={{ marginTop: 12, borderColor: '#e9d5ff' }}
            title={
              <Space>
                <RobotOutlined style={{ color: '#7c3aed' }} />
                <Text strong style={{ fontSize: 13 }}>Analyse IA de l'opportunité</Text>
              </Space>
            }
            extra={
              <Button
                size="small"
                type="primary"
                icon={<RobotOutlined />}
                loading={aiLoading}
                onClick={handleAiAnalysis}
                style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
              >
                {aiAnalysis ? 'Réanalyser' : "Analyser avec l'IA"}
              </Button>
            }
          >
            {aiLoading && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: '#7c3aed' }}>
                <Spin size="small" style={{ marginRight: 8 }} />
                <Text type="secondary">Analyse en cours...</Text>
              </div>
            )}
            {!aiLoading && aiAnalysis && (
              <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{aiAnalysis}</Text>
            )}
            {!aiLoading && !aiAnalysis && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Cliquez sur "Analyser avec l'IA" pour obtenir une analyse de cette opportunité : score de succès, risques et actions recommandées.
              </Text>
            )}
          </Card>
        )}

      </Form>
    </Modal>
  );
};

export default OpportunityFormModal;
