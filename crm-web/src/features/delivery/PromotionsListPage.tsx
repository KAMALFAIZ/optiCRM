/**
 * PromotionsListPage — Gestion des promotions / gratuités.
 * CRUD complet : liste, création, édition, suppression.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input,
  InputNumber, Switch, DatePicker, Space, Typography,
  Popconfirm, message, Row, Col, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  GiftOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DeliveryPromotion {
  id: string;
  name: string;
  description?: string;
  itemId: string;
  minQuantity: number;
  bonusItemId: string;
  bonusQuantity: number;
  zone?: string;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

const BASE = '/delivery/promotion';

export default function PromotionsListPage() {
  const [promos, setPromos] = useState<DeliveryPromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryPromotion | null>(null);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<DeliveryPromotion[]>(BASE);
      setPromos(Array.isArray(res.data) ? res.data : []);
    } catch {
      message.error('Erreur lors du chargement des promotions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, minQuantity: 1, bonusQuantity: 1 });
    setModalOpen(true);
  };

  const openEdit = (promo: DeliveryPromotion) => {
    setEditing(promo);
    form.setFieldsValue({
      ...promo,
      validFrom: promo.validFrom ? dayjs(promo.validFrom) : null,
      validTo:   promo.validTo   ? dayjs(promo.validTo)   : null,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        validFrom: values.validFrom ? values.validFrom.format('YYYY-MM-DD') : null,
        validTo:   values.validTo   ? values.validTo.format('YYYY-MM-DD')   : null,
      };
      if (editing) {
        await apiClient.put(`${BASE}/${editing.id}`, payload);
        message.success('Promotion mise à jour');
      } else {
        await apiClient.post(BASE, payload);
        message.success('Promotion créée');
      }
      setModalOpen(false);
      fetchAll();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      message.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`${BASE}/${id}`);
      message.success('Promotion supprimée');
      fetchAll();
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const columns: ColumnsType<DeliveryPromotion> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (v) => <Text strong>{v}</Text>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Article déclencheur',
      dataIndex: 'itemId',
      key: 'itemId',
      render: (v) => <Tag color="blue">{v?.substring(0, 8)}…</Tag>,
    },
    {
      title: 'Qté min.',
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      align: 'center',
      width: 90,
    },
    {
      title: 'Article bonus',
      dataIndex: 'bonusItemId',
      key: 'bonusItemId',
      render: (v) => <Tag color="green">{v?.substring(0, 8)}…</Tag>,
    },
    {
      title: 'Qté bonus',
      dataIndex: 'bonusQuantity',
      key: 'bonusQuantity',
      align: 'center',
      width: 90,
    },
    {
      title: 'Zone',
      dataIndex: 'zone',
      key: 'zone',
      render: (v) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
      width: 100,
    },
    {
      title: 'Validité',
      key: 'validity',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          {r.validFrom && <Text type="secondary" style={{ fontSize: 12 }}>Du {r.validFrom}</Text>}
          {r.validTo   && <Text type="secondary" style={{ fontSize: 12 }}>Au {r.validTo}</Text>}
          {!r.validFrom && !r.validTo && <Text type="secondary">Illimitée</Text>}
        </Space>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      width: 80,
      render: (v) => v
        ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
        : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Supprimer cette promotion ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui" cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space align="center">
            <GiftOutlined style={{ fontSize: 22, color: '#405189' }} />
            <Title level={4} style={{ margin: 0 }}>Promotions / Gratuités</Title>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 2 }}>
            Règles de gratuité automatique appliquées sur les lignes de livraison
          </Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>
              Actualiser
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nouvelle promotion
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={promos}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{ emptyText: 'Aucune promotion configurée' }}
          size="middle"
        />
      </Card>

      {/* ── Modal Création / Édition ── */}
      <Modal
        title={editing ? 'Modifier la promotion' : 'Nouvelle promotion'}
        open={modalOpen}
        forceRender
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Nom de la promotion" rules={[{ required: true }]}>
                <Input placeholder="Ex. : 3+1 Produit X" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="zone" label="Zone (optionnel)">
                <Input placeholder="Ex. : NORD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Détails de la promotion…" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="itemId" label="ID Article déclencheur" rules={[{ required: true }]}>
                <Input placeholder="UUID de l'article" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="minQuantity" label="Quantité minimum" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="bonusItemId" label="ID Article bonus (gratuité)" rules={[{ required: true }]}>
                <Input placeholder="UUID de l'article bonus" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="bonusQuantity" label="Quantité bonus" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="validFrom" label="Valide à partir du">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validTo" label="Valide jusqu'au">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isActive" label="Promotion active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
