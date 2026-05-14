import { useState, useRef, useCallback } from 'react';
import {
  Modal, Upload, Button, Row, Col, Form, Input, Select,
  Space, Alert, Spin, Typography, Tag, Divider, message,
} from 'antd';
import {
  CameraOutlined, ScanOutlined, CheckCircleOutlined,
  StopOutlined, UserOutlined, PhoneOutlined, MailOutlined,
} from '@ant-design/icons';
import { scanCarteVisite, CarteVisiteData } from '@/services/scanCarteVisite';

const { Text } = Typography;
const { Dragger } = Upload;

export interface ContactInsert {
  nom: string;
  societe?: string;
  poste?: string;
  telephone?: string;
  email?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Appelé avec les données confirmées */
  onInsert: (contact: ContactInsert) => void;
  /** Options de rôle spécifiques au contexte (chantier, compte…) */
  roleOptions?: { value: string; label: string }[];
  /** Titre du modal */
  title?: string;
}

const DEFAULT_ROLE_OPTIONS = [
  { value: 'PROMOTEUR',      label: 'Promoteur' },
  { value: 'INSTALLATEUR',   label: 'Installateur' },
  { value: 'ARCHITECTE',     label: 'Architecte' },
  { value: 'BET',            label: "Bureau d'étude" },
  { value: 'MAITRE_OUVRAGE', label: "Maître d'ouvrage" },
  { value: 'MAITRE_OEUVRE',  label: "Maître d'œuvre" },
  { value: 'ENTREPRISE_GC',  label: 'Entreprise GC' },
  { value: 'AUTRE',          label: 'Autre' },
];

export default function CarteVisiteScanModal({ open, onClose, onInsert, roleOptions, title }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<CarteVisiteData | null>(null);
  const [overloaded, setOverloaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [form] = Form.useForm();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const roles = roleOptions ?? DEFAULT_ROLE_OPTIONS;

  const reset = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setFile(null);
    setPreviewUrl(null);
    setLoading(false);
    setExtracted(null);
    setOverloaded(false);
    form.resetFields();
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setExtracted(null);
    setOverloaded(false);
    form.resetFields();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      }, 100);
    } catch {
      message.error('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      handleFileSelect(new File([blob], 'carte-visite.jpg', { type: 'image/jpeg' }));
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setOverloaded(false);
    try {
      const data = await scanCarteVisite(file);
      setExtracted(data);
      form.setFieldsValue({
        nom:       data.nom       || '',
        societe:   data.societe   || '',
        poste:     data.poste     || '',
        telephone: data.telephoneMobile || data.telephone || '',
        email:     data.email     || '',
      });
    } catch (err: any) {
      if (err?.isOverloaded) {
        setOverloaded(true);
      } else {
        message.error(err?.message || 'Erreur lors de l\'analyse');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const vals = await form.validateFields();
      onInsert({ nom: vals.nom, societe: vals.societe, poste: vals.poste || vals.role, telephone: vals.telephone, email: vals.email });
      handleClose();
    } catch { /* validation */ }
  };

  return (
    <Modal
      title={
        <Space>
          <ScanOutlined style={{ color: '#722ed1' }} />
          <span>{title ?? 'Scan carte de visite'}</span>
          <Tag color="purple" style={{ fontSize: 10 }}>IA Vision</Tag>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={760}
      footer={null}
      destroyOnHidden
    >
      <Row gutter={20}>
        {/* ── Colonne gauche : photo ── */}
        <Col span={10}>
          {/* Caméra */}
          {cameraActive && (
            <div style={{ marginBottom: 12 }}>
              <video ref={videoRef} style={{ width: '100%', borderRadius: 8, border: '2px solid #722ed1', background: '#000' }} playsInline muted />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                <Button type="primary" icon={<CameraOutlined />} onClick={capturePhoto} style={{ background: '#722ed1', borderColor: '#722ed1' }}>Capturer</Button>
                <Button icon={<StopOutlined />} onClick={stopCamera} danger>Annuler</Button>
              </div>
            </div>
          )}

          {/* Upload */}
          {!cameraActive && !previewUrl && (
            <>
              <Dragger accept="image/*" showUploadList={false} beforeUpload={f => { handleFileSelect(f); return false; }} style={{ borderColor: '#722ed1' }}>
                <div style={{ padding: '24px 12px' }}>
                  <ScanOutlined style={{ fontSize: 36, color: '#722ed1' }} />
                  <br /><br />
                  <Text style={{ color: '#722ed1', fontWeight: 500 }}>Déposez la carte ici</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>JPG, PNG, WebP</Text>
                </div>
              </Dragger>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <Button icon={<CameraOutlined />} onClick={startCamera} style={{ borderColor: '#722ed1', color: '#722ed1' }}>
                  Prendre une photo
                </Button>
              </div>
            </>
          )}

          {/* Aperçu */}
          {!cameraActive && previewUrl && (
            <div>
              <img src={previewUrl} alt="Carte de visite" style={{ width: '100%', borderRadius: 8, border: '2px solid #722ed1', boxShadow: '0 2px 12px rgba(114,46,209,0.2)' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                <Button size="small" onClick={() => { setFile(null); setPreviewUrl(null); setExtracted(null); form.resetFields(); }}>
                  Changer
                </Button>
                <Button size="small" icon={<CameraOutlined />} onClick={() => { setFile(null); setPreviewUrl(null); startCamera(); }} style={{ borderColor: '#722ed1', color: '#722ed1' }}>
                  Caméra
                </Button>
              </div>

              {/* Bouton analyser */}
              {!extracted && !overloaded && (
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  {loading
                    ? <div style={{ padding: '10px', background: '#f9f0ff', borderRadius: 8, border: '1px solid #d3adf7' }}>
                        <Spin size="small" /><Text style={{ marginLeft: 8, color: '#722ed1' }}>Analyse en cours…</Text>
                      </div>
                    : <Button type="primary" icon={<ScanOutlined />} onClick={analyze} style={{ background: '#722ed1', borderColor: '#722ed1', width: '100%' }}>
                        Analyser avec l'IA
                      </Button>
                  }
                </div>
              )}

              {overloaded && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 12, fontSize: 12 }}
                  message="IA surchargée"
                  description={<span>Remplissez manuellement. <Button size="small" style={{ marginTop: 4 }} onClick={analyze}>Réessayer</Button></span>}
                />
              )}

              {extracted && (
                <Alert type="success" showIcon icon={<CheckCircleOutlined />} message="Données extraites — vérifiez et confirmez" style={{ marginTop: 12, fontSize: 12 }} />
              )}
            </div>
          )}
        </Col>

        {/* ── Colonne droite : formulaire ── */}
        <Col span={14}>
          <Form form={form} layout="vertical" size="small">
            <Form.Item name="nom" label={<><UserOutlined /> Nom complet</>} rules={[{ required: true, message: 'Nom requis' }]}>
              <Input placeholder="Ex : Mohammed Benali" />
            </Form.Item>
            <Form.Item name="societe" label="Société">
              <Input placeholder="Ex : BTP Solutions SARL" />
            </Form.Item>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="role" label="Rôle dans le projet">
                  <Select options={roles} allowClear placeholder="Sélectionner…" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="poste" label="Poste / Fonction">
                  <Input placeholder="Ex : Architecte" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="telephone" label={<><PhoneOutlined /> Téléphone</>}>
              <Input placeholder="Ex : +212 6 00 000 000" />
            </Form.Item>
            <Form.Item name="email" label={<><MailOutlined /> Email</>}>
              <Input placeholder="Ex : contact@societe.ma" />
            </Form.Item>

            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleClose}>Annuler</Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirm}
                disabled={!file && !overloaded}
                style={{ background: '#722ed1', borderColor: '#722ed1' }}
              >
                Insérer le contact
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Modal>
  );
}
