import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Descriptions, Tag, Button, Space,
  Spin, Modal, message, Table, Form, Input, Select, Popconfirm,
  Empty, Tabs, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, EnvironmentOutlined,
  CalendarOutlined, FlagOutlined, StarOutlined, GiftOutlined,
  TeamOutlined, PictureOutlined, FileTextOutlined, RobotOutlined,
  InfoCircleOutlined, LineChartOutlined,
} from '@ant-design/icons';
import { chantiersApi, ChantierDto, ChantierActeurDto } from '@/api/chantiers';
import { quotesApi } from '@/api/quotes';
import type { QuoteListItem } from '@/types/quote';
import { QUOTE_STATUS_CONFIG } from '@/types/quote';
import ChantierFormModal from './ChantierFormModal';
import EchantillonModal from './EchantillonModal';
import ChantierPhotosSection from './ChantierPhotosSection';
import ChantierAiPanel from './ChantierAiPanel';

const { Title, Text } = Typography;

const STADE_OPTIONS = [
  { value: 'ETUDE_CONCEPTION',  label: 'Étude / Conception',  color: 'blue' },
  { value: 'AUTORISATION',      label: 'Autorisation',         color: 'geekblue' },
  { value: 'GROS_OEUVRE',       label: 'Gros œuvre',           color: 'orange' },
  { value: 'SECOND_OEUVRE',     label: 'Second œuvre',         color: 'gold' },
  { value: 'PHASE_EQUIPEMENT',  label: 'Phase équipement',     color: 'lime' },
  { value: 'LIVRAISON',         label: 'Livraison',            color: 'green' },
  { value: 'CLOTURE',           label: 'Clôturé',              color: 'default' },
];

const STATUT_OPTIONS = [
  { value: 'ACTIF',       label: 'Actif',       color: 'green' },
  { value: 'PRIORITAIRE', label: 'Prioritaire', color: 'red' },
  { value: 'GAGNE',       label: 'Gagné',       color: 'blue' },
  { value: 'PERDU',       label: 'Perdu',       color: 'default' },
];

const NIVEAU_OPTIONS = [
  { value: 'FERME',                label: 'Fermé',                color: 'red' },
  { value: 'PARTIELLEMENT_OUVERT', label: 'Partiellement ouvert', color: 'orange' },
  { value: 'LIBRE',                label: 'Libre / influençable', color: 'green' },
];

const ROLE_ACTEUR_OPTIONS = [
  { value: 'MAITRE_OUVRAGE',  label: "Maître d'ouvrage" },
  { value: 'MAITRE_OEUVRE',   label: "Maître d'œuvre" },
  { value: 'ARCHITECTE',      label: 'Architecte' },
  { value: 'BET',             label: "Bureau d'études technique (BET)" },
  { value: 'ENTREPRISE_GC',   label: 'Entreprise gros œuvre' },
  { value: 'PROMOTEUR',       label: 'Promoteur immobilier' },
  { value: 'INSTALLATEUR',    label: 'Installateur / Plombier' },
  { value: 'AUTRE',           label: 'Autre' },
];

const getOpt = (opts: typeof STADE_OPTIONS, val?: string) => opts.find(o => o.value === val);

export default function ChantierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chantier, setChantier] = useState<ChantierDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addActeurOpen, setAddActeurOpen] = useState(false);
  const [echantillonOpen, setEchantillonOpen] = useState(false);
  const [acteurForm] = Form.useForm();
  const [savingActeur, setSavingActeur] = useState(false);
  const [devis, setDevis] = useState<QuoteListItem[]>([]);
  const [loadingDevis, setLoadingDevis] = useState(false);
  const [activeTab, setActiveTab] = useState('apercu');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await chantiersApi.getById(id);
      setChantier(data);
    } catch {
      message.error('Erreur lors du chargement du chantier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadDevis = useCallback(async () => {
    if (!id) return;
    setLoadingDevis(true);
    try {
      const data = await quotesApi.getByChantier(id);
      setDevis(data);
    } catch {
      // silent
    } finally {
      setLoadingDevis(false);
    }
  }, [id]);

  useEffect(() => { load(); loadDevis(); }, [load, loadDevis]);

  const handleDelete = () => {
    Modal.confirm({
      title: `Supprimer "${chantier?.nom}" ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await chantiersApi.delete(id!);
        message.success('Chantier supprimé');
        navigate('/chantiers');
      },
    });
  };

  const handleAddActeur = async () => {
    try {
      const values = await acteurForm.validateFields();
      setSavingActeur(true);
      await chantiersApi.addActeur(id!, values);
      message.success('Acteur ajouté');
      acteurForm.resetFields();
      setAddActeurOpen(false);
      load();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error("Erreur lors de l'ajout de l'acteur");
    } finally {
      setSavingActeur(false);
    }
  };

  const handleRemoveActeur = async (acteurId: string) => {
    try {
      await chantiersApi.removeActeur(id!, acteurId);
      message.success('Acteur supprimé');
      load();
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const acteurColumns: ColumnsType<ChantierActeurDto> = [
    {
      title: 'Rôle',
      dataIndex: 'roleActeur',
      key: 'role',
      render: v => ROLE_ACTEUR_OPTIONS.find(r => r.value === v)?.label || v,
    },
    { title: 'Nom / Société', dataIndex: 'nom', key: 'nom' },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
      render: v => v || '-',
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Supprimer cet acteur ?"
          okText="Supprimer"
          okType="danger"
          cancelText="Annuler"
          onConfirm={() => handleRemoveActeur(record.id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  const devisColumns: ColumnsType<QuoteListItem> = [
    {
      title: 'N° Devis',
      dataIndex: 'quoteNumber',
      key: 'quoteNumber',
      render: (v, record) => <a href={`/quotes/${record.id}`}>{v}</a>,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const cfg = QUOTE_STATUS_CONFIG[v as keyof typeof QUOTE_STATUS_CONFIG];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{v}</Tag>;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: v => v != null ? `${Number(v).toLocaleString('fr-FR')} MAD` : '-',
    },
    {
      title: 'Validité',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: v => v ? new Date(v).toLocaleDateString('fr-FR') : '-',
    },
    {
      title: 'Date',
      dataIndex: 'quoteDate',
      key: 'quoteDate',
      render: v => v ? new Date(v).toLocaleDateString('fr-FR') : '-',
    },
  ];

  if (loading && !chantier) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }
  if (!chantier) {
    return <div style={{ padding: 40 }}><Empty description="Chantier introuvable" /></div>;
  }

  const stadeOpt  = getOpt(STADE_OPTIONS,  chantier.stadeChantier);
  const statutOpt = getOpt(STATUT_OPTIONS, chantier.statutChantier);
  const niveauOpt = getOpt(NIVEAU_OPTIONS, chantier.niveauOpportunite);
  const segmentColor =
    chantier.segmentTaille === 'XL' ? 'red'
    : chantier.segmentTaille === 'L' ? 'orange'
    : chantier.segmentTaille === 'M' ? 'blue'
    : 'default';

  // ── Barre de progression stade ──────────────────────────────────────────────
  const stadeIndex = STADE_OPTIONS.findIndex(s => s.value === chantier.stadeChantier);

  return (
    <div style={{ padding: '24px' }}>

      {/* ── Header ── */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/chantiers')}>
              Retour
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              <EnvironmentOutlined style={{ marginRight: 8, color: '#f5a623' }} />
              {chantier.nom}
              {chantier.temoin && (
                <Tag color="gold" icon={<StarOutlined />} style={{ marginLeft: 8 }}>Témoin</Tag>
              )}
            </Title>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button icon={<GiftOutlined />} onClick={() => setEchantillonOpen(true)}>
              Demande d'échantillons
            </Button>
            <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>
              Modifier
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
              Supprimer
            </Button>
          </Space>
        </Col>
      </Row>

      {/* ── Tags résumé ── */}
      <Space wrap style={{ marginBottom: 16 }}>
        {stadeOpt  && <Tag color={stadeOpt.color}  icon={<FlagOutlined />}>{stadeOpt.label}</Tag>}
        {statutOpt && <Tag color={statutOpt.color}>{statutOpt.label}</Tag>}
        {niveauOpt && <Tag color={niveauOpt.color}>{niveauOpt.label}</Tag>}
        {chantier.segmentTaille && <Tag color={segmentColor}>{chantier.segmentTaille} — {chantier.nombreUnites ?? '?'} unités</Tag>}
        {(chantier.ville || chantier.prefecture) && (
          <Tag icon={<EnvironmentOutlined />}>
            {[chantier.ville, chantier.prefecture].filter(Boolean).join(' — ')}
          </Tag>
        )}
      </Space>

      {/* ── Progression stade ── */}
      {stadeIndex >= 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {STADE_OPTIONS.map((s, i) => (
              <div
                key={s.value}
                style={{
                  flex: 1,
                  height: 6,
                  background: i <= stadeIndex ? '#722ed1' : '#f0f0f0',
                  borderRadius: i === 0 ? '4px 0 0 4px' : i === STADE_OPTIONS.length - 1 ? '0 4px 4px 0' : 0,
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {STADE_OPTIONS.map((s, i) => (
              <Text key={s.value} style={{
                fontSize: 10,
                color: i <= stadeIndex ? '#722ed1' : '#bbb',
                fontWeight: i === stadeIndex ? 700 : 400,
                flex: 1,
                textAlign: 'center',
              }}>
                {s.label}
              </Text>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[

          /* ─────────── APERÇU ─────────── */
          {
            key: 'apercu',
            label: <span><InfoCircleOutlined /> Aperçu</span>,
            children: (
              <Row gutter={16}>
                <Col span={16}>
                  <Card title="Informations générales" size="small" style={{ marginBottom: 16 }}>
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Localisation" span={2}>
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        {[chantier.ville, chantier.prefecture].filter(Boolean).join(' — ') || '-'}
                      </Descriptions.Item>
                      {chantier.adresse && (
                        <Descriptions.Item label="Adresse" span={2}>
                          {chantier.adresse}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Type de projet">
                        {chantier.typeProjet ? <Tag>{chantier.typeProjet.replace(/_/g, ' ')}</Tag> : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Sous-type">
                        {chantier.sousTypeProjet || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Nombre d'unités">
                        {chantier.nombreUnites ?? '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Segment taille">
                        {chantier.segmentTaille ? <Tag color={segmentColor}>{chantier.segmentTaille}</Tag> : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Promoteur">
                        {chantier.promoteur || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Installateur">
                        {chantier.installateur || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Chantier témoin" span={2}>
                        {chantier.temoin
                          ? <Tag color="gold" icon={<StarOutlined />}>Oui — Chantier de référence</Tag>
                          : <Tag color="default">Non</Tag>}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {chantier.account && (
                    <Card title="Compte client" size="small" style={{ marginBottom: 16 }}>
                      <Text strong>{chantier.account.name}</Text>
                    </Card>
                  )}
                </Col>

                <Col span={8}>
                  {/* GPS */}
                  {chantier.latitude && chantier.longitude && (
                    <Card title="Localisation GPS" size="small" style={{ marginBottom: 16 }}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Latitude">{chantier.latitude}</Descriptions.Item>
                        <Descriptions.Item label="Longitude">{chantier.longitude}</Descriptions.Item>
                      </Descriptions>
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={`https://www.google.com/maps?q=${chantier.latitude},${chantier.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Voir sur Google Maps
                        </a>
                      </div>
                    </Card>
                  )}

                  <Card title="Informations système" size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Créé le">
                        {chantier.createdAt ? new Date(chantier.createdAt).toLocaleDateString('fr-FR') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Modifié le">
                        {chantier.updatedAt ? new Date(chantier.updatedAt).toLocaleDateString('fr-FR') : '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            ),
          },

          /* ─────────── SUIVI COMMERCIAL ─────────── */
          {
            key: 'suivi',
            label: <span><LineChartOutlined /> Suivi commercial</span>,
            children: (
              <Row gutter={16}>
                <Col span={16}>
                  <Card title="Pipeline & Opportunité" size="small" style={{ marginBottom: 16 }}>
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Stade">
                        {stadeOpt ? <Tag color={stadeOpt.color}>{stadeOpt.label}</Tag> : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut commercial">
                        {statutOpt ? <Tag color={statutOpt.color}>{statutOpt.label}</Tag> : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Niveau d'opportunité">
                        {niveauOpt ? <Tag color={niveauOpt.color}>{niveauOpt.label}</Tag> : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Déciseur">
                        {chantier.deciseur || '-'}
                      </Descriptions.Item>
                      {chantier.niveauOpportunite === 'FERME' && chantier.concurrentFerme && (
                        <Descriptions.Item label="Concurrent" span={2}>
                          <Tag color="red">{chantier.concurrentFerme}</Tag>
                        </Descriptions.Item>
                      )}
                      {chantier.stadeChangedAt && (
                        <Descriptions.Item label="Stade modifié le" span={2}>
                          {new Date(chantier.stadeChangedAt).toLocaleDateString('fr-FR')}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>

                  <Card title="Prochaine action" size="small">
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Action">
                        {chantier.actionSuivante || <Text type="secondary">Non définie</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date">
                        {chantier.dateProchaineAction ? (
                          <Space>
                            <CalendarOutlined />
                            {new Date(chantier.dateProchaineAction).toLocaleDateString('fr-FR')}
                          </Space>
                        ) : '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col span={8}>
                  {chantier.assignedTo && (
                    <Card title="Commercial assigné" size="small">
                      <Text strong>{chantier.assignedTo.fullName}</Text>
                    </Card>
                  )}
                </Col>
              </Row>
            ),
          },

          /* ─────────── ACTEURS ─────────── */
          {
            key: 'acteurs',
            label: (
              <span>
                <TeamOutlined /> Acteurs
                {(chantier.acteurs?.length ?? 0) > 0 && (
                  <Badge count={chantier.acteurs?.length ?? 0} size="small" style={{ marginLeft: 6 }} />
                )}
              </span>
            ),
            children: (
              <Card
                size="small"
                extra={
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setAddActeurOpen(true)}>
                    Ajouter
                  </Button>
                }
              >
                {(chantier.acteurs?.length ?? 0) > 0 ? (
                  <Table
                    columns={acteurColumns}
                    dataSource={chantier.acteurs ?? []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun acteur lié à ce chantier" />
                )}
              </Card>
            ),
          },

          /* ─────────── PHOTOS ─────────── */
          {
            key: 'photos',
            label: <span><PictureOutlined /> Photos</span>,
            children: <ChantierPhotosSection chantierId={chantier.id} />,
          },

          /* ─────────── DEVIS ─────────── */
          {
            key: 'devis',
            label: (
              <span>
                <FileTextOutlined /> Devis
                {devis.length > 0 && (
                  <Badge count={devis.length} size="small" style={{ marginLeft: 6 }} />
                )}
              </span>
            ),
            children: (
              <Card size="small">
                {loadingDevis ? (
                  <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
                ) : devis.length > 0 ? (
                  <Table
                    columns={devisColumns}
                    dataSource={devis}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun devis lié à ce chantier" />
                )}
              </Card>
            ),
          },

          /* ─────────── IA ─────────── */
          {
            key: 'ia',
            label: <span><RobotOutlined /> Analyse IA</span>,
            children: <ChantierAiPanel chantier={chantier} onUpdate={load} />,
          },

        ]}
      />

      {/* ── Modals ── */}
      <ChantierFormModal
        open={editModalOpen}
        chantierId={chantier.id}
        onClose={(refresh) => { setEditModalOpen(false); if (refresh) load(); }}
      />

      <EchantillonModal
        open={echantillonOpen}
        chantierId={chantier.id}
        chantierNom={chantier.nom}
        onClose={() => setEchantillonOpen(false)}
      />

      <Modal
        title="Ajouter un acteur clé"
        open={addActeurOpen}
        onOk={handleAddActeur}
        onCancel={() => { acteurForm.resetFields(); setAddActeurOpen(false); }}
        okText="Ajouter"
        cancelText="Annuler"
        confirmLoading={savingActeur}
      >
        <Form form={acteurForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="roleActeur" label="Rôle" rules={[{ required: true, message: 'Le rôle est obligatoire' }]}>
            <Select placeholder="Sélectionner un rôle" options={ROLE_ACTEUR_OPTIONS} />
          </Form.Item>
          <Form.Item name="nom" label="Nom / Société" rules={[{ required: true, message: 'Le nom est obligatoire' }]}>
            <Input placeholder="Ex : Bureau d'études ALFA" maxLength={255} />
          </Form.Item>
          <Form.Item name="telephone" label="Téléphone">
            <Input placeholder="+212 6xx xxx xxx" maxLength={30} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
