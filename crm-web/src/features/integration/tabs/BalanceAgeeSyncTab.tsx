import { useState } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  App, Form, Divider, Steps, Tooltip,
} from 'antd';
import {
  CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined, DatabaseOutlined, CodeOutlined,
  DollarOutlined, SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { sageQueryApi } from '../../../api/sageQuery';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

const SAGE_HEADERS = [
  'CT_Num', 'BA_NonEchu', 'BA_Echu1a30', 'BA_Echu31a60', 'BA_Echu61a90', 'BA_Echu91Plus', 'BA_TotalDu',
];

const DEFAULT_SQL = `SELECT
  CT_Num,
  ISNULL(SUM(CASE WHEN DATEDIFF(DAY, DO_Date, GETDATE()) <= 0
                  THEN SoldeDu END), 0)   BA_NonEchu,
  ISNULL(SUM(CASE WHEN DATEDIFF(DAY, DO_Date, GETDATE()) BETWEEN  1 AND 30
                  THEN SoldeDu END), 0)   BA_Echu1a30,
  ISNULL(SUM(CASE WHEN DATEDIFF(DAY, DO_Date, GETDATE()) BETWEEN 31 AND 60
                  THEN SoldeDu END), 0)   BA_Echu31a60,
  ISNULL(SUM(CASE WHEN DATEDIFF(DAY, DO_Date, GETDATE()) BETWEEN 61 AND 90
                  THEN SoldeDu END), 0)   BA_Echu61a90,
  ISNULL(SUM(CASE WHEN DATEDIFF(DAY, DO_Date, GETDATE()) > 90
                  THEN SoldeDu END), 0)   BA_Echu91Plus,
  ISNULL(SUM(SoldeDu), 0)                BA_TotalDu
FROM (
  SELECT
    F.DO_Tiers    CT_Num,
    F.DO_Date,
    F.DO_NetAPayer
      - ISNULL((
          SELECT SUM(R.RC_Montant)
          FROM   dbo.F_REGLECH R
          WHERE  R.DO_Type  IN (6, 7)
            AND  R.DO_Piece  = F.DO_Piece
        ), 0)     SoldeDu
  FROM  dbo.F_DOCENTETE F
  WHERE F.DO_Type IN (6, 7)
) T
WHERE SoldeDu > 0
GROUP BY CT_Num
HAVING SUM(SoldeDu) > 0
ORDER BY BA_TotalDu DESC`;

const fmt = (v: any) => {
  if (v == null || v === '' || v === 0 || v === '0') return '—';
  const num = parseFloat(String(v).replace(',', '.'));
  return isNaN(num) ? '—' : num.toLocaleString('fr-MA', { minimumFractionDigits: 2 });
};

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Client',
    dataIndex: 'rawData',
    width: 120,
    render: (raw: any) => {
      const code = raw?.ct_num ?? raw?.CT_Num ?? '';
      return code ? <Text strong className="font-mono text-xs">{code}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Non échu',
    dataIndex: 'rawData',
    width: 110,
    align: 'right' as const,
    render: (raw: any) => <Text className="text-xs">{fmt(raw?.ba_nonechu ?? raw?.BA_NonEchu)}</Text>,
  },
  {
    title: '1–30j',
    dataIndex: 'rawData',
    width: 90,
    align: 'right' as const,
    render: (raw: any) => {
      const v = raw?.ba_echu1a30 ?? raw?.BA_Echu1a30;
      const num = v != null ? parseFloat(String(v).replace(',', '.')) : 0;
      return <Text className="text-xs" style={{ color: num > 0 ? '#f59e0b' : undefined }}>{fmt(v)}</Text>;
    },
  },
  {
    title: '31–60j',
    dataIndex: 'rawData',
    width: 90,
    align: 'right' as const,
    render: (raw: any) => {
      const v = raw?.ba_echu31a60 ?? raw?.BA_Echu31a60;
      const num = v != null ? parseFloat(String(v).replace(',', '.')) : 0;
      return <Text className="text-xs" style={{ color: num > 0 ? '#f97316' : undefined }}>{fmt(v)}</Text>;
    },
  },
  {
    title: '61–90j',
    dataIndex: 'rawData',
    width: 90,
    align: 'right' as const,
    render: (raw: any) => {
      const v = raw?.ba_echu61a90 ?? raw?.BA_Echu61a90;
      const num = v != null ? parseFloat(String(v).replace(',', '.')) : 0;
      return <Text className="text-xs" style={{ color: num > 0 ? '#ef4444' : undefined }}>{fmt(v)}</Text>;
    },
  },
  {
    title: '91j+',
    dataIndex: 'rawData',
    width: 90,
    align: 'right' as const,
    render: (raw: any) => {
      const v = raw?.ba_echu91plus ?? raw?.BA_Echu91Plus;
      const num = v != null ? parseFloat(String(v).replace(',', '.')) : 0;
      return <Text className="text-xs" style={{ color: num > 0 ? '#dc2626' : undefined, fontWeight: num > 0 ? 'bold' : undefined }}>{fmt(v)}</Text>;
    },
  },
  {
    title: 'Total dû',
    dataIndex: 'rawData',
    width: 120,
    align: 'right' as const,
    render: (raw: any) => {
      const v = raw?.ba_totaldu ?? raw?.BA_TotalDu;
      const num = v != null ? parseFloat(String(v).replace(',', '.')) : 0;
      return <Text strong style={{ color: num > 0 ? '#dc2626' : '#16a34a' }}>{fmt(v)}</Text>;
    },
  },
];

export default function BalanceAgeeSyncTab() {
  const { message } = App.useApp();
  const [pastedData, setPastedData] = useState('');
  const [label, setLabel] = useState('');
  const [sqlQuery, setSqlQuery] = useState(() => localStorage.getItem('sage.query.balance_agee') || DEFAULT_SQL);
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
      const req = await sageIntegrationApi.createRequest({ entityType: 'BALANCE_AGEE', label: label || undefined, rows });
      setRequest(req); setStep(1);
      message.success(`Prévisualisation générée : ${req.totalItems} compte(s) analysé(s).`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de la prévisualisation.'); }
    finally { setLoading(false); }
  };

  const handleImportFromSage = async () => {
    if (!sqlQuery.trim()) { message.warning('La requête SQL est vide.'); return; }
    setImporting(true);
    try {
      const rows = await sageQueryApi.executeQuery(sqlQuery, 'BALANCE_AGEE');
      if (!rows.length) { message.warning('Aucune donnée de balance trouvée dans Sage.'); return; }
      const req = await sageIntegrationApi.createRequest({
        entityType: 'BALANCE_AGEE',
        label: label || `Balance Âgée Sage — ${new Date().toLocaleDateString('fr-FR')}`,
        sourceFormat: 'SQL',
        rows,
      });
      setRequest(req); setStep(1);
      message.success(`${rows.length} ligne(s) de balance âgée importée(s) depuis Sage.`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Erreur lors de l\'import.'); }
    finally { setImporting(false); }
  };

  const handleApply = async () => {
    if (!request) return;
    setApplying(true);
    try {
      const updated = await sageIntegrationApi.applyRequest(request.id);
      setRequest(updated); setStep(2);
      message.success(`Balance âgée enregistrée — ${updated.successItems} snapshot(s) créé(s), ${updated.errorItems} erreur(s).`);
    } catch (e: any) { message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de l\'application.'); }
    finally { setApplying(false); }
  };

  const handleSaveQuery = () => {
    localStorage.setItem('sage.query.balance_agee', sqlQuery);
    message.success('Requête balance âgée enregistrée');
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
        <Card size="small" title={<Space><DollarOutlined style={{ color: '#dc2626' }} /><span>Import Balance Âgée Sage 100</span></Space>}>
          <Form layout="vertical">
            <Form.Item label="Label du snapshot">
              <Input placeholder="Ex : Balance Âgée Fin Février 2026" value={label} onChange={e => setLabel(e.target.value)} style={{ maxWidth: 400 }} />
            </Form.Item>

            <Collapse className="mb-4" style={{ background: '#fff1f2', borderColor: '#fecdd3' }} items={[{
              key: 'sql',
              label: <Space><DatabaseOutlined style={{ color: '#dc2626' }} /><Text strong style={{ color: '#dc2626' }}>Import direct depuis Sage SQL Server</Text><Tag color="red">Recommandé</Tag></Space>,
              children: (
                <div>
                  <Alert type="info" showIcon icon={<CodeOutlined />} style={{ marginBottom: 12 }}
                    message="Colonnes mappées"
                    description="CT_Num → code compte Sage, BA_NonEchu, BA_Echu1a30 (1-30j), BA_Echu31a60 (31-60j), BA_Echu61a90 (61-90j), BA_Echu91Plus (91j+), BA_TotalDu. Adaptez la vue V_BalanceAgee à votre configuration Sage." />
                  <TextArea rows={9} value={sqlQuery} onChange={e => setSqlQuery(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }} />
                  <Space>
                    <Tooltip title="Importe la balance âgée depuis Sage">
                      <Button type="primary" icon={<DatabaseOutlined />} loading={importing} onClick={handleImportFromSage} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
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
              <TextArea rows={6} placeholder={`CT_Num\tBA_NonEchu\tBA_Echu1a30\tBA_Echu31a60\tBA_Echu61a90\tBA_Echu91Plus\tBA_TotalDu\nCLI001\t5000.00\t2000.00\t0\t1500.00\t0\t8500.00`}
                value={pastedData} onChange={e => setPastedData(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12 }} />
            </Form.Item>

            <Button type="primary" icon={<InfoCircleOutlined />} loading={loading} onClick={handlePreview} disabled={!pastedData.trim()} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
              Prévisualiser le matching
            </Button>
          </Form>
        </Card>
      )}

      {step >= 1 && request && (
        <Card size="small"
          title={<Space><InfoCircleOutlined style={{ color: '#dc2626' }} /><span>Prévisualisation — {request.totalItems} compte(s)</span>{request.label && <Tag>{request.label}</Tag>}</Space>}
          extra={<Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>Nouvelle import</Button>
            {request.status === 'PENDING' && (
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={applying} onClick={handleApply} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                Enregistrer le snapshot
              </Button>
            )}
          </Space>}
        >
          <PreviewSummary items={request.items ?? []} />
          {step === 2 && request.status === 'DONE' && (
            <Alert type="success" showIcon className="mb-3"
              message={`Snapshot enregistré — ${request.successItems} compte(s) traité(s), ${request.errorItems} erreur(s).`} />
          )}
          <PreviewTable items={request.items ?? []} extraColumns={extraColumns} />
        </Card>
      )}

      <Divider />
      <HistoryPanel entityType="BALANCE_AGEE" />
    </div>
  );
}
