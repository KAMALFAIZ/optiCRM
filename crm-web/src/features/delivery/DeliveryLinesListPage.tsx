import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Empty, Spin, Modal, Form, Select,
  Popconfirm, Tag, Row, Col, Statistic, Typography, InputNumber, Radio, Alert,
} from 'antd';
import { useMessage } from '@/hooks/useMessage';
import {
  PlusOutlined, DeleteOutlined, ShoppingOutlined, DollarOutlined,
  SearchOutlined, EditOutlined, CheckCircleOutlined, CreditCardOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { deliveryLineApi, deliveryTourApi, DeliveryLine, DeliveryTour } from '@/api/delivery';
import { accountsApi } from '@/api/accounts';
import { productsApi } from '@/api/products';
import type { AccountListItem } from '@/types/account';
import type { ProductListItem } from '@/types/product';

const { Text } = Typography;

export default function DeliveryLinesListPage() {
  const { message } = useMessage();
  const [tours, setTours] = useState<DeliveryTour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [lines, setLines] = useState<DeliveryLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLine, setEditLine] = useState<DeliveryLine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    deliveryTourApi.list({ status: 'VALIDE' }).then(data => {
      setTours(data);
      const firstValide = data.find(t => t.status === 'VALIDE');
      if (firstValide?.id) setSelectedTourId(firstValide.id);
    }).catch(() => message.error('Erreur chargement tournees'));
    accountsApi.getAll({ size: 200 }).then(r => setAccounts(r.content)).catch(() => {});
    productsApi.getAll({ size: 200, isSellable: true, isActive: true }).then(r => setProducts(r.content)).catch(() => {});
  }, []);

  const loadLines = useCallback(async () => {
    if (!selectedTourId) { setLines([]); return; }
    setLoading(true);
    try {
      const data = await deliveryLineApi.listByTour(selectedTourId);
      setLines(data);
    } catch {
      message.error('Erreur chargement lignes');
    } finally {
      setLoading(false);
    }
  }, [selectedTourId]);

  useEffect(() => { loadLines(); }, [loadLines]);

  const openCreate = () => {
    setEditLine(null);
    form.resetFields();
    form.setFieldsValue({ paymentMode: 'CASH', paidAmount: 0 });
    setModalOpen(true);
  };

  const openEdit = (line: DeliveryLine) => {
    setEditLine(line);
    form.setFieldsValue({
      customerId: line.customerId,
      itemId: line.itemId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      paymentMode: line.paymentMode || 'CASH',
      paidAmount: line.paidAmount || 0,
    });
    setModalOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const p = products.find(p => p.id === productId);
    if (p) form.setFieldsValue({ unitPrice: p.unitPrice });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedTourId) return;
      setSubmitting(true);
      const payload: DeliveryLine = {
        deliveryTourId: selectedTourId,
        customerId: values.customerId,
        itemId: values.itemId,
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice),
        paymentMode: values.paymentMode,
        paidAmount: Number(values.paidAmount || 0),
      };
      if (editLine?.id) {
        await deliveryLineApi.update(editLine.id, payload);
        message.success('Ligne mise a jour');
      } else {
        await deliveryLineApi.create(payload);
        message.success('Ligne ajoutee');
      }
      setModalOpen(false);
      form.resetFields();
      loadLines();
    } catch (err: any) {
      if (err.errorFields) return;
      const msg = err?.response?.data?.error?.message
                || err?.response?.data?.message
                || 'Erreur';
      message.error(msg, 6);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deliveryLineApi.delete(id);
      message.success('Ligne supprimee');
      loadLines();
    } catch {
      message.error('Erreur suppression');
    }
  };

  const getAccountName = (id?: string) => {
    if (!id) return '-';
    const a = accounts.find(a => a.id === id);
    return a ? a.name : id.substring(0, 8) + '...';
  };

  const getProductName = (id?: string) => {
    if (!id) return '-';
    const p = products.find(p => p.id === id);
    return p ? `${p.name}${p.code ? ` (${p.code})` : ''}` : id.substring(0, 8) + '...';
  };

  const totalAmount    = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const totalPaid      = lines.reduce((s, l) => s + (l.paidAmount || 0), 0);
  const totalCredit    = totalAmount - totalPaid;
  const hasActiveTours = tours.some(t => t.status === 'VALIDE');

  const columns: TableColumnsType<DeliveryLine> = [
    { title: 'Client', dataIndex: 'customerId', render: (id) => <Text strong>{getAccountName(id)}</Text> },
    { title: 'Article', dataIndex: 'itemId', render: (id) => <Text>{getProductName(id)}</Text> },
    { title: 'Qte', dataIndex: 'quantity', align: 'center', render: (v) => <Tag>{v}</Tag> },
    { title: 'Prix unit.', dataIndex: 'unitPrice', align: 'right', render: (v) => v != null ? <Text>{Number(v).toFixed(2)} DH</Text> : '---' },
    { title: 'Montant', dataIndex: 'amount', align: 'right', render: (v) => v != null ? <Text strong>{Number(v).toFixed(2)} DH</Text> : '---' },
    { title: 'Paye', dataIndex: 'paidAmount', align: 'right', render: (v) => <Text style={{ color: '#52c41a' }}>{Number(v || 0).toFixed(2)} DH</Text> },
    {
      title: 'Mode paiement', dataIndex: 'paymentMode',
      render: (mode) => mode === 'CASH'
        ? <Tag icon={<DollarOutlined />} color="green">Especes</Tag>
        : <Tag icon={<CreditCardOutlined />} color="orange">Credit</Tag>,
    },
    {
      title: 'Statut paiement',
      render: (_, r) => {
        const amount = r.amount || 0;
        const paid = r.paidAmount || 0;
        if (paid >= amount && amount > 0) return <Tag color="green" icon={<CheckCircleOutlined />}>Paye</Tag>;
        if (paid > 0) return <Tag color="orange">Partiel</Tag>;
        return <Tag color="red">Impaye</Tag>;
      },
    },
    {
      title: 'Actions', align: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="Supprimer cette ligne ?" onConfirm={() => handleDelete(record.id!)} okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Row gutter={16} className="mb-4">
        {[
          { title: 'Lignes', value: lines.length, prefix: <ShoppingOutlined />, color: undefined },
          { title: 'Total facture', value: totalAmount.toFixed(2) + ' DH', prefix: <DollarOutlined />, color: undefined },
          { title: 'Total encaisse', value: totalPaid.toFixed(2) + ' DH', prefix: <CheckCircleOutlined />, color: '#52c41a' },
          { title: 'Credit (impaye)', value: totalCredit.toFixed(2) + ' DH', prefix: <CreditCardOutlined />, color: totalCredit > 0 ? '#ff4d4f' : undefined },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card size="small">
              <Statistic title={s.title} value={s.value} valueStyle={s.color ? { color: s.color } : undefined} prefix={s.prefix} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card
        title={<Space><ShoppingOutlined />Lignes de livraison</Space>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!selectedTourId || !hasActiveTours}>
            Nouvelle ligne
          </Button>
        }
      >
        <div className="mb-4">
          {!hasActiveTours && tours.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="Aucune tournée validée"
              description="Il n'y a aucune tournée en statut Validée. Validez une tournée avant d'ajouter des lignes de livraison."
              className="mb-3"
            />
          ) : (
            <Select
              style={{ width: 420 }}
              placeholder="Sélectionner une tournée"
              value={selectedTourId}
              onChange={setSelectedTourId}
              options={tours
                .filter(t => t.status === 'VALIDE')
                .map(t => ({ value: t.id, label: `${t.tourDate} -- ${t.zone || 'Sans zone'}` }))}
              showSearch
              optionFilterProp="label"
            />
          )}
        </div>
        <Spin spinning={loading}>
          {lines.length === 0
            ? <Empty description="Aucune ligne pour cette tournee" />
            : <Table columns={columns} dataSource={lines} rowKey="id" pagination={{ showTotal: (t) => `${t} ligne(s)` }} />
          }
        </Spin>
      </Card>
      <Modal
        title={<Space><ShoppingOutlined />{editLine ? 'Modifier la ligne' : 'Nouvelle ligne de livraison'}</Space>}
        open={modalOpen}
        forceRender
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditLine(null); }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editLine ? 'Mettre a jour' : 'Ajouter'}
        cancelText="Annuler"
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="customerId" label="Client" rules={[{ required: true, message: 'Client requis' }]}>
            <Select showSearch placeholder="Rechercher un client..." optionFilterProp="label" suffixIcon={<SearchOutlined />}
              options={accounts.map(a => ({ value: a.id, label: a.name }))} />
          </Form.Item>
          <Form.Item name="itemId" label="Article / Produit" rules={[{ required: true, message: 'Article requis' }]}>
            <Select showSearch placeholder="Rechercher un article..." optionFilterProp="label" suffixIcon={<SearchOutlined />}
              onChange={handleProductChange}
              options={products.map(p => ({ value: p.id, label: `${p.name}${p.code ? ` -- ${p.code}` : ''}` }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantite" rules={[{ required: true, message: 'Quantite requise' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitPrice" label="Prix unitaire (DH)" rules={[{ required: true, message: 'Prix requis' }]}>
                <Space.Compact style={{ width: '100%' }}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /><span className="ant-input-group-addon" style={{ display:'flex',alignItems:'center',padding:'0 11px',background:'#fafafa',border:'1px solid #d9d9d9',borderLeft:'none',borderRadius:'0 6px 6px 0',fontSize:14 }}>DH</span></Space.Compact>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMode" label="Mode de paiement">
                <Radio.Group>
                  <Radio.Button value="CASH"><DollarOutlined /> Especes</Radio.Button>
                  <Radio.Button value="CREDIT"><CreditCardOutlined /> Credit</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paidAmount" label="Montant paye (DH)">
                <Space.Compact style={{ width: '100%' }}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /><span className="ant-input-group-addon" style={{ display:'flex',alignItems:'center',padding:'0 11px',background:'#fafafa',border:'1px solid #d9d9d9',borderLeft:'none',borderRadius:'0 6px 6px 0',fontSize:14 }}>DH</span></Space.Compact>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
