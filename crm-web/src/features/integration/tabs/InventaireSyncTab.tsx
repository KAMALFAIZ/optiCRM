import { useState } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  App, Form, Divider, Steps, Tooltip,
} from 'antd';
import {
  CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined, DatabaseOutlined, CodeOutlined,
  InboxOutlined, SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { sageQueryApi } from '../../../api/sageQuery';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

const SAGE_HEADERS = ['AR_Ref', 'DE_No', 'AS_QteSto', 'AS_QteRes', 'AR_PAMP'];

const DEFAULT_SQL = `SELECT
  AR_Ref,
  CAST(DE_No AS VARCHAR)        DE_No,
  ISNULL(AS_QteSto, 0)          AS_QteSto,
  ISNULL(AS_QteRes, 0)          AS_QteRes,
  ISNULL(AR_PAMP, 0)            AR_PAMP
FROM [dbo].[F_ARTSTOCK]
WHERE ISNULL(AS_QteSto, 0) != 0 OR ISNULL(AS_QteRes, 0) != 0`;

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Référence article',
    dataIndex: 'rawData',
    width: 130,
    render: (raw: any) => {
      const ref = raw?.ar_ref ?? raw?.AR_Ref ?? '';
      return ref ? <Text strong className="font-mono text-xs">{ref}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Dépôt',
    dataIndex: 'rawData',
    width: 100,
    render: (raw: any) => {
      const depot = raw?.de_no ?? raw?.DE_No ?? '';
      return depot ? <Tag color="purple" className="font-mono">{depot}</Tag> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Qté stock / Réservé',
    dataIndex: 'rawData',
    width: 140,
    align: 'right' as const,
    render: (raw: any) => {
      const sto = raw?.as_qtesto ?? raw?.AS_QteSto;
      const res = raw?.as_qteres ?? raw?.AS_QteRes;
      const fmt = (v: any) => v != null ? parseFloat(String(v).replace(',', '.')).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) : '—';
      return (
        <div>
          <Text className="block text-xs">Stock : <strong>{fmt(sto)}</strong></Text>
          <Text type="secondary" className="block text-xs">Réservé : {fmt(res)}</Text>
        </div>
      );
    },
  },
  {
    title: 'PAMP',
    dataIndex: 'rawData',
    width: 110,
    align: 'right' as const,
    render: (raw: any) => {
      const pamp = raw?.ar_pamp ?? raw?.AR_PAMP;
      if (pamp == null || pamp === '' || pamp === 0 || pamp === '0') return <Text type="secondary">—</Text>;
      const num = parseFloat(String(pamp).replace(',', '.'));
      return isNaN(num) ? <Text type="secondary">—</Text> : <Text>{num.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</Text>;
    },
  },
];

export default function InventaireSyncTab() {
  const { message } = App.useApp();
  const [pastedData, setPastedData] = useState('');
  const [label, setLabel] = useState('');
  const [sqlQuery, setSqlQuery] = useState(() => localStorage.getItem('sage.query.inventory') || DEFAULT_SQL);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [request, setRequest] = useState<SageSyncRequestDto | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const handlePreview = async () => {
    if (!pastedData.trim()) { message.warning('Collez des données Sage avant de prévisualiser.'); return; }
    const rows = parsePastedData(pastedData, SAGE_HEADERS);
    if (!rows.length) { message.error('Aucune ligne valide détectée.'); return; }
    setLoading(true);
    try {
      const req = await sageIntegrationApi.createRequest({ entityType: 'INVENTORY', label: label || undefined, rows });
      setRequest(req); setStep(1);
      message.success(`Prévisualisation générée : ${req.totalItems} ligne(s) d'inventaire analysée(s).`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de la prévisualisation.'); }
    finally { setLoading(false); }
  };

  const handleImportFromSage = async () => {
    if (!sqlQuery.trim()) { message.warning('La requête SQL est vide.'); return; }
    setImporting(true);
    try {
      const rows = await sageQueryApi.executeQuery(sqlQuery, 'INVENTORY');
      if (!rows.length) { message.warning('Aucune ligne de stock trouvée dans Sage.'); return; }
      const req = await sageIntegrationApi.createRequest({
        entityType: 'INVENTORY',
        label: label || `Import Inventaire Sage — ${new Date().toLocaleDateString('fr-FR')}`,
        sourceFormat: 'SQL',
        rows,
      });
      setRequest(req); setStep(1);
      message.success(`${rows.length} ligne(s) de stock importée(s) depuis Sage.`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Erreur lors de l\'import.'); }
    finally { setImporting(false); }
  };

  const handleApply = async () => {
    if (!request) return;
    setApplying(true);
    try {
      const updated = await sageIntegrationApi.applyRequest(request.id);
      setRequest(updated); setStep(2);
      message.success(`${updated.successItems} niveau(x) de stock mis à jour, ${updated.errorItems} erreur(s).`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de l\'application.'); }
    finally { setApplying(false); }
  };

  const handleSaveQuery = () => {
    localStorage.setItem('sage.query.inventory', sqlQuery);
    message.success('Requête inventaire enregistrée');
  };

  const handleReset = () => { setPastedData(''); setLabel(''); setRequest(null); setStep(0); };

  return (
    <div>
      <Steps size="small" current={step} className="mb-6" items={[
        { title: 'Saisie / Requête', icon: <CloudUploadOutlined /> },
        { title: 'Prévisualiser', icon: <InfoCircleOutlined /> },
        { title: 'Appliquer', icon: <CheckCircleOutlined /> },
      ]} />

      {step === 0 && (
        <Card size="small" title={<Space><InboxOutlined style={{ color: '#d97706' }} /><span>Import Inventaire Sage 100 (F_ARTSTOCK)</span></Space>}>
          <Form layout="vertical">
            <Form.Item label="Label de la requête">
              <Input placeholder="Ex : Inventaire Mars 2026" value={label} onChange={e => setLabel(e.target.value)} style={{ maxWidth: 400 }} />
            </Form.Item>

            <Collapse className="mb-4" style={{ background: '#fffbeb', borderColor: '#fde68a' }} items={[{
              key: 'sql',
              label: <Space><DatabaseOutlined style={{ color: '#d97706' }} /><Text strong style={{ color: '#d97706' }}>Import direct depuis Sage SQL Server</Text><Tag color="orange">Recommandé</Tag></Space>,
              children: (
                <div>
                  <Alert type="info" showIcon icon={<CodeOutlined />} style={{ marginBottom: 12 }}
                    message="Colonnes mappées"
                    description="AR_Ref → produit (via sageCode), DE_No → dépôt (find or create par code), AS_QteSto → quantité en stock, AS_QteRes → quantité réservée, AR_PAMP → coût moyen pondéré." />
                  <TextArea rows={8} value={sqlQuery} onChange={e => setSqlQuery(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }} />
                  <Space>
                    <Tooltip title="Importe les niveaux de stock depuis Sage">
                      <Button type="primary" icon={<DatabaseOutlined />} loading={importing} onClick={handleImportFromSage} style={{ background: '#d97706', borderColor: '#d97706' }}>
                        Exécuter et importer depuis Sage
                      </Button>
                    </Tooltip>
                    <Tooltip title="Enregistrer la requête SQL pour les prochaines sessions">
                      <Button icon={<SaveOutlined />} onClick={handleSaveQuery}>
                        Enregistrer la requête
                      </Button>
                    </Tooltip>
                  </Space>
                </div>
              ),
            }]} />

            <Form.Item label="Données Sage (copier-coller depuis Excel)">
              <TextArea rows={6} placeholder={`AR_Ref\tDE_No\tAS_QteSto\tAS_QteRes\tAR_PAMP\nART001\t1\t150.000\t10.000\t245.00`}
                value={pastedData} onChange={e => setPastedData(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12 }} />
            </Form.Item>

            <Button type="primary" icon={<InfoCircleOutlined />} loading={loading} onClick={handlePreview} disabled={!pastedData.trim()} style={{ background: '#d97706', borderColor: '#d97706' }}>
              Prévisualiser le matching
            </Button>
          </Form>
        </Card>
      )}

      {step >= 1 && request && (
        <Card size="small"
          title={<Space><InfoCircleOutlined style={{ color: '#d97706' }} /><span>Prévisualisation — {request.totalItems} ligne(s)</span>{request.label && <Tag>{request.label}</Tag>}</Space>}
          extra={<Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>Nouvelle import</Button>
            {request.status === 'PENDING' && (
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={applying} onClick={handleApply} style={{ background: '#d97706', borderColor: '#d97706' }}>
                Appliquer la synchronisation
              </Button>
            )}
          </Space>}
        >
          <PreviewSummary items={request.items ?? []} />
          {step === 2 && request.status === 'DONE' && (
            <Alert type="success" showIcon className="mb-3"
              message={`Inventaire mis à jour — ${request.successItems} ligne(s) traitée(s), ${request.skipItems} identique(s), ${request.errorItems} erreur(s).`} />
          )}
          <PreviewTable items={request.items ?? []} extraColumns={extraColumns} />
        </Card>
      )}

      <Divider />
      <HistoryPanel entityType="INVENTORY" />
    </div>
  );
}
