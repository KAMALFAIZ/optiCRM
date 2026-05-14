import { useState, useEffect, useRef } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  App, Form, Divider, Steps, Tooltip, Progress,
} from 'antd';
import {
  CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined, DatabaseOutlined, CodeOutlined,
  AppstoreOutlined, SaveOutlined, SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { sageQueryApi } from '../../../api/sageQuery';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

const SAGE_HEADERS = ['AR_Ref', 'AR_Design', 'AR_PrixVen', 'AR_PrixAch', 'AR_Famille', 'AR_Sommeil'];

const DEFAULT_SQL = `SELECT
  AR_Ref,
  ISNULL(AR_Design, '')        AR_Design,
  ISNULL(AR_PrixVen, 0)       AR_PrixVen,
  ISNULL(AR_PrixAch, 0)       AR_PrixAch,
  ISNULL(FA_CodeFamille, '')  AR_Famille,
  ISNULL(AR_Sommeil, 0)       AR_Sommeil
FROM [dbo].[F_ARTICLE]
WHERE ISNULL(AR_Sommeil, 0) = 0`;

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Référence',
    dataIndex: 'rawData',
    width: 120,
    render: (raw: any) => {
      const ref = raw?.ar_ref ?? raw?.AR_Ref ?? '';
      return ref ? <Text strong className="font-mono text-xs">{ref}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Désignation',
    dataIndex: 'rawData',
    ellipsis: true,
    width: 200,
    render: (raw: any) => {
      const name = raw?.ar_design ?? raw?.AR_Design ?? '';
      return name ? <Text>{name}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Prix vente / achat',
    dataIndex: 'rawData',
    width: 140,
    align: 'right' as const,
    render: (raw: any) => {
      const pv = raw?.ar_prixven ?? raw?.AR_PrixVen;
      const pa = raw?.ar_prixach ?? raw?.AR_PrixAch;
      const fmt = (v: any) => v != null ? parseFloat(String(v).replace(',', '.')).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) : '—';
      return (
        <div>
          <Text className="block text-xs">Vente : {fmt(pv)}</Text>
          <Text type="secondary" className="block text-xs">Achat : {fmt(pa)}</Text>
        </div>
      );
    },
  },
  {
    title: 'Famille',
    dataIndex: 'rawData',
    width: 130,
    render: (raw: any) => {
      const famille = raw?.ar_famille ?? raw?.AR_Famille ?? '';
      return famille ? <Tag color="green" className="text-xs">{famille}</Tag> : <Text type="secondary">—</Text>;
    },
  },
];

export default function ProductsSyncTab() {
  const { message } = App.useApp();
  const [pastedData, setPastedData] = useState('');
  const [label, setLabel] = useState('');
  const [sqlQuery, setSqlQuery] = useState(() => localStorage.getItem('sage.query.products') || DEFAULT_SQL);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState('');
  const [request, setRequest] = useState<SageSyncRequestDto | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling toutes les 3s quand le statut est PROCESSING
  useEffect(() => {
    if (request?.status === 'PROCESSING') {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await sageIntegrationApi.getRequest(request.id);
          setRequest(updated);
          if (updated.status === 'DONE' || updated.status === 'ERROR') {
            clearInterval(pollRef.current!);
            setApplying(false);
            setStep(2);
            if (updated.status === 'DONE') {
              message.success(`Import terminé — ${updated.successItems} produit(s) synchronisé(s), ${updated.skipItems} identique(s), ${updated.errorItems} erreur(s).`);
            } else {
              message.error(`Import en erreur — ${updated.errorItems} erreur(s).`);
            }
          }
        } catch { /* ignore polling errors */ }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [request?.status, request?.id]);

  const handlePreview = async () => {
    if (!pastedData.trim()) { message.warning('Collez des données Sage avant de prévisualiser.'); return; }
    const rows = parsePastedData(pastedData, SAGE_HEADERS);
    if (!rows.length) { message.error('Aucune ligne valide détectée.'); return; }
    setLoading(true);
    try {
      const req = await sageIntegrationApi.createRequest({ entityType: 'PRODUCTS', label: label || undefined, rows });
      setRequest(req); setStep(1);
      message.success(`Prévisualisation générée : ${req.totalItems} produit(s) analysé(s).`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.message || 'Erreur lors de la prévisualisation.'); }
    finally { setLoading(false); }
  };

  const handleImportFromSage = async () => {
    if (!sqlQuery.trim()) { message.warning('La requête SQL est vide.'); return; }
    setImporting(true);
    try {
      setImportStep('Connexion Sage et récupération des données...');
      const rows = await sageQueryApi.executeQuery(sqlQuery, 'PRODUCTS');
      if (!rows.length) { message.warning('Aucun produit trouvé dans Sage.'); return; }

      setImportStep(`${rows.length} articles récupérés — Analyse du matching en cours...`);
      const req = await sageIntegrationApi.createRequest({
        entityType: 'PRODUCTS',
        label: label || `Import Produits Sage — ${new Date().toLocaleDateString('fr-FR')}`,
        sourceFormat: 'SQL',
        rows,
      });
      setRequest(req); setStep(1);
      message.success(`${rows.length} produit(s) importés depuis Sage — prêt à appliquer.`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.message || 'Erreur lors de l\'import.'); }
    finally { setImporting(false); setImportStep(''); }
  };

  const handleApply = async () => {
    if (!request) return;
    setApplying(true);
    try {
      // applyRequest retourne immédiatement (PROCESSING) — le polling prend le relais
      const updated = await sageIntegrationApi.applyRequest(request.id);
      setRequest(updated);
      message.info(`Import lancé en arrière-plan — ${request.totalItems} produit(s) en cours de traitement...`);
    } catch (e: any) {
      setApplying(false);
      message.error(e?.response?.data?.error?.message || e?.message || 'Erreur lors de l\'application.');
    }
  };

  const handleSaveQuery = () => {
    localStorage.setItem('sage.query.products', sqlQuery);
    message.success('Requête produits enregistrée');
  };

  const handleReset = () => { setPastedData(''); setLabel(''); setRequest(null); setStep(0); setImportStep(''); };

  const progressPct = request && request.totalItems > 0
    ? Math.round((request.successItems + request.errorItems + request.skipItems) / request.totalItems * 100)
    : 0;

  return (
    <div>
      <Steps size="small" current={step} className="mb-6" items={[
        { title: 'Saisie / Requête', icon: <CloudUploadOutlined /> },
        { title: 'Prévisualiser', icon: <InfoCircleOutlined /> },
        { title: 'Appliquer', icon: <CheckCircleOutlined /> },
      ]} />

      {step === 0 && (
        <Card size="small" title={<Space><AppstoreOutlined style={{ color: '#059669' }} /><span>Import Produits Sage 100 (F_ARTICLE)</span></Space>}>
          <Form layout="vertical">
            <Form.Item label="Label de la requête">
              <Input placeholder="Ex : Import produits Mars 2026" value={label} onChange={e => setLabel(e.target.value)} style={{ maxWidth: 400 }} />
            </Form.Item>

            <Collapse className="mb-4" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }} items={[{
              key: 'sql',
              label: <Space><DatabaseOutlined style={{ color: '#059669' }} /><Text strong style={{ color: '#059669' }}>Import direct depuis Sage SQL Server</Text><Tag color="green">Recommandé</Tag></Space>,
              children: (
                <div>
                  <Alert type="info" showIcon icon={<CodeOutlined />} style={{ marginBottom: 12 }}
                    message="Colonnes mappées"
                    description="AR_Ref (clé), AR_Design (désignation), AR_PrixVen (prix vente), AR_PrixAch (prix achat), AR_Famille (famille/catégorie), AR_Sommeil (0=actif, 1=sommeil)." />
                  <TextArea rows={9} value={sqlQuery} onChange={e => setSqlQuery(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }} />
                  {importing && importStep && (
                    <Alert type="info" showIcon icon={<SyncOutlined spin />} message={importStep} style={{ marginBottom: 12 }} />
                  )}
                  <Space>
                    <Tooltip title="Exécute la requête sur le serveur Sage et prépare l'import">
                      <Button type="primary" icon={importing ? <SyncOutlined spin /> : <DatabaseOutlined />} loading={importing} onClick={handleImportFromSage} style={{ background: '#059669', borderColor: '#059669' }}>
                        Exécuter et importer depuis Sage
                      </Button>
                    </Tooltip>
                    <Tooltip title="Enregistrer la requête SQL pour les prochaines sessions">
                      <Button icon={<SaveOutlined />} onClick={handleSaveQuery}>Enregistrer la requête</Button>
                    </Tooltip>
                  </Space>
                </div>
              ),
            }]} />

            <Form.Item label="Données Sage (copier-coller depuis Excel)">
              <TextArea rows={6} placeholder={`AR_Ref\tAR_Design\tAR_PrixVen\tAR_PrixAch\tAR_Famille\nART001\tRobinet mitigeur\t245.00\t180.00\tROBINETTERIE`}
                value={pastedData} onChange={e => setPastedData(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12 }} />
            </Form.Item>

            <Button type="primary" icon={<InfoCircleOutlined />} loading={loading} onClick={handlePreview} disabled={!pastedData.trim()} style={{ background: '#059669', borderColor: '#059669' }}>
              Prévisualiser le matching
            </Button>
          </Form>
        </Card>
      )}

      {step >= 1 && request && (
        <Card size="small"
          title={<Space><InfoCircleOutlined style={{ color: '#059669' }} /><span>Prévisualisation — {request.totalItems} produit(s)</span>{request.label && <Tag>{request.label}</Tag>}</Space>}
          extra={<Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleReset} disabled={applying}>Nouvelle import</Button>
            {request.status === 'PENDING' && (
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={applying} onClick={handleApply} style={{ background: '#059669', borderColor: '#059669' }}>
                Appliquer la synchronisation
              </Button>
            )}
          </Space>}
        >
          <PreviewSummary items={request.items ?? []} />

          {/* Barre de progression pendant le traitement async */}
          {request.status === 'PROCESSING' && (
            <div style={{ marginBottom: 12 }}>
              <Alert type="info" showIcon icon={<SyncOutlined spin />} style={{ marginBottom: 8 }}
                message={`Traitement en cours — ${request.successItems + request.errorItems + request.skipItems} / ${request.totalItems} produits traités...`} />
              <Progress percent={progressPct} status="active" strokeColor="#059669" />
            </div>
          )}

          {step === 2 && request.status === 'DONE' && (
            <Alert type="success" showIcon className="mb-3"
              message={`Import terminé — ${request.successItems} synchronisé(s), ${request.skipItems} identique(s), ${request.errorItems} erreur(s).`} />
          )}

          {request.items && request.items.length > 0 && (
            <PreviewTable items={request.items} extraColumns={extraColumns} />
          )}
        </Card>
      )}

      <Divider />
      <HistoryPanel entityType="PRODUCTS" />
    </div>
  );
}
