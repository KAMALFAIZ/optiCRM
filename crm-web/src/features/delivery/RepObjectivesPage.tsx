import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Spin, Empty, Modal,
  Form, Select, InputNumber, Input, Row, Col, Statistic, Progress,
  Popconfirm, Tooltip, DatePicker,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, TrophyOutlined,
  UserOutlined, RiseOutlined, CheckCircleOutlined, AimOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { repObjectiveApi, RepObjective } from '@/api/deliveryPhase3';
import { usersApi } from '@/api/users';
import { useMessage } from '@/hooks/useMessage';
import type { UserListItem } from '@/types/user';

const { Text, Title } = Typography;

function rateColor(rate: number) {
  if (rate >= 100) return '#52c41a';
  if (rate >= 70)  return '#1677ff';
  if (rate >= 40)  return '#fa8c16';
  return '#ff4d4f';
}

const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function RepObjectivesPage() {
  const { message } = useMessage();
  const [objectives, setObjectives] = useState<RepObjective[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editObj, setEditObj] = useState<RepObjective | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [form] = Form.useForm();

  useEffect(() => {
    usersApi.getAll({ size: 200, isActive: true }).then(r => setUsers(r.content)).catch(() => {});
  }, []);

  const load = useCallback(async (m: Dayjs) => {
    setLoading(true);
    try {
      setObjectives(await repObjectiveApi.getByYearMonth(m.year(), m.month() + 1));
    } catch { message.error('Erreur chargement objectifs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(selectedMonth); }, [selectedMonth, load]);

  const userName = (id?: string) => {
    if (!id) return '—';
    const u = users.find(u => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : id.substring(0, 8) + '…';
  };

  const openCreate = () => {
    setEditObj(null);
    form.resetFields();
    form.setFieldsValue({ year: selectedMonth.year(), month: selectedMonth.month() + 1 });
    setModalOpen(true);
  };

  const openEdit = (obj: RepObjective) => {
    setEditObj(obj);
    form.setFieldsValue({
      representativeId: obj.representativeId,
      year: obj.year,
      month: obj.month,
      revenueTarget: obj.revenueTarget,
      visitTarget: obj.visitTarget,
      deliveryTarget: obj.deliveryTarget,
      notes: obj.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      await repObjectiveApi.upsert({
        id: editObj?.id,
        representativeId: v.representativeId,
        year: v.year,
        month: v.month,
        revenueTarget: v.revenueTarget || 0,
        visitTarget: v.visitTarget || 0,
        deliveryTarget: v.deliveryTarget || 0,
        notes: v.notes,
      });
      message.success(editObj ? 'Objectif mis à jour' : 'Objectif créé');
      setModalOpen(false); form.resetFields(); load(selectedMonth);
    } catch (e: any) {
      if (!e.errorFields) message.error('Erreur');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try { await repObjectiveApi.delete(id); message.success('Supprimé'); load(selectedMonth); }
    catch { message.error('Erreur'); }
  };

  // ── Stats globales du mois ─────────────────────────────────────────────────
  const avgRevRate = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + (o.revenueRate || 0), 0) / objectives.length) : 0;
  const topRep = objectives.length > 0
    ? objectives.reduce((max, o) => (o.revenueRate || 0) > (max.revenueRate || 0) ? o : max, objectives[0])
    : null;

  const cols: TableColumnsType<RepObjective> = [
    {
      title: 'Représentant', dataIndex: 'representativeId',
      render: id => <Space><UserOutlined /><Text strong>{userName(id)}</Text></Space>,
    },
    {
      title: 'CA (DH)',
      render: (_, r) => (
        <div style={{ minWidth: 160 }}>
          <div className="flex justify-between mb-1">
            <Text style={{ fontSize: 12 }}>{Number(r.revenueActual || 0).toFixed(0)} / {Number(r.revenueTarget || 0).toFixed(0)} DH</Text>
            <Tag color={rateColor(r.revenueRate || 0)} style={{ fontSize: 11 }}>{r.revenueRate || 0}%</Tag>
          </div>
          <Progress percent={Math.min(100, r.revenueRate || 0)} size="small" showInfo={false}
            strokeColor={rateColor(r.revenueRate || 0)} />
        </div>
      ),
    },
    {
      title: 'Visites',
      render: (_, r) => (
        <div style={{ minWidth: 120 }}>
          <div className="flex justify-between mb-1">
            <Text style={{ fontSize: 12 }}>{r.visitActual || 0} / {r.visitTarget || 0}</Text>
            <Tag color={rateColor(r.visitRate || 0)} style={{ fontSize: 11 }}>{r.visitRate || 0}%</Tag>
          </div>
          <Progress percent={Math.min(100, r.visitRate || 0)} size="small" showInfo={false}
            strokeColor={rateColor(r.visitRate || 0)} />
        </div>
      ),
    },
    {
      title: 'Livraisons',
      render: (_, r) => (
        <div style={{ minWidth: 120 }}>
          <div className="flex justify-between mb-1">
            <Text style={{ fontSize: 12 }}>{r.deliveryActual || 0} / {r.deliveryTarget || 0}</Text>
            <Tag color={rateColor(r.deliveryRate || 0)} style={{ fontSize: 11 }}>{r.deliveryRate || 0}%</Tag>
          </div>
          <Progress percent={Math.min(100, r.deliveryRate || 0)} size="small" showInfo={false}
            strokeColor={rateColor(r.deliveryRate || 0)} />
        </div>
      ),
    },
    {
      title: 'Perf. globale', align: 'center',
      render: (_, r) => {
        const avg = Math.round(((r.revenueRate || 0) + (r.visitRate || 0) + (r.deliveryRate || 0)) / 3);
        return (
          <Tooltip title={`Moyenne CA+Visites+Livraisons`}>
            <Tag color={rateColor(avg)} style={{ fontWeight: 600, fontSize: 13 }}>{avg}%</Tag>
          </Tooltip>
        );
      },
    },
    { title: 'Notes', dataIndex: 'notes', render: n => n ? <Text type="secondary" style={{ fontSize: 12 }}>{n}</Text> : '—' },
    {
      title: '', align: 'right',
      render: (_, r) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Supprimer cet objectif ?" onConfirm={() => handleDelete(r.id!)} okText="Oui" cancelText="Non">
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={4} style={{ margin: 0 }}><TrophyOutlined className="mr-2" />Objectifs représentants</Title>
        <Space>
          <DatePicker.MonthPicker
            value={selectedMonth}
            onChange={v => v && setSelectedMonth(v)}
            format="MMMM YYYY"
            allowClear={false}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nouvel objectif</Button>
        </Space>
      </div>

      <Row gutter={12} className="mb-4">
        <Col span={6}>
          <Card size="small">
            <Statistic title={`Représentants — ${MONTH_NAMES[selectedMonth.month()]} ${selectedMonth.year()}`}
              value={objectives.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Taux CA moyen" value={`${avgRevRate}%`}
              prefix={<RiseOutlined />}
              valueStyle={{ color: rateColor(avgRevRate) }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Meilleur rep (CA)"
              value={topRep ? `${topRep.revenueRate || 0}%` : '—'}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            {topRep && <Text type="secondary" style={{ fontSize: 12 }}>{userName(topRep.representativeId)}</Text>}
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="≥ 100% objectif CA"
              value={objectives.filter(o => (o.revenueRate || 0) >= 100).length}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${objectives.length}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {objectives.length === 0
          ? <Empty description={`Aucun objectif pour ${MONTH_NAMES[selectedMonth.month()]} ${selectedMonth.year()}`} />
          : <Card size="small">
              <Table columns={cols} dataSource={objectives} rowKey="id" size="small"
                pagination={{ pageSize: 15, showTotal: t => `${t} représentant(s)` }} />
            </Card>
        }
      </Spin>

      <Modal
        title={<Space><AimOutlined />{editObj ? 'Modifier l\'objectif' : 'Nouvel objectif'}</Space>}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditObj(null); }}
        onOk={handleSave}
        confirmLoading={submitting}
        okText={editObj ? 'Mettre à jour' : 'Créer'} cancelText="Annuler"
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item name="representativeId" label="Représentant" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="Sélectionner"
              disabled={!!editObj}
              options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="year" label="Année" rules={[{ required: true }]}>
                <InputNumber min={2020} max={2050} style={{ width: '100%' }} disabled={!!editObj} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="month" label="Mois (1–12)" rules={[{ required: true }]}>
                <Select disabled={!!editObj}
                  options={MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="revenueTarget" label="Objectif CA (DH)">
                <InputNumber min={0} step={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="visitTarget" label="Objectif visites">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deliveryTarget" label="Objectif livraisons">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
