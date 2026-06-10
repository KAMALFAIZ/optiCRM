import { useState } from 'react';
import {
  Card, Button, Input, Alert, Space, Typography, Collapse, Tag,
  message, Form, Divider, Steps, InputNumber, Select, Row, Col,
} from 'antd';
import {
  AimOutlined, CloudUploadOutlined, CheckCircleOutlined,
  ReloadOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import sageIntegrationApi, {
  parsePastedData, SageSyncRequestDto, SageSyncItemDto,
} from '../../../api/sageIntegration';
import { PreviewTable, PreviewSummary, HistoryPanel } from '../components/SyncPanel';

const { TextArea } = Input;
const { Text } = Typography;

// Colonnes attendues pour les objectifs commerciaux
const SAGE_HEADERS = [
  'CodeComm', 'NomComm', 'Annee', 'Mois', 'Objectif',
  'CA_Realise', 'Taux',
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
      Collez un export des objectifs commerciaux (depuis Sage ou tout tableur). Colonnes attendues :
    </Text>
    <div className="mt-2 flex flex-wrap gap-1">
      {SAGE_HEADERS.map(h => <Tag key={h} color="blue" className="font-mono text-xs">{h}</Tag>)}
    </div>
    <div className="mt-2">
      <Text type="secondary" className="text-xs">
        <strong>CodeComm</strong> : Code/login du commercial (doit exister dans OptiCRM) ·
        <strong> NomComm</strong> : Nom du commercial ·
        <strong> Annee</strong> : Année (ex: 2026) ·
        <strong> Mois</strong> : 1-12 ou vide pour annuel ·
        <strong> Objectif</strong> : Montant cible en MAD.
      </Text>
    </div>
  </div>
);

const extraColumns: ColumnsType<SageSyncItemDto> = [
  {
    title: 'Commercial',
    dataIndex: 'mappedData',
    ellipsis: true,
    render: (d: any) => {
      const name = d?.userName ?? d?.nomcomm ?? null;
      return name ? <Text>{name}</Text> : <Text type="secondary">—</Text>;
    },
  },
  {
    title: 'Objectif (MAD)',
    dataIndex: 'mappedData',
    width: 140,
    render: (d: any) => {
      const obj = d?.targetAmount ?? d?.objectif ?? null;
      if (obj == null) return <Text type="secondary">—</Text>;
      return <Text strong style={{ color: '#52c41a' }}>{Number(obj).toLocaleString('fr-MA')} MAD</Text>;
    },
  },
  {
    title: 'Période',
    dataIndex: 'mappedData',
    width: 100,
    render: (d: any) => {
      const year = d?.year ?? d?.annee ?? null;
      const month = d?.month ?? d?.mois ?? null;
      if (!year) return <Text type="secondary">—</Text>;
      return <Tag color="blue">{year}{month ? `-${String(month).padStart(2, '0')}` : ''}</Tag>;
    },
  },
];

export default function ObjectivesSyncTab() {
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
      message.warning('Collez des données avant de prévisualiser.');
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
        entityType: 'OBJECTIVES',
        label: label || `Objectifs ${periodYear}${periodMonth ? '-' + String(periodMonth).padStart(2, '0') : ''}`,
        periodYear,
        periodMonth,
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
      message.success(`Objectifs synchronisés : ${updated.successItems} réussi(s), ${updated.errorItems} erreur(s).`);
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || e?.response?.data?.message || 'Erreur lors de l\'application.');
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

      {/* ── Étape 1 : Saisie ── */}
      {step === 0 && (
        <Card
          size="small"
          title={
            <Space>
              <AimOutlined style={{ color: '#4F46E5' }} />
              <span>Import Objectifs commerciaux</span>
            </Space>
          }
        >
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Année de référence" required>
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
                <Form.Item label="Mois (optionnel — si mensuel)">
                  <Select
                    value={periodMonth}
                    onChange={v => setPeriodMonth(v)}
                    allowClear
                    placeholder="Annuel"
                    options={MONTHS}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Label de la requête">
                  <Input
                    placeholder={`Objectifs ${periodYear}${periodMonth ? '-' + String(periodMonth).padStart(2, '0') : ''}`}
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
              label="Données objectifs (copier-coller depuis Excel ou Sage)"
              required
            >
              <TextArea
                rows={10}
                placeholder={`CodeComm\tNomComm\tAnnee\tMois\tObjectif\nCOMM01\tDupont Jean\t2026\t1\t150000\nCOMM02\tMartin Ali\t2026\t1\t120000`}
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
              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
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
              <InfoCircleOutlined style={{ color: '#4F46E5' }} />
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
                  style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
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
              message={`${request.errorItems} commercial(aux) introuvable(s) dans OptiCRM. Vérifiez que le CodeComm correspond au login ou code interne.`}
            />
          )}

          {step === 2 && request.status === 'DONE' && (
            <Alert
              type="success"
              showIcon
              className="mb-3"
              message={`Objectifs synchronisés — ${request.successItems} mis à jour, ${request.skipItems} identique(s), ${request.errorItems} erreur(s).`}
            />
          )}

          <PreviewTable items={request.items ?? []} extraColumns={extraColumns} />
        </Card>
      )}

      <Divider />

      {/* ── Historique ── */}
      <HistoryPanel entityType="OBJECTIVES" />
    </div>
  );
}
