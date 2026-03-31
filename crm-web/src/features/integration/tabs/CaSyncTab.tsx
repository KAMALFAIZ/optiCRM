import { useState } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  message, Form, Divider, Steps, InputNumber, Select, Row, Col,
} from 'antd';
import {
  LineChartOutlined, CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

// Colonnes Sage attendues (export Sage 100 — Statistiques CA)
const SAGE_HEADERS = [
  'CT_Num', 'CT_Intitule', 'Annee', 'CA_HT',
  'CA_TTC', 'Marge', 'NbFactures',
];

const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

const FORMAT_HELP = (
  <div className="text-sm">
    <Text type="secondary">
      Collez un export Sage 100 (statistiques CA par client) depuis Excel. Colonnes attendues :
    </Text>
    <div className="mt-2 flex flex-wrap gap-1">
      {SAGE_HEADERS.map(h => <Tag key={h} color="blue" className="font-mono text-xs">{h}</Tag>)}
    </div>
    <div className="mt-2">
      <Text type="secondary" className="text-xs">
        <strong>CT_Num</strong> : Code client (clé de correspondance) ·
        <strong> Annee</strong> : Année du CA (ex: 2025) ·
        <strong> CA_HT</strong> : Chiffre d'affaires HT en MAD.
        Si la colonne <strong>Annee</strong> est absente, utilisez la période sélectionnée ci-dessus.
      </Text>
    </div>
  </div>
);

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Client',
    dataIndex: 'mappedData',
    ellipsis: true,
    render: (d: any) => {
      const name = d?.name ?? d?.ct_intitule ?? null;
      return name ? <Text>{name}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'CA HT (MAD)',
    dataIndex: 'mappedData',
    width: 130,
    render: (d: any) => {
      const ca = d?.annualRevenue ?? d?.ca_ht ?? null;
      if (ca == null) return <Text type="secondary">—</Text>;
      return <Text>{Number(ca).toLocaleString('fr-MA')} MAD</Text>;
    },
  },
  {
    title: 'Compte CRM',
    dataIndex: 'crmName',
    ellipsis: true,
    render: (v: string | null) => v
      ? <Text style={{ color: '#405189' }}>{v}</Text>
      : <Text type="danger">Introuvable</Text>,
  },
];

export default function CaSyncTab() {
  const [pastedData, setPastedData] = useState('');
  const [label, setLabel] = useState('');
  const [periodYear, setPeriodYear] = useState<number>(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
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
        entityType: 'CA',
        label: label || `CA ${periodYear}${periodMonth ? '-' + String(periodMonth).padStart(2, '0') : ''}`,
        periodYear,
        periodMonth,
        rows,
      });
      setRequest(req);
      setStep(1);
      message.success(`Prévisualisation générée : ${req.totalItems} ligne(s) analysée(s).`);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Erreur lors de la prévisualisation.');
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
      message.success(`CA synchronisé : ${updated.successItems} compte(s) mis à jour, ${updated.errorItems} erreur(s).`);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Erreur lors de l\'application.');
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setPastedData('');
    setLabel('');
    setRequest(null);
    setStep(0);
  };

  return (
    <div>
      {/* ── Steps ── */}
      <Steps
        size="small"
        current={step}
        className="mb-6"
        items={[
          { title: 'Coller les données', icon: <CloudUploadOutlined /> },
          { title: 'Prévisualiser', icon: <InfoCircleOutlined /> },
          { title: 'Appliquer', icon: <CheckCircleOutlined /> },
        ]}
      />

      {/* ── Info ── */}
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="Mise à jour du CA annuel"
        description="Cet onglet met à jour le champ Chiffre d'affaires annuel de chaque compte client à partir des statistiques Sage. Chaque ligne est identifiée par le code client (CT_Num)."
      />

      {/* ── Étape 1 : Saisie ── */}
      {step === 0 && (
        <Card
          size="small"
          title={
            <Space>
              <LineChartOutlined style={{ color: '#405189' }} />
              <span>Import CA Sage 100</span>
            </Space>
          }
        >
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Année" required>
                  <InputNumber
                    value={periodYear}
                    onChange={v => v && setPeriodYear(v)}
                    min={2000}
                    max={2100}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Mois">
                  <Select
                    value={periodMonth}
                    onChange={v => setPeriodMonth(v)}
                    allowClear
                    placeholder="Annuel (tous les mois)"
                    options={MONTHS}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Label de la requête">
                  <Input
                    placeholder={`CA ${periodYear}${periodMonth ? '-' + String(periodMonth).padStart(2, '0') : ''}`}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Collapse
              ghost
              className="mb-4"
              items={[{
                key: 'help',
                label: <Text type="secondary"><InfoCircleOutlined /> Format attendu</Text>,
                children: FORMAT_HELP,
              }]}
            />

            <Form.Item
              label="Données Sage (copier-coller depuis Excel)"
              required
            >
              <TextArea
                rows={10}
                placeholder={`CT_Num\tCT_Intitule\tAnnee\tCA_HT\nCLI001\tSociété ABC\t2025\t125000.00\nCLI002\tSociété XYZ\t2025\t87500.50`}
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
              {request.periodYear && (
                <Tag color="blue">
                  {request.periodYear}{request.periodMonth ? `-${String(request.periodMonth).padStart(2, '0')}` : ''}
                </Tag>
              )}
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
              message={`${request.errorItems} client(s) introuvables dans OptiCRM. Vérifiez que les comptes existent et ont un code Sage (CT_Num) renseigné.`}
            />
          )}

          {step === 2 && request.status === 'DONE' && (
            <Alert
              type="success"
              showIcon
              className="mb-3"
              message={`CA synchronisé — ${request.successItems} compte(s) mis à jour, ${request.skipItems} identique(s), ${request.errorItems} erreur(s).`}
            />
          )}

          <PreviewTable items={request.items ?? []} extraColumns={extraColumns} />
        </Card>
      )}

      <Divider />

      {/* ── Historique ── */}
      <HistoryPanel entityType="CA" />
    </div>
  );
}
