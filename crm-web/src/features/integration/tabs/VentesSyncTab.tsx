import { useState } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  App, Form, Divider, Steps, Tooltip,
} from 'antd';
import {
  CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined, DatabaseOutlined, CodeOutlined,
  ShoppingCartOutlined, SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { sageQueryApi } from '../../../api/sageQuery';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

const SAGE_HEADERS = ['CT_Num', 'DO_Piece', 'DO_Date', 'DO_TotalHT', 'DO_TotalTTC'];

const DEFAULT_SQL = `SELECT
  CT_Num,
  DO_Piece,
  CONVERT(VARCHAR, DO_Date, 23)   DO_Date,
  ISNULL(DO_TotalHT,  0)          DO_TotalHT,
  ISNULL(DO_TotalTTC, 0)          DO_TotalTTC
FROM [dbo].[F_DOCENTETE]
WHERE DO_Type = 7
  AND DO_Statut < 3
  AND DO_Date >= DATEADD(MONTH, -1, GETDATE())`;

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Client (CT_Num)',
    dataIndex: 'rawData',
    width: 130,
    render: (raw: any) => {
      const code = raw?.ct_num ?? raw?.CT_Num ?? '';
      return code ? <Text strong className="font-mono text-xs">{code}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'N° pièce',
    dataIndex: 'rawData',
    width: 140,
    render: (raw: any) => {
      const piece = raw?.do_piece ?? raw?.DO_Piece ?? '';
      return piece ? <Text className="font-mono text-xs">{piece}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Date',
    dataIndex: 'rawData',
    width: 100,
    render: (raw: any) => {
      const d = raw?.do_date ?? raw?.DO_Date ?? '';
      return d ? <Text>{d}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Montant HT / TTC',
    dataIndex: 'rawData',
    width: 140,
    align: 'right' as const,
    render: (raw: any) => {
      const ht  = raw?.do_totalht  ?? raw?.DO_TotalHT;
      const ttc = raw?.do_totalttc ?? raw?.DO_TotalTTC;
      const fmt = (v: any) => v != null ? parseFloat(String(v).replace(',', '.')).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) : '—';
      return (
        <div>
          <Text className="block text-xs">HT : <strong>{fmt(ht)}</strong></Text>
          <Text type="secondary" className="block text-xs">TTC : {fmt(ttc)}</Text>
        </div>
      );
    },
  },
];

export default function VentesSyncTab() {
  const { message } = App.useApp();
  const [pastedData, setPastedData] = useState('');
  const [label, setLabel] = useState('');
  const [sqlQuery, setSqlQuery] = useState(() => localStorage.getItem('sage.query.ventes') || DEFAULT_SQL);
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
      const req = await sageIntegrationApi.createRequest({ entityType: 'VENTES', label: label || undefined, rows });
      setRequest(req); setStep(1);
      message.success(`Prévisualisation générée : ${req.totalItems} vente(s) analysée(s).`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de la prévisualisation.'); }
    finally { setLoading(false); }
  };

  const handleImportFromSage = async () => {
    if (!sqlQuery.trim()) { message.warning('La requête SQL est vide.'); return; }
    setImporting(true);
    try {
      const rows = await sageQueryApi.executeQuery(sqlQuery, 'VENTES');
      if (!rows.length) { message.warning('Aucune vente trouvée dans Sage.'); return; }
      const req = await sageIntegrationApi.createRequest({
        entityType: 'VENTES',
        label: label || `Import Ventes Sage — ${new Date().toLocaleDateString('fr-FR')}`,
        sourceFormat: 'SQL',
        rows,
      });
      setRequest(req); setStep(1);
      message.success(`${rows.length} vente(s) importée(s) depuis Sage.`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Erreur lors de l\'import.'); }
    finally { setImporting(false); }
  };

  const handleApply = async () => {
    if (!request) return;
    setApplying(true);
    try {
      const updated = await sageIntegrationApi.applyRequest(request.id);
      setRequest(updated); setStep(2);
      message.success(`${updated.successItems} vente(s) appliquée(s) sur les CA des comptes, ${updated.errorItems} erreur(s).`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de l\'application.'); }
    finally { setApplying(false); }
  };

  const handleSaveQuery = () => {
    localStorage.setItem('sage.query.ventes', sqlQuery);
    message.success('Requête ventes enregistrée');
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
        <Card size="small" title={<Space><ShoppingCartOutlined style={{ color: '#7c3aed' }} /><span>Import Ventes Sage 100 (F_DOCENTETE)</span></Space>}>
          <Form layout="vertical">
            <Form.Item label="Label de la requête">
              <Input placeholder="Ex : Ventes Février 2026" value={label} onChange={e => setLabel(e.target.value)} style={{ maxWidth: 400 }} />
            </Form.Item>

            <Collapse className="mb-4" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }} items={[{
              key: 'sql',
              label: <Space><DatabaseOutlined style={{ color: '#7c3aed' }} /><Text strong style={{ color: '#7c3aed' }}>Import direct depuis Sage SQL Server</Text><Tag color="purple">Recommandé</Tag></Space>,
              children: (
                <div>
                  <Alert type="info" showIcon icon={<CodeOutlined />} style={{ marginBottom: 12 }}
                    message="Colonnes mappées"
                    description="CT_Num (code client Sage), DO_Piece (n° pièce), DO_Date (date), DO_TotalHT (montant HT), DO_TotalTTC (montant TTC). DO_Type=7 = Factures clients." />
                  <TextArea rows={9} value={sqlQuery} onChange={e => setSqlQuery(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }} />
                  <Space>
                    <Tooltip title="Importe les ventes depuis Sage">
                      <Button type="primary" icon={<DatabaseOutlined />} loading={importing} onClick={handleImportFromSage} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
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
              <TextArea rows={6} placeholder={`CT_Num\tDO_Piece\tDO_Date\tDO_TotalHT\tDO_TotalTTC\nCLI001\tFA2026-0001\t2026-02-15\t12500.00\t15000.00`}
                value={pastedData} onChange={e => setPastedData(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12 }} />
            </Form.Item>

            <Button type="primary" icon={<InfoCircleOutlined />} loading={loading} onClick={handlePreview} disabled={!pastedData.trim()} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
              Prévisualiser le matching
            </Button>
          </Form>
        </Card>
      )}

      {step >= 1 && request && (
        <Card size="small"
          title={<Space><InfoCircleOutlined style={{ color: '#7c3aed' }} /><span>Prévisualisation — {request.totalItems} vente(s)</span>{request.label && <Tag>{request.label}</Tag>}</Space>}
          extra={<Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>Nouvelle import</Button>
            {request.status === 'PENDING' && (
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={applying} onClick={handleApply} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                Appliquer la synchronisation
              </Button>
            )}
          </Space>}
        >
          <PreviewSummary items={request.items ?? []} />
          {step === 2 && request.status === 'DONE' && (
            <Alert type="success" showIcon className="mb-3"
              message={`CA mis à jour — ${request.successItems} vente(s) appliquée(s), ${request.skipItems} ignorée(s), ${request.errorItems} erreur(s).`} />
          )}
          <PreviewTable items={request.items ?? []} extraColumns={extraColumns} />
        </Card>
      )}

      <Divider />
      <HistoryPanel entityType="VENTES" />
    </div>
  );
}
