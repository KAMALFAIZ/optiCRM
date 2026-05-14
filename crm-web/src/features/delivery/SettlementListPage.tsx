import { useState, useEffect } from 'react';
import {
  Card, Button, Space, Empty, Spin, Tag, Select, Row, Col,
  Statistic, Descriptions, Alert, Progress, Typography, Divider,
} from 'antd';
import { useMessage } from '@/hooks/useMessage';
import {
  FileSearchOutlined, ThunderboltOutlined, DollarOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { settlementApi, deliveryTourApi, SettlementReport, DeliveryTour } from '@/api/delivery';

const { Text, Title } = Typography;

export default function SettlementListPage() {
  const { message } = useMessage();
  const [tours, setTours] = useState<DeliveryTour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await deliveryTourApi.list();
        setTours(data);
        if (data.length > 0 && data[0].id) setSelectedTourId(data[0].id);
      } catch {
        message.error('Erreur chargement tournees');
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedTourId) loadReport(selectedTourId);
    else setReport(null);
  }, [selectedTourId]);

  const loadReport = async (tourId: string) => {
    setLoading(true);
    try {
      const data = await settlementApi.getByTour(tourId);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTourId) return;
    setGenerating(true);
    try {
      const data = await settlementApi.generate(selectedTourId);
      setReport(data);
      message.success('Rapport de reglement genere');
    } catch {
      message.error('Erreur lors de la generation');
    } finally {
      setGenerating(false);
    }
  };

  const selectedTour = tours.find(t => t.id === selectedTourId);
  const collectionRate = report?.totalAmount && report.totalAmount > 0
    ? Math.min(100, Math.round(((report.collectedAmount || 0) / report.totalAmount) * 100))
    : 0;

  return (
    <div className="p-6">
      {tours.length === 0 ? (
        <Alert message="Creez d'abord une tournee" type="info" showIcon />
      ) : (
        <>
          <Card className="mb-4">
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary">Selectionner une tournee</Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Choisir une tournee"
                    value={selectedTourId}
                    onChange={setSelectedTourId}
                    showSearch
                    optionFilterProp="label"
                    options={tours.map(t => ({
                      value: t.id,
                      label: `${t.tourDate} -- ${t.zone || 'Sans zone'} (${t.status})`,
                    }))}
                  />
                </Space>
              </Col>
              <Col>
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerate}
                  loading={generating}
                  disabled={!selectedTourId}
                >
                  {report ? 'Regenerer le rapport' : 'Generer le rapport'}
                </Button>
              </Col>
            </Row>
            {selectedTour && (
              <div className="mt-3" style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Space split={<Divider type="vertical" />}>
                  <Space><CalendarOutlined /><Text>Date : <Text strong>{selectedTour.tourDate}</Text></Text></Space>
                  <Space><Text>Zone : <Text strong>{selectedTour.zone || '---'}</Text></Text></Space>
                  <Space>
                    <Text>Statut tournee : </Text>
                    <Tag color={selectedTour.status === 'CLOSED' ? 'default' : selectedTour.status === 'ACTIVE' ? 'green' : 'blue'}>
                      {selectedTour.status}
                    </Tag>
                  </Space>
                </Space>
              </div>
            )}
          </Card>
          <Spin spinning={loading}>
            {report ? (
              <>
                <Row gutter={16} className="mb-4">
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Montant total"
                        value={report.totalAmount?.toFixed(2) || '0.00'}
                        suffix="DH"
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Montant collecte"
                        value={report.collectedAmount?.toFixed(2) || '0.00'}
                        suffix="DH"
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="Credit (impaye)"
                        value={report.creditBalance?.toFixed(2) || '0.00'}
                        suffix="DH"
                        valueStyle={{ color: (report.creditBalance || 0) > 0 ? '#ff4d4f' : '#8c8c8c' }}
                        prefix={<ExclamationCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <div>
                        <Text type="secondary">Taux d'encaissement</Text>
                        <div className="mt-2">
                          <Progress
                            percent={collectionRate}
                            strokeColor={collectionRate >= 80 ? '#52c41a' : collectionRate >= 50 ? '#faad14' : '#ff4d4f'}
                            format={(p) => `${p}%`}
                          />
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
                <Card
                  title={<Space><FileSearchOutlined />Detail du rapport de reglement</Space>}
                  extra={
                    <Tag
                      color={report.status === 'FINALIZED' ? 'green' : 'blue'}
                      icon={report.status === 'FINALIZED' ? <CheckCircleOutlined /> : undefined}
                    >
                      {report.status === 'FINALIZED' ? 'Finalise' : 'Brouillon'}
                    </Tag>
                  }
                >
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Montant total facture" span={1}>
                      <Text strong style={{ fontSize: 16 }}>{report.totalAmount?.toFixed(2) || '0.00'} DH</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Montant collecte" span={1}>
                      <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                        {report.collectedAmount?.toFixed(2) || '0.00'} DH
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Solde credit (impaye)" span={1}>
                      <Text
                        strong
                        style={{ color: (report.creditBalance || 0) > 0 ? '#ff4d4f' : 'inherit', fontSize: 16 }}
                      >
                        {report.creditBalance?.toFixed(2) || '0.00'} DH
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Taux d'encaissement" span={1}>
                      <Progress
                        percent={collectionRate}
                        size="small"
                        strokeColor={collectionRate >= 80 ? '#52c41a' : collectionRate >= 50 ? '#faad14' : '#ff4d4f'}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Statut du rapport" span={1}>
                      <Tag color={report.status === 'FINALIZED' ? 'green' : 'blue'}>
                        {report.status === 'FINALIZED' ? 'Finalise' : 'Brouillon'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Genere le" span={1}>
                      {report.generatedAt ? dayjs(report.generatedAt).format('DD/MM/YYYY à HH:mm') : '---'}
                    </Descriptions.Item>
                  </Descriptions>
                  {(report.creditBalance || 0) > 0 && (
                    <Alert
                      className="mt-4"
                      type="warning"
                      showIcon
                      message={`Attention : ${report.creditBalance?.toFixed(2)} DH non encaisse(s)`}
                      description="Des paiements en credit sont en attente de recouvrement."
                    />
                  )}
                  {collectionRate === 100 && (
                    <Alert
                      className="mt-4"
                      type="success"
                      message="Reglement complet"
                      description="La totalite du montant facture a ete encaissee pour cette tournee."
                    />
                  )}
                </Card>
              </>
            ) : (
              <Card>
                <Empty
                  image={<FileSearchOutlined style={{ fontSize: 56, color: '#bfbfbf' }} />}
                  description={
                    <Space direction="vertical">
                      <Title level={5} type="secondary">Aucun rapport pour cette tournee</Title>
                      <Text type="secondary">Cliquez sur "Generer le rapport" pour calculer le reglement.</Text>
                    </Space>
                  }
                >
                  <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate} loading={generating}>
                    Generer le rapport
                  </Button>
                </Empty>
              </Card>
            )}
          </Spin>
        </>
      )}
    </div>
  );
}
