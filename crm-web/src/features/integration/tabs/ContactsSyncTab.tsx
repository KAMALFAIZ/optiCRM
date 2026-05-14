import { useState } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  App, Form, Divider, Steps, Tooltip,
} from 'antd';
import {
  UserOutlined, CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined, DatabaseOutlined, CodeOutlined, SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { sageQueryApi } from '../../../api/sageQuery';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

// Colonnes Sage attendues (export Sage 100 — Contacts Tiers)
const SAGE_HEADERS = [
  'CO_No', 'CT_Num', 'CO_Nom', 'CO_Prenom',
  'CO_Fonction', 'CO_Tel', 'CO_Portable', 'CO_Email',
];

const DEFAULT_SQL = `SELECT
  CT.CO_No,
  CT.CT_Num,
  CT.CO_Nom,
  CT.CO_Prenom,
  ISNULL(CT.CO_Fonction, '')   CO_Fonction,
  ISNULL(CT.CO_Tel, '')        CO_Tel,
  ISNULL(CT.CO_Portable, '')   CO_Portable,
  ISNULL(CT.CO_Email, '')      CO_Email
FROM [dbo].[F_CONTACTT] CT
INNER JOIN [dbo].[F_COMPTET] C ON CT.CT_Num = C.CT_Num
WHERE CT.CO_Email IS NOT NULL AND CT.CO_Email <> ''
  AND C.CT_Type = 0`;

const FORMAT_HELP = (
  <div className="text-sm">
    <Text type="secondary">Collez un export Sage 100 (onglet Contacts Tiers) depuis Excel. Colonnes attendues :</Text>
    <div className="mt-2 flex flex-wrap gap-1">
      {SAGE_HEADERS.map(h => <Tag key={h} color="blue" className="font-mono text-xs">{h}</Tag>)}
    </div>
    <div className="mt-2">
      <Text type="secondary" className="text-xs">
        <strong>CO_No</strong> : N° contact Sage · <strong>CT_Num</strong> : Code client lié ·
        <strong> CO_Email</strong> est utilisé comme clé de correspondance avec OptiCRM.
      </Text>
    </div>
  </div>
);

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Nom contact',
    dataIndex: 'mappedData',
    ellipsis: true,
    render: (d: any, record: SageSyncItemDto) => {
      const raw = record.rawData as any;
      const nom = [d?.lastName, d?.firstName].filter(Boolean).join(', ')
        || raw?.co_nom || d?.co_nom || null;
      return nom ? <Text>{nom}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Email',
    dataIndex: 'mappedData',
    ellipsis: true,
    render: (d: any, record: SageSyncItemDto) => {
      const raw = record.rawData as any;
      const email = d?.email ?? raw?.co_email ?? d?.co_email ?? null;
      return email
        ? <Text style={{ fontSize: 12 }}>{email}</Text>
        : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Contact CRM',
    dataIndex: 'crmName',
    ellipsis: true,
    render: (v: string | null) => v
      ? <Text style={{ color: '#405189' }}>{v}</Text>
      : <Text type="secondary">Nouveau</Text>,
  },
];

export default function ContactsSyncTab() {
  const { message } = App.useApp();
  const [pastedData, setPastedData] = useState('');
  const [label, setLabel] = useState('');
  const [sqlQuery, setSqlQuery] = useState(() => localStorage.getItem('sage.query.contacts') || DEFAULT_SQL);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [importing, setImporting] = useState(false);
  const [request, setRequest] = useState<SageSyncRequestDto | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const handlePreview = async () => {
    if (!pastedData.trim()) {
      message.warning('Collez des données Sage avant de prévisualiser.');
      return;
    }
    const rows = parsePastedData(pastedData, SAGE_HEADERS);
    if (!rows.length) {
      message.error('Aucune ligne valide détectée. Vérifiez le format collé.');
      return;
    }
    setLoading(true);
    try {
      const req = await sageIntegrationApi.createRequest({
        entityType: 'CONTACTS',
        label: label || undefined,
        rows,
      });
      setRequest(req);
      setStep(1);
      message.success(`Prévisualisation générée : ${req.totalItems} ligne(s) analysée(s).`);
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de la prévisualisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!request) return;
    setApplying(true);
    try {
      const updated = await sageIntegrationApi.applyRequest(request.id);
      setRequest(updated);
      setStep(2);
      message.success(`Synchronisation appliquée : ${updated.successItems} réussie(s), ${updated.errorItems} erreur(s).`);
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de l\'application.');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveQuery = () => {
    localStorage.setItem('sage.query.contacts', sqlQuery);
    message.success('Requête contacts enregistrée');
  };

  const handleReset = () => {
    setPastedData('');
    setLabel('');
    setRequest(null);
    setStep(0);
  };

  const handleImportFromSage = async () => {
    if (!sqlQuery.trim()) {
      message.warning('La requête SQL est vide.');
      return;
    }
    setImporting(true);
    try {
      const rows = await sageQueryApi.executeQuery(sqlQuery, 'CONTACTS');
      if (!rows.length) {
        message.warning('Aucun contact trouvé dans Sage.');
        return;
      }
      const req = await sageIntegrationApi.createRequest({
        entityType: 'CONTACTS',
        label: label || `Import Sage direct — ${new Date().toLocaleDateString('fr-FR')}`,
        sourceFormat: 'SQL',
        rows,
      });
      setRequest(req);
      setStep(1);
      message.success(`${rows.length} contact(s) importés depuis Sage — ${req.totalItems} ligne(s) analysée(s).`);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Erreur lors de l\'import depuis Sage.';
      message.error(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      {/* ── Steps ── */}
      <Steps
        size="small"
        current={step}
        className="mb-6"
        items={[
          { title: 'Saisie / Requête', icon: <CloudUploadOutlined /> },
          { title: 'Prévisualiser', icon: <InfoCircleOutlined /> },
          { title: 'Appliquer', icon: <CheckCircleOutlined /> },
        ]}
      />

      {/* ── Étape 1 : Saisie ── */}
      {step === 0 && (
        <Card
          size="small"
          title={
            <Space>
              <UserOutlined style={{ color: '#405189' }} />
              <span>Import Contacts Sage 100</span>
            </Space>
          }
        >
          <Form layout="vertical">
            <Form.Item label="Label de la requête">
              <Input
                placeholder="Ex : Contacts clients Mars 2026"
                value={label}
                onChange={e => setLabel(e.target.value)}
                style={{ maxWidth: 400 }}
              />
            </Form.Item>

            {/* ── Mode SQL direct ── */}
            <Collapse
              className="mb-4"
              style={{ background: '#f9f7ff', borderColor: '#e9d5ff' }}
              items={[{
                key: 'sql',
                label: (
                  <Space>
                    <DatabaseOutlined style={{ color: '#7c3aed' }} />
                    <Text strong style={{ color: '#7c3aed' }}>Import direct depuis Sage SQL Server</Text>
                    <Tag color="purple">Recommandé</Tag>
                  </Space>
                ),
                children: (
                  <div>
                    <Alert
                      type="info"
                      showIcon
                      icon={<CodeOutlined />}
                      style={{ marginBottom: 12 }}
                      message="Requête SQL personnalisable"
                      description="Modifiez la requête ci-dessous selon votre configuration Sage. La requête doit retourner les colonnes : CO_No, CT_Num, CO_Nom, CO_Prenom, CO_Fonction, CO_Tel, CO_Portable, CO_Email."
                    />
                    <TextArea
                      rows={10}
                      value={sqlQuery}
                      onChange={e => setSqlQuery(e.target.value)}
                      style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }}
                    />
                    <Tooltip title="Exécute la requête SQL sur le serveur Sage configuré et importe les résultats">
                      <Button
                        type="primary"
                        icon={<DatabaseOutlined />}
                        loading={importing}
                        onClick={handleImportFromSage}
                        style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                      >
                        Exécuter et importer depuis Sage
                      </Button>
                    </Tooltip>
                    <Tooltip title="Enregistrer la requête SQL pour les prochaines sessions">
                      <Button icon={<SaveOutlined />} onClick={handleSaveQuery}>
                        Enregistrer la requête
                      </Button>
                    </Tooltip>
                  </div>
                ),
              }]}
            />

            {/* ── Mode copier-coller ── */}
            <Collapse
              ghost
              className="mb-4"
              items={[{
                key: 'help',
                label: <Text type="secondary"><InfoCircleOutlined /> Ou coller manuellement depuis Excel</Text>,
                children: FORMAT_HELP,
              }]}
            />

            <Form.Item label="Données Sage (copier-coller depuis Excel)">
              <TextArea
                rows={8}
                placeholder={`CO_No\tCT_Num\tCO_Nom\tCO_Prenom\tCO_Email\t...\n1\tCLI001\tDupont\tJean\tjean@abc.com\t...`}
                value={pastedData}
                onChange={e => setPastedData(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              {pastedData && (
                <Text type="secondary" className="text-xs mt-1 block">
                  {pastedData.trim().split(/\r?\n/).filter(Boolean).length} ligne(s) détectée(s)
                </Text>
              )}
            </Form.Item>

            <Button
              type="primary"
              icon={<InfoCircleOutlined />}
              loading={loading}
              onClick={handlePreview}
              disabled={!pastedData.trim()}
              style={{ background: '#405189', borderColor: '#405189' }}
            >
              Prévisualiser le matching
            </Button>
          </Form>
        </Card>
      )}

      {/* ── Étape 1→2 : Résultat preview ── */}
      {step >= 1 && request && (
        <Card
          size="small"
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#405189' }} />
              <span>Prévisualisation — {request.totalItems} ligne(s)</span>
              {request.label && <Tag>{request.label}</Tag>}
            </Space>
          }
          extra={
            <Space>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
                Nouvelle import
              </Button>
              {request.status === 'PENDING' && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={applying}
                  onClick={handleApply}
                  style={{ background: '#405189', borderColor: '#405189' }}
                >
                  Appliquer la synchronisation
                </Button>
              )}
            </Space>
          }
        >
          <PreviewSummary items={request.items ?? []} />

          {request.errorItems > 0 && (
            <Alert
              type="warning"
              showIcon
              className="mb-3"
              message={`${request.errorItems} ligne(s) en erreur — vérifiez les données source avant d'appliquer.`}
            />
          )}

          {step === 2 && request.status === 'DONE' && (
            <Alert
              type="success"
              showIcon
              className="mb-3"
              message={`Synchronisation terminée — ${request.successItems} contact(s) mis à jour, ${request.skipItems} identique(s), ${request.errorItems} erreur(s).`}
            />
          )}

          <PreviewTable items={request.items ?? []} extraColumns={extraColumns} />
        </Card>
      )}

      <Divider />

      {/* ── Historique ── */}
      <HistoryPanel entityType="CONTACTS" />
    </div>
  );
}
