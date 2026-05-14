import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal, Upload, Button, Row, Col, Card, Typography, Spin, Tag,
  Form, Input, Select, InputNumber, Space, Alert, Divider, Steps, Table, message,
} from 'antd';
import {
  CameraOutlined, RobotOutlined, CheckCircleOutlined,
  ArrowRightOutlined, EditOutlined, StopOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons';
import type { CreateChantierRequest } from '@/api/chantiers';
import { scanChantierImage, ChantierIntervenant } from '@/services/scanChantier';

const { Text, Title } = Typography;
const { Dragger } = Upload;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreateChantier: (prefilled: Partial<CreateChantierRequest>) => void;
}

const STADE_OPTIONS = [
  { value: 'ETUDE_CONCEPTION',  label: 'Étude / Conception' },
  { value: 'AUTORISATION',      label: 'Autorisation' },
  { value: 'GROS_OEUVRE',       label: 'Gros œuvre' },
  { value: 'SECOND_OEUVRE',     label: 'Second œuvre' },
  { value: 'PHASE_EQUIPEMENT',  label: 'Phase équipement' },
  { value: 'LIVRAISON',         label: 'Livraison' },
  { value: 'CLOTURE',           label: 'Clôturé' },
];

const TYPE_OPTIONS = [
  { value: 'RESIDENTIEL_COLLECTIF',    label: 'Résidentiel Collectif' },
  { value: 'RESIDENTIEL_INDIVIDUEL',   label: 'Résidentiel Individuel' },
  { value: 'TERTIAIRE_INSTITUTIONNEL', label: 'Tertiaire / Institutionnel' },
  { value: 'COMMERCIAL',               label: 'Commercial' },
  { value: 'INDUSTRIEL',               label: 'Industriel' },
  { value: 'INFRASTRUCTURE',           label: 'Infrastructure' },
];

const SOUS_TYPE_OPTIONS = [
  { value: 'LOGEMENT_SOCIAL',   label: 'Logement Social' },
  { value: 'MOYEN_STANDING',    label: 'Moyen Standing' },
  { value: 'HAUT_STANDING',     label: 'Haut Standing' },
  { value: 'VILLAS',            label: 'Villas / Lotissement' },
  { value: 'HOTEL',             label: 'Hôtel' },
  { value: 'BUREAUX',           label: 'Bureaux' },
  { value: 'CENTRE_COMMERCIAL', label: 'Centre Commercial' },
  { value: 'MOSQUEE',           label: 'Mosquée' },
  { value: 'ECOLE',             label: 'École' },
  { value: 'HOPITAL',           label: 'Hôpital' },
  { value: 'AUTRE',             label: 'Autre' },
];

// Map AI free-text role to enum values
function mapRole(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('architecte') || r.includes('architect')) return 'ARCHITECTE';
  if (r.includes('bureau') || r.includes('bet') || r.includes('étude') || r.includes('etude')) return 'BET';
  if (r.includes('maître d\'ouvrage') || r.includes('maitre d\'ouvrage') || r.includes('mo')) return 'MAITRE_OUVRAGE';
  if (r.includes('maître d\'œuvre') || r.includes('maitre d\'oeuvre') || r.includes('moe')) return 'MAITRE_OEUVRE';
  if (r.includes('entreprise') || r.includes('gc') || r.includes('général') || r.includes('general')) return 'ENTREPRISE_GC';
  if (r.includes('installateur')) return 'INSTALLATEUR';
  if (r.includes('promoteur')) return 'PROMOTEUR';
  return 'AUTRE';
}

interface IntervenantRow extends ChantierIntervenant {
  key: string;
}

const RETRY_DELAYS: number[] = []; // pas de délai — échec IA → saisie manuelle immédiate

export default function ChantierFromPhotoModal({ open, onClose, onCreateChantier }: Props) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<Record<string, any> | null>(null);
  const [intervenants, setIntervenants] = useState<IntervenantRow[]>([]);
  const [analyzeError, setAnalyzeError] = useState<'overloaded' | 'generic' | null>(null);
  const [analyzeErrorMsg, setAnalyzeErrorMsg] = useState<string>('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryMax]    = useState(1);  // 1 tentative → fallback manuel immédiat
  const [countdown, setCountdown] = useState(0);
  const [manualMode, setManualMode] = useState(false);   // fallback saisie manuelle
  const [manualReason, setManualReason] = useState<'overloaded' | 'error'>('overloaded');
  const cancelRetryRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [form] = Form.useForm();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Compte à rebours affiché pendant le délai entre 2 tentatives
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      // attach stream after render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      message.error('Impossible d\'accéder à la caméra');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const f = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      handleFileSelect(f);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const reset = () => {
    stopCamera();
    cancelRetryRef.current = true;
    setStep(0);
    setFile(null);
    setPreviewUrl(null);
    setExtracted(null);
    setIntervenants([]);
    setLoading(false);
    setAnalyzeError(null);
    setAnalyzeErrorMsg('');
    setRetryAttempt(0);
    setCountdown(0);
    setManualMode(false);
    setManualReason('overloaded');
    form.resetFields();
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileSelect = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const doOnceAnalyze = async (file: File): Promise<'ok' | 'overloaded' | 'error'> => {
    try {
      const data = await scanChantierImage(file);
      setExtracted(data as any);

      // Populate intervenants table
      if (data.intervenants && data.intervenants.length > 0) {
        setIntervenants(data.intervenants.map((iv, i) => ({ ...iv, key: String(i) })));
      }

      form.setFieldsValue({
        nom:            data.nomChantier       || '',
        ville:          data.ville             || '',
        adresse:        data.adresseChantier   || '',
        typeProjet:     data.typeProjet        || undefined,
        sousTypeProjet: data.sousTypeProjet    || undefined,
        stadeChantier:  data.stadeChantier     || undefined,
        nombreUnites:   data.nombreUnites      || undefined,
        superficie:     data.superficie        || undefined,
        promoteur:      data.maitrOuvrage      || '',
        referenceProjet: data.referenceProjet  || '',
        montantMarche:  data.montantMarche     || '',
      });
      return 'ok';
    } catch (err: any) {
      if (err?.isOverloaded) return 'overloaded';
      setAnalyzeErrorMsg(err?.message || 'Vérifiez votre connexion.');
      return 'error';
    }
  };

  const analyze = async () => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAnalyzeError('generic');
      setAnalyzeErrorMsg(`Image trop volumineuse (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 5 MB.`);
      return;
    }

    cancelRetryRef.current = false;
    setAnalyzeError(null);
    setAnalyzeErrorMsg('');
    setRetryAttempt(0);
    setCountdown(0);

    for (let attempt = 1; attempt <= retryMax; attempt++) {
      if (cancelRetryRef.current) return;
      setRetryAttempt(attempt);
      setLoading(true);

      const result = await doOnceAnalyze(file);
      setLoading(false);

      if (result === 'ok') {
        setRetryAttempt(0);
        setStep(1);
        return;
      }
      if (result === 'error') {
        setRetryAttempt(0);
        setManualReason('error');
        setManualMode(true);
        setStep(1);
        return;
      }

      // result === 'overloaded' → saisie manuelle immédiate (pas d'attente)
      setRetryAttempt(0);
      setCountdown(0);
      setManualReason('overloaded');
      setManualMode(true);
      setStep(1);
    }
  };

  const handleConfirm = () => {
    const vals = form.getFieldsValue();
    onCreateChantier({
      nom:            vals.nom,
      ville:          vals.ville,
      adresse:        vals.adresse      || undefined,
      typeProjet:     vals.typeProjet,
      sousTypeProjet: vals.sousTypeProjet,
      stadeChantier:  vals.stadeChantier,
      nombreUnites:   vals.nombreUnites,
      promoteur:      vals.promoteur    || undefined,
      acteurs: intervenants
        .filter(iv => iv.nom?.trim())
        .map(iv => ({
          roleActeur: mapRole(iv.role),
          nom:        iv.nom.trim(),
          telephone:  iv.telephone || undefined,
        })),
    });
    handleClose();
  };

  return (
    <Modal
      title={
        <Space>
          <CameraOutlined style={{ color: '#722ed1' }} />
          <span>Créer un chantier depuis une photo</span>
          <Tag color="purple" style={{ fontSize: 10 }}>IA Vision</Tag>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={980}
      footer={null}
      destroyOnHidden
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Photo', icon: <CameraOutlined /> },
          { title: 'Vérification', icon: <EditOutlined /> },
        ]}
      />

      {/* ── STEP 0: Upload / Camera ────────────────────────────── */}
      {step === 0 && (
        <div>
          {/* Flux caméra en direct */}
          {cameraActive && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%', maxHeight: 360, borderRadius: 8,
                  border: '2px solid #722ed1', background: '#000',
                }}
                playsInline
                muted
              />
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  onClick={capturePhoto}
                  style={{ background: '#722ed1', borderColor: '#722ed1' }}
                >
                  Capturer
                </Button>
                <Button icon={<StopOutlined />} onClick={stopCamera} danger>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Upload zone (masquée si caméra active) */}
          {!cameraActive && !previewUrl && (
            <>
              <Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={f => { handleFileSelect(f); return false; }}
                style={{ borderColor: '#722ed1' }}
              >
                <div style={{ padding: '32px 20px' }}>
                  <CameraOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
                  <br />
                  <Title level={5} style={{ color: '#722ed1' }}>Déposez votre photo ici</Title>
                  <Text type="secondary">ou cliquez pour sélectionner (JPG, PNG, WEBP)</Text>
                </div>
              </Dragger>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button
                  icon={<CameraOutlined />}
                  onClick={startCamera}
                  style={{ borderColor: '#722ed1', color: '#722ed1' }}
                >
                  Prendre une photo avec la caméra
                </Button>
              </div>
            </>
          )}

          {/* Aperçu photo capturée / sélectionnée */}
          {!cameraActive && previewUrl && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxHeight: 360, maxWidth: '100%',
                  borderRadius: 8, border: '2px solid #722ed1',
                  boxShadow: '0 4px 20px rgba(114,46,209,0.2)',
                }}
              />
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Button
                  size="small"
                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                >
                  Changer de photo
                </Button>
                <Button
                  size="small"
                  icon={<CameraOutlined />}
                  onClick={() => { setFile(null); setPreviewUrl(null); startCamera(); }}
                  style={{ borderColor: '#722ed1', color: '#722ed1' }}
                >
                  Reprendre avec caméra
                </Button>
              </div>
            </div>
          )}

          {!cameraActive && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>

              {/* Bouton principal — masqué pendant le retry automatique */}
              {retryAttempt === 0 && !countdown && (
                <Button
                  type="primary"
                  size="large"
                  icon={<RobotOutlined />}
                  disabled={!file}
                  onClick={analyze}
                  style={{ background: '#722ed1', borderColor: '#722ed1', minWidth: 200 }}
                >
                  Analyser avec l'IA
                </Button>
              )}

              {/* État : analyse en cours (tentative N) */}
              {loading && retryAttempt > 0 && (
                <div style={{
                  marginTop: 8, padding: '16px 20px',
                  background: '#f9f0ff', borderRadius: 10,
                  border: '1px solid #d3adf7', textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Spin size="small" />
                    <Text strong style={{ color: '#722ed1' }}>
                      Tentative {retryAttempt}/{retryMax} — Analyse en cours...
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Analyse du document en cours…
                  </Text>
                </div>
              )}

              {/* Plus d'erreurs bloquantes — fallback manuel automatique */}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 1: Review & Edit (IA ou Manuel) ──────────────── */}
      <div style={{ display: step === 1 && (extracted || manualMode) ? 'block' : 'none' }}>
        <Row gutter={20}>
          {/* Image preview */}
          <Col span={10}>
            {previewUrl && (
              <div style={{ position: 'sticky', top: 0 }}>
                <img
                  src={previewUrl}
                  alt="Chantier"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
                />
                {extracted && (extracted.description || extracted.referenceProjet || extracted.montantMarche || extracted.adresseChantier) && (
                  <Card
                    size="small"
                    style={{ marginTop: 12, background: '#f9f0ff', border: '1px solid #d3adf7' }}
                    title={<span style={{ fontSize: 12, color: '#722ed1' }}>Résumé extrait</span>}
                  >
                    {extracted.description && (
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Objet : </Text>
                        <Text style={{ fontSize: 11 }}>{extracted.description}</Text>
                      </div>
                    )}
                    {extracted.referenceProjet && (
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Réf. : </Text>
                        <Text style={{ fontSize: 11 }}>{extracted.referenceProjet}</Text>
                      </div>
                    )}
                    {extracted.montantMarche && (
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Montant : </Text>
                        <Text style={{ fontSize: 11 }}>{extracted.montantMarche}</Text>
                      </div>
                    )}
                    {extracted.adresseChantier && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>Adresse : </Text>
                        <Text style={{ fontSize: 11 }}>{extracted.adresseChantier}</Text>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}
          </Col>

          {/* Editable form */}
          <Col span={14}>
            {manualMode ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message={manualReason === 'overloaded' ? 'IA surchargée — Saisie manuelle' : 'IA indisponible — Saisie manuelle'}
                description={
                  <span>
                    {manualReason === 'overloaded'
                      ? 'Le service IA est momentanément surchargé. Lisez le document RC et remplissez le formulaire ci-dessous.'
                      : 'L\'analyse a échoué. Remplissez le formulaire manuellement en vous basant sur le document.'}
                    <Button
                      size="small"
                      style={{ marginLeft: 8, marginTop: 4 }}
                      onClick={() => { setManualMode(false); setManualReason('overloaded'); setStep(0); }}
                    >
                      Réessayer l'IA
                    </Button>
                  </span>
                }
              />
            ) : (
              <Alert
                type="success"
                message="Informations extraites par l'IA. Vérifiez et corrigez si nécessaire."
                style={{ marginBottom: 16 }}
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
            <Form form={form} layout="vertical" size="small">
              <Form.Item name="nom" label="Nom du chantier" rules={[{ required: true }]}>
                <Input placeholder="Ex : Résidence En Nour" />
              </Form.Item>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="referenceProjet" label="N° dossier / permis">
                    <Input placeholder="Ex : PC-2024-0123" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="montantMarche" label="Montant marché">
                    <Input placeholder="Ex : 15 000 000 DH" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="ville" label="Ville">
                    <Input placeholder="Ex : Rabat" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="nombreUnites" label="Nb. unités">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="superficie" label="Superficie (m²)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="stadeChantier" label="Stade">
                    <Select options={STADE_OPTIONS} allowClear placeholder="Sélectionner..." />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="typeProjet" label="Type de projet">
                    <Select options={TYPE_OPTIONS} allowClear placeholder="Sélectionner..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="sousTypeProjet" label="Sous-type">
                    <Select options={SOUS_TYPE_OPTIONS} allowClear placeholder="Sélectionner..." />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="promoteur" label="Promoteur / Maître d'ouvrage">
                <Input placeholder="Ex : Résidence En Nour SARL" />
              </Form.Item>
            </Form>

            {/* ── Intervenants extraits ── */}
            <Divider style={{ margin: '12px 0' }}>
              <Text style={{ fontSize: 12, color: '#722ed1' }}>Intervenants détectés</Text>
            </Divider>
            <Table
              size="small"
              dataSource={intervenants}
              pagination={false}
              rowKey="key"
              locale={{ emptyText: 'Aucun intervenant extrait' }}
              style={{ marginBottom: 8 }}
              columns={[
                {
                  title: 'Rôle',
                  dataIndex: 'role',
                  width: 120,
                  render: (val: string, rec: IntervenantRow) => (
                    <Input
                      size="small"
                      value={val}
                      onChange={e => setIntervenants(prev =>
                        prev.map(r => r.key === rec.key ? { ...r, role: e.target.value } : r)
                      )}
                    />
                  ),
                },
                {
                  title: 'Nom / Société',
                  dataIndex: 'nom',
                  render: (val: string, rec: IntervenantRow) => (
                    <Input
                      size="small"
                      value={val}
                      placeholder={rec.societe || ''}
                      onChange={e => setIntervenants(prev =>
                        prev.map(r => r.key === rec.key ? { ...r, nom: e.target.value } : r)
                      )}
                    />
                  ),
                },
                {
                  title: 'Tél.',
                  dataIndex: 'telephone',
                  width: 120,
                  render: (val: string, rec: IntervenantRow) => (
                    <Input
                      size="small"
                      value={val || ''}
                      onChange={e => setIntervenants(prev =>
                        prev.map(r => r.key === rec.key ? { ...r, telephone: e.target.value } : r)
                      )}
                    />
                  ),
                },
                {
                  title: '',
                  width: 32,
                  render: (_: any, rec: IntervenantRow) => (
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setIntervenants(prev => prev.filter(r => r.key !== rec.key))}
                    />
                  ),
                },
              ]}
            />
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIntervenants(prev => [
                ...prev,
                { key: String(Date.now()), role: '', nom: '', societe: undefined }
              ])}
              style={{ marginBottom: 12 }}
            >
              Ajouter un intervenant
            </Button>

            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setStep(0)}>Retour</Button>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={handleConfirm}
                style={{ background: '#722ed1', borderColor: '#722ed1' }}
              >
                Créer le chantier
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    </Modal>
  );
}
