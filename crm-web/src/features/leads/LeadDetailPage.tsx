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
  Form,
  Checkbox,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Avatar,
  Progress,
  Divider,
  Alert,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  GlobalOutlined,
  MailOutlined,
  LinkedinOutlined,
  UserOutlined,
  BankOutlined,
  StarOutlined,
  CalendarOutlined,
  SwapOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  TagsOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteLead } from './leadsSlice';
import type { Lead } from '@/types/lead';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_RATINGS,
  BUDGET_RANGES,
  DECISION_TIMEFRAMES,
  LEAD_PRIORITIES,
  INDUSTRIES,
  NUM_EMPLOYEES_RANGES,
  ANNUAL_REVENUES,
} from '@/types/lead';
import LeadFormModal from './LeadFormModal';
import LeadScoreWidget from './LeadScoreWidget';
import { analyzeLead, leadScoringAi, type LeadScoringAiResponse } from '@/api/ai';
import leadsApi from '@/api/leads';
import opportunitiesApi from '@/api/opportunities';
import accountsApi from '@/api/accounts';
import { ACCOUNT_TYPES } from '@/types/account';
import type { AccountListItem } from '@/types/account';
import type { ConvertLeadRequest } from '@/types/lead';

const { Title, Text } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findLabel = (arr: { value: string; label: string }[], val?: string) =>
  arr.find((x) => x.value === val)?.label ?? val ?? '—';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

// ─── Component ────────────────────────────────────────────────────────────────

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canDelete = currentUser?.role?.name !== 'COMMERCIAL' && currentUser?.role?.name !== 'READ_ONLY';

  // ── Chargement local — indépendant du Redux store pour éviter toute race condition ──
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertForm] = Form.useForm();
  const [convertLoading, setConvertLoading] = useState(false);
  const [stages, setStages] = useState<{ id: string; name: string; probability?: number }[]>([]);
  const [createAccount, setCreateAccount] = useState(true);
  const [createOpportunity, setCreateOpportunity] = useState(false);
  const [accountOptions, setAccountOptions] = useState<{ value: string; label: string }[]>([]);
  const [accountSearching, setAccountSearching] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiScoring, setAiScoring] = useState<LeadScoringAiResponse | null>(null);
  const [aiScoringLoading, setAiScoringLoading] = useState(false);

  const loadLead = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await leadsApi.getById(id);
      setLead(data);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Impossible de charger la piste');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [id]);

  useEffect(() => {
    if (convertModalOpen && stages.length === 0) {
      opportunitiesApi.getStages().then(setStages).catch(() => {});
    }
    if (convertModalOpen && lead) {
      setCreateAccount(true);
      setCreateOpportunity(false);
      convertForm.setFieldsValue({
        createAccount: true,
        createContact: true,
        createOpportunity: false,
        accountName: lead.companyName,
        accountType: 'Prospect',
        opportunityName: `Opportunité - ${lead.fullName}`,
      });
    }
  }, [convertModalOpen, lead]);

  const handleDelete = () => {
    Modal.confirm({
      title: 'Supprimer le lead',
      icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      content: 'Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteLead(id!)).unwrap();
          message.success('Lead supprimé');
          navigate('/leads');
        } catch {
          message.error('Erreur lors de la suppression');
        }
      },
    });
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    if (refresh) loadLead();
  };

  const handleConvert = async () => {
    try {
      const values = await convertForm.validateFields();
      setConvertLoading(true);
      const req: ConvertLeadRequest = {
        createAccount: values.createAccount,
        createContact: values.createContact,
        createOpportunity: values.createOpportunity,
        accountName: values.createAccount ? values.accountName : undefined,
        accountType: values.createAccount ? values.accountType : undefined,
        existingAccountId: !values.createAccount ? values.existingAccountId : undefined,
        opportunityName: values.createOpportunity ? values.opportunityName : undefined,
        opportunityAmount: values.createOpportunity ? values.opportunityAmount : undefined,
        opportunityStageId: values.createOpportunity ? values.opportunityStageId : undefined,
        closeDate: values.createOpportunity && values.closeDate
          ? values.closeDate.format('YYYY-MM-DD')
          : undefined,
      };
      await leadsApi.convert(id!, req);
      message.success('Lead converti avec succès !');
      setConvertModalOpen(false);
      loadLead();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || 'Erreur lors de la conversion');
    } finally {
      setConvertLoading(false);
    }
  };

  const handleAccountSearch = async (query: string) => {
    if (!query || query.trim().length < 1) return;
    setAccountSearching(true);
    try {
      const results: AccountListItem[] = await accountsApi.search(query.trim());
      setAccountOptions(results.map((a) => ({ value: a.id, label: a.name })));
    } catch {
      // silently ignore search errors
    } finally {
      setAccountSearching(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!lead) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeLead({
        leadName: lead.fullName,
        company: lead.companyName,
        jobTitle: lead.jobTitle,
        source: lead.source,
        status: lead.status,
        industry: lead.industry,
        notes: lead.description ?? lead.qualificationNotes,
      });
      setAiAnalysis(result);
    } catch {
      message.error('Erreur lors de l\'analyse IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiScoring = async () => {
    if (!id) return;
    setAiScoringLoading(true);
    setAiScoring(null);
    try {
      const result = await leadScoringAi({ leadId: id });
      setAiScoring(result);
    } catch {
      message.error('Erreur lors du scoring IA');
    } finally {
      setAiScoringLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ padding: 32 }}>
        <Alert
          type="error"
          showIcon
          message="Piste introuvable"
          description={error || "Cette piste n'existe pas ou vous n'avez pas accès à cette ressource."}
          action={
            <Button size="small" onClick={() => navigate('/leads')}>
              Retour aux pistes
            </Button>
          }
        />
      </div>
    );
  }

  const statusObj = LEAD_STATUSES.find((s) => s.value === lead.status);
  const ratingObj = LEAD_RATINGS.find((r) => r.value === lead.rating);
  const priorityObj = LEAD_PRIORITIES.find((p) => p.value === lead.priority);

  const initials = `${lead.firstName?.charAt(0) ?? ''}${lead.lastName.charAt(0)}`.toUpperCase();

  return (
    <div>
      {/* ── Back nav ── */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/leads')}
        style={{ paddingLeft: 0, marginBottom: 12, color: '#595959' }}
      >
        Retour aux leads
      </Button>

      {/* ── Header ── */}
      <Card style={{ marginBottom: 16, borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar size={64} style={{ background: '#1677ff', fontSize: 24, flexShrink: 0 }}>
            {initials}
          </Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <Title level={4} style={{ margin: 0 }}>{lead.fullName}</Title>
              {lead.companyName && (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  <BankOutlined style={{ marginRight: 4 }} />{lead.companyName}
                </Text>
              )}
              {lead.jobTitle && (
                <Text type="secondary" style={{ fontSize: 13 }}>{lead.jobTitle}</Text>
              )}
            </div>
            <Space size={8} style={{ marginTop: 8, flexWrap: 'wrap' }}>
              {statusObj && (
                <Tag color={statusObj.color}>{statusObj.label}</Tag>
              )}
              {ratingObj && (
                <Tag color={ratingObj.color} icon={<StarOutlined />}>{ratingObj.label}</Tag>
              )}
              {priorityObj && (
                <Tag color={priorityObj.color}>{priorityObj.label} priorité</Tag>
              )}
              {lead.isConverted && (
                <Tag color="gold" icon={<CheckCircleOutlined />}>Converti</Tag>
              )}
              {lead.leadScore !== undefined && lead.leadScore !== null && (
                <Tooltip title="Score de qualification">
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, borderRadius: '50%',
                      background: lead.leadScore >= 80 ? '#52c41a' : lead.leadScore >= 60 ? '#73d13d' : lead.leadScore >= 40 ? '#faad14' : lead.leadScore >= 20 ? '#ff7a45' : '#ff4d4f',
                      color: '#fff', fontWeight: 700, fontSize: 12,
                    }}
                  >
                    {lead.leadScore}
                  </span>
                </Tooltip>
              )}
            </Space>
          </div>
          <Space>
            {!lead.isConverted && (
              <Button
                icon={<SwapOutlined />}
                onClick={() => setConvertModalOpen(true)}
              >
                Convertir
              </Button>
            )}
            <Button icon={<EditOutlined />} type="primary" onClick={() => setModalOpen(true)}>
              Modifier
            </Button>
            {canDelete && <Button icon={<DeleteOutlined />} danger onClick={handleDelete} />}
          </Space>
        </div>

        {/* Quick contact bar */}
        <Divider style={{ margin: '12px 0 8px' }} />
        <Space size={20} wrap>
          {lead.email && (
            <a href={`mailto:${lead.email}`} style={{ fontSize: 13 }}>
              <MailOutlined style={{ marginRight: 4 }} />{lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} style={{ fontSize: 13 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />{lead.phone}
            </a>
          )}
          {lead.mobile && lead.mobile !== lead.phone && (
            <a href={`tel:${lead.mobile}`} style={{ fontSize: 13 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />{lead.mobile} (mobile)
            </a>
          )}
          {lead.website && (
            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
              <GlobalOutlined style={{ marginRight: 4 }} />Site web
            </a>
          )}
          {lead.linkedinUrl && (
            <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
              <LinkedinOutlined style={{ marginRight: 4 }} />LinkedIn
            </a>
          )}
        </Space>
      </Card>

      {/* ── Conversion alert ── */}
      {lead.isConverted && (
        <Alert
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
          message={
            <Space>
              <span>Lead converti le {formatDateTime(lead.convertedAt)}</span>
              {lead.convertedAccountId && (
                <Button size="small" type="link" onClick={() => navigate(`/accounts/${lead.convertedAccountId}`)}>
                  Voir le compte
                </Button>
              )}
              {lead.convertedContactId && (
                <Button size="small" type="link" onClick={() => navigate(`/contacts/${lead.convertedContactId}`)}>
                  Voir le contact
                </Button>
              )}
              {lead.convertedOpportunityId && (
                <Button size="small" type="link" onClick={() => navigate(`/opportunities/${lead.convertedOpportunityId}`)}>
                  Voir l'opportunité
                </Button>
              )}
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ── Tabs ── */}
      <Tabs
        defaultActiveKey="info"
        type="card"
        items={[
          {
            key: 'info',
            label: 'Informations',
            children: (
              <Row gutter={[16, 16]}>
                {/* Contact */}
                <Col span={12}>
                  <Card title={<><UserOutlined className="mr-2 text-blue-500" />Contact</>} size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Civilité">{lead.salutation || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Prénom">{lead.firstName || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Nom">{lead.lastName}</Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Téléphone">
                        {lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mobile">
                        {lead.mobile ? <a href={`tel:${lead.mobile}`}>{lead.mobile}</a> : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Fax">{lead.fax || '—'}</Descriptions.Item>
                      <Descriptions.Item label="LinkedIn">
                        {lead.linkedinUrl
                          ? <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"><LinkedinOutlined /> Voir</a>
                          : '—'}
                      </Descriptions.Item>
                      {(lead.doNotCall || lead.doNotEmail) && (
                        <Descriptions.Item label="Restrictions">
                          <Space>
                            {lead.doNotCall && <Tag color="red">Ne pas appeler</Tag>}
                            {lead.doNotEmail && <Tag color="orange">Ne pas emailer</Tag>}
                          </Space>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                </Col>

                {/* Entreprise */}
                <Col span={12}>
                  <Card title={<><BankOutlined className="mr-2 text-green-500" />Entreprise</>} size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Société">{lead.companyName || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Fonction">{lead.jobTitle || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Secteur">{findLabel(INDUSTRIES, lead.industry)}</Descriptions.Item>
                      <Descriptions.Item label="Taille">{findLabel(NUM_EMPLOYEES_RANGES, lead.numEmployees)}</Descriptions.Item>
                      <Descriptions.Item label="CA annuel">{findLabel(ANNUAL_REVENUES, lead.annualRevenue)}</Descriptions.Item>
                      <Descriptions.Item label="Site web">
                        {lead.website
                          ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer"><GlobalOutlined /> {lead.website}</a>
                          : '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {/* Adresse */}
                <Col span={12}>
                  <Card title="Adresse" size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Rue">{lead.street || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Code postal">{lead.postalCode || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Ville">{lead.city || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Région">{lead.state || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Pays">{lead.country || '—'}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {/* Source & Attribution */}
                <Col span={12}>
                  <Card title="Source & Attribution" size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Source">
                        {lead.source ? <Tag>{findLabel(LEAD_SOURCES, lead.source)}</Tag> : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Détail source">{lead.sourceDetails || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Campagne">{lead.campaignId || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Responsable">
                        {lead.assignedTo
                          ? <Space><UserOutlined />{lead.assignedTo.fullName}</Space>
                          : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Territoire">
                        {lead.territory ? `${lead.territory.name}${lead.territory.region ? ` (${lead.territory.region})` : ''}` : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Créé le">{formatDateTime(lead.createdAt)}</Descriptions.Item>
                      <Descriptions.Item label="Modifié le">{formatDateTime(lead.updatedAt)}</Descriptions.Item>
                      <Descriptions.Item label="Dernière activité">{formatDateTime(lead.lastActivityAt)}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'qualification',
            label: 'Qualification',
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <LeadScoreWidget leadId={id!} initialScore={lead.leadScore} />
                </Col>

                <Col span={12}>
                  <Card
                    title={<><TagsOutlined className="mr-2 text-purple-500" />Critères de qualification</>}
                    size="small"
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Budget">
                        {lead.budgetRange
                          ? <Tag color="purple">{findLabel(BUDGET_RANGES, lead.budgetRange)}</Tag>
                          : <Text type="secondary">Non défini</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Délai de décision">
                        {lead.decisionTimeframe
                          ? <Tag color="geekblue">{findLabel(DECISION_TIMEFRAMES, lead.decisionTimeframe)}</Tag>
                          : <Text type="secondary">Non défini</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Produits d'intérêt">
                        {lead.interestedProducts && lead.interestedProducts.length > 0
                          ? <Space wrap>{lead.interestedProducts.map((p, i) => <Tag key={i}>{p}</Tag>)}</Space>
                          : <Text type="secondary">Non renseigné</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Concurrent / Solution actuelle">
                        {lead.competitor
                          ? <Tag color="red">{lead.competitor}</Tag>
                          : <Text type="secondary">—</Text>}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card
                    title={<><CalendarOutlined className="mr-2 text-orange-500" />Suivi commercial</>}
                    size="small"
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Priorité">
                        {priorityObj
                          ? <Tag color={priorityObj.color}>{priorityObj.label}</Tag>
                          : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Prochaine relance">
                        {lead.nextFollowUpDate
                          ? <Space><ClockCircleOutlined style={{ color: '#faad14' }} />{formatDate(lead.nextFollowUpDate)}</Space>
                          : <Text type="secondary">Non planifiée</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Réunion planifiée">
                        {lead.meetingScheduledAt
                          ? <Space><CalendarOutlined style={{ color: '#52c41a' }} />{formatDateTime(lead.meetingScheduledAt)}</Space>
                          : <Text type="secondary">—</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Démo produit demandée">
                        {lead.productDemoRequested
                          ? <Tag color="green" icon={<ExperimentOutlined />}>Oui</Tag>
                          : <Tag>Non</Tag>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Score actuel">
                        <Progress
                          percent={lead.leadScore ?? 0}
                          size="small"
                          strokeColor={
                            (lead.leadScore ?? 0) >= 80 ? '#52c41a' :
                            (lead.leadScore ?? 0) >= 60 ? '#73d13d' :
                            (lead.leadScore ?? 0) >= 40 ? '#faad14' :
                            (lead.leadScore ?? 0) >= 20 ? '#ff7a45' : '#ff4d4f'
                          }
                        />
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {lead.qualificationNotes && (
                  <Col span={24}>
                    <Card title="Notes de qualification" size="small">
                      <Text style={{ whiteSpace: 'pre-wrap' }}>{lead.qualificationNotes}</Text>
                    </Card>
                  </Col>
                )}

                {/* ── Scoring IA Prédictif ── */}
                <Col span={24}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <RobotOutlined style={{ color: '#7c3aed' }} />
                        <Text strong>Scoring IA Prédictif</Text>
                        {aiScoring && (
                          <Tag color={
                            aiScoring.score >= 80 ? 'green' : aiScoring.score >= 60 ? 'lime' :
                            aiScoring.score >= 40 ? 'gold' : aiScoring.score >= 20 ? 'orange' : 'red'
                          } style={{ fontWeight: 600 }}>
                            {aiScoring.score}/100 — {aiScoring.label}
                          </Tag>
                        )}
                      </Space>
                    }
                    extra={
                      <Button
                        size="small"
                        type="primary"
                        icon={<RobotOutlined />}
                        loading={aiScoringLoading}
                        onClick={handleAiScoring}
                        style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                      >
                        {aiScoring ? 'Rescorer' : 'Scorer avec l\'IA'}
                      </Button>
                    }
                    style={{ borderColor: '#e9d5ff' }}
                  >
                    {aiScoringLoading && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#7c3aed' }}>
                        <Spin size="small" style={{ marginRight: 8 }} />
                        <Text type="secondary">Analyse prédictive en cours (profil, activités, historique)...</Text>
                      </div>
                    )}
                    {!aiScoringLoading && aiScoring && (
                      <Row gutter={[16, 12]}>
                        <Col span={6} style={{ textAlign: 'center' }}>
                          <Progress
                            type="circle"
                            percent={aiScoring.score}
                            size={90}
                            strokeColor={
                              aiScoring.score >= 80 ? '#52c41a' : aiScoring.score >= 60 ? '#73d13d' :
                              aiScoring.score >= 40 ? '#faad14' : aiScoring.score >= 20 ? '#ff7a45' : '#ff4d4f'
                            }
                            format={(p) => <span style={{ fontWeight: 700, fontSize: 22 }}>{p}</span>}
                          />
                          <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>{aiScoring.label}</div>
                        </Col>
                        <Col span={9}>
                          <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                            <CheckCircleOutlined style={{ marginRight: 4 }} />Points forts
                          </Text>
                          <ul style={{ paddingLeft: 16, margin: '4px 0 0', fontSize: 12 }}>
                            {aiScoring.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                          <Divider style={{ margin: '8px 0' }} />
                          <Text strong style={{ fontSize: 12, color: '#ff4d4f' }}>
                            <WarningOutlined style={{ marginRight: 4 }} />Faiblesses
                          </Text>
                          <ul style={{ paddingLeft: 16, margin: '4px 0 0', fontSize: 12 }}>
                            {aiScoring.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </Col>
                        <Col span={9}>
                          <Text strong style={{ fontSize: 12, color: '#1677ff' }}>
                            <CalendarOutlined style={{ marginRight: 4 }} />Actions recommandées
                          </Text>
                          <ul style={{ paddingLeft: 16, margin: '4px 0 0', fontSize: 12 }}>
                            {aiScoring.nextActions.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                          <Divider style={{ margin: '8px 0' }} />
                          <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                            {aiScoring.reasoning}
                          </Text>
                        </Col>
                      </Row>
                    )}
                    {!aiScoringLoading && !aiScoring && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Cliquez sur "Scorer avec l'IA" pour obtenir un scoring prédictif basé sur le profil, les activités et l'historique de conversion.
                      </Text>
                    )}
                  </Card>
                </Col>

                {/* ── Analyse IA ── */}
                <Col span={24}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <RobotOutlined style={{ color: '#7c3aed' }} />
                        <Text strong>Analyse IA du lead</Text>
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
                        {aiAnalysis ? 'Réanalyser' : 'Analyser avec l\'IA'}
                      </Button>
                    }
                    style={{ borderColor: '#e9d5ff' }}
                  >
                    {aiLoading && (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#7c3aed' }}>
                        <Spin size="small" style={{ marginRight: 8 }} />
                        <Text type="secondary">Analyse en cours...</Text>
                      </div>
                    )}
                    {!aiLoading && aiAnalysis && (
                      <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{aiAnalysis}</Text>
                    )}
                    {!aiLoading && !aiAnalysis && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Cliquez sur "Analyser avec l'IA" pour obtenir une analyse qualitative de ce lead basée sur ses données.
                      </Text>
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'notes',
            label: 'Notes & Restrictions',
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title="Description" size="small">
                    {lead.description
                      ? <Text style={{ whiteSpace: 'pre-wrap' }}>{lead.description}</Text>
                      : <Text type="secondary">Aucune description.</Text>}
                  </Card>
                </Col>
                {(lead.doNotCall || lead.doNotEmail) && (
                  <Col span={24}>
                    <Alert
                      type="warning"
                      showIcon
                      message="Restrictions de contact"
                      description={
                        <Space>
                          {lead.doNotCall && <Tag color="red">Ne pas appeler</Tag>}
                          {lead.doNotEmail && <Tag color="orange">Ne pas emailer</Tag>}
                        </Space>
                      }
                    />
                  </Col>
                )}
              </Row>
            ),
          },
        ]}
      />

      {/* ── Modals ── */}
      <LeadFormModal
        open={modalOpen}
        leadId={id ?? null}
        onClose={handleModalClose}
      />

      {/* ── Modal Conversion ── */}
      <Modal
        title={
          <Space>
            <SwapOutlined style={{ color: '#1677ff' }} />
            <span>Convertir le lead — {lead.fullName}</span>
          </Space>
        }
        open={convertModalOpen}
        onOk={handleConvert}
        onCancel={() => setConvertModalOpen(false)}
        okText="Convertir"
        cancelText="Annuler"
        confirmLoading={convertLoading}
        width={560}
        destroyOnHidden
      >
        <Form form={convertForm} layout="vertical" style={{ marginTop: 16 }}>
          {/* ── Compte ── */}
          <Form.Item name="createAccount" valuePropName="checked" style={{ marginBottom: 4 }}>
            <Checkbox onChange={(e) => setCreateAccount(e.target.checked)}>
              <strong>Créer un nouveau compte client</strong>
            </Checkbox>
          </Form.Item>

          {createAccount ? (
            <Row gutter={12} style={{ marginLeft: 24, marginBottom: 8 }}>
              <Col span={14}>
                <Form.Item name="accountName" label="Nom du compte" rules={[{ required: createAccount, message: 'Obligatoire' }]} style={{ marginBottom: 8 }}>
                  <Input placeholder="Nom de l'entreprise" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item name="accountType" label="Type" style={{ marginBottom: 8 }}>
                  <Select options={ACCOUNT_TYPES} />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <div style={{ marginLeft: 24, marginBottom: 8 }}>
              <Form.Item name="existingAccountId" label="Lier à un compte existant" style={{ marginBottom: 8 }}>
                <Select
                  showSearch
                  filterOption={false}
                  onSearch={handleAccountSearch}
                  loading={accountSearching}
                  placeholder="Tapez pour rechercher un compte..."
                  allowClear
                  notFoundContent={accountSearching ? <Spin size="small" /> : 'Aucun résultat'}
                  options={accountOptions}
                />
              </Form.Item>
            </div>
          )}

          {/* ── Contact ── */}
          <Form.Item name="createContact" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Checkbox>
              <strong>Créer un contact</strong>
              <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 6 }}>
                ({lead.firstName} {lead.lastName})
              </span>
            </Checkbox>
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

          {/* ── Opportunité ── */}
          <Form.Item name="createOpportunity" valuePropName="checked" style={{ marginBottom: 4 }}>
            <Checkbox onChange={(e) => setCreateOpportunity(e.target.checked)}>
              <strong>Créer une opportunité</strong>
            </Checkbox>
          </Form.Item>

          {createOpportunity && (
            <Row gutter={12} style={{ marginLeft: 24 }}>
              <Col span={24}>
                <Form.Item name="opportunityName" label="Nom de l'opportunité" rules={[{ required: createOpportunity }]} style={{ marginBottom: 8 }}>
                  <Input placeholder="Ex: Projet ERP - ClientXYZ" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item name="opportunityAmount" label="Montant estimé (MAD)" style={{ marginBottom: 8 }}>
                  <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="opportunityStageId" label="Étape" style={{ marginBottom: 8 }}>
                  <Select
                    placeholder="Sélectionner"
                    options={stages.map(s => ({ value: s.id, label: s.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="closeDate" label="Date cible" style={{ marginBottom: 8 }}>
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default LeadDetailPage;
