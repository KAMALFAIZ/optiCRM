import { useEffect, useCallback, useState, useRef } from 'react';
import {
  Drawer, Form, Input, Select, DatePicker, InputNumber, Row, Col, message,
  Button, Table, Space, Typography, Divider, Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch } from '@/store';
import { createSalesOrder, updateSalesOrder, fetchSalesOrderById } from './salesOrdersSlice';
import { SalesOrderLineRequest } from '@/types/salesOrder';
import apiClient from '@/api/client';
import { ApiResponse } from '@/types/api';

const { Text } = Typography;

interface Props {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface AccountOption { id: string; name: string; }
interface ProductOption { id: string; code: string; name: string; unitPrice: number; unitOfMeasure?: string; }

type LineRow = SalesOrderLineRequest & { _key: string };

const emptyLine = (): LineRow => ({
  _key: Math.random().toString(36).slice(2),
  productName: '',
  quantity: 1,
  unitPrice: 0,
  unitOfMeasure: 'unité',
  discountPercent: 0,
  taxRate: 20,
});

function computeLineTotal(line: LineRow) {
  const base = (line.quantity || 0) * (line.unitPrice || 0);
  const discountAmt = base * ((line.discountPercent || 0) / 100);
  const afterDiscount = base - discountAmt;
  const taxAmt = afterDiscount * ((line.taxRate || 0) / 100);
  return afterDiscount + taxAmt;
}

export default function SalesOrderFormModal({ open, orderId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const isEdit = !!orderId;
  const [loading, setLoading] = useState(false);

  // Account search
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const accountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Product search
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const productTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lines
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);

  // ── Load accounts ────────────────────────────────────────────────────────
  const searchAccounts = useCallback(async (q: string) => {
    if (!q) { setAccounts([]); return; }
    setAccountLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<AccountOption[]>>('/accounts', {
        params: { search: q, perPage: 20, page: 1 },
      });
      setAccounts((res.data.data as any[]).map((a: any) => ({ id: a.id, name: a.name })));
    } catch { /* ignore */ } finally { setAccountLoading(false); }
  }, []);

  const handleAccountSearch = (val: string) => {
    setAccountSearch(val);
    if (accountTimer.current) clearTimeout(accountTimer.current);
    accountTimer.current = setTimeout(() => searchAccounts(val), 300);
  };

  // ── Load products ────────────────────────────────────────────────────────
  const searchProducts = useCallback(async (q: string) => {
    if (!q) { setProducts([]); return; }
    setProductLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/products', {
        params: { search: q, perPage: 20, page: 1 },
      });
      setProducts((res.data.data as any[]).map((p: any) => ({
        id: p.id,
        code: p.code || '',
        name: p.name,
        unitPrice: p.unitPrice || 0,
        unitOfMeasure: p.unitOfMeasure || 'unité',
      })));
    } catch { /* ignore */ } finally { setProductLoading(false); }
  }, []);

  const handleProductSearch = (val: string) => {
    setProductSearch(val);
    if (productTimer.current) clearTimeout(productTimer.current);
    productTimer.current = setTimeout(() => searchProducts(val), 300);
  };

  // ── Load existing order ──────────────────────────────────────────────────
  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const result = await dispatch(fetchSalesOrderById(orderId)).unwrap();
      if (result) {
        // Pre-populate account options so Select can display the label
        setAccounts([{ id: result.account.id, name: result.account.name }]);
        form.setFieldsValue({
          accountId: result.account.id,
          orderDate: result.orderDate ? dayjs(result.orderDate) : null,
          expectedDeliveryDate: result.expectedDeliveryDate ? dayjs(result.expectedDeliveryDate) : null,
          currency: result.currency || 'MAD',
          shippingStreet: result.shippingStreet,
          shippingCity: result.shippingCity,
          shippingCountry: result.shippingCountry,
          notes: result.notes,
        });
        if (result.lines && result.lines.length > 0) {
          setLines(result.lines.map(l => ({
            _key: l.id || Math.random().toString(36).slice(2),
            productId: l.productId,
            productCode: l.productCode,
            productName: l.productName,
            description: l.description,
            quantity: Number(l.quantity) || 1,
            unitPrice: Number(l.unitPrice) || 0,
            unitOfMeasure: l.unitOfMeasure || 'unité',
            discountPercent: Number(l.discountPercent) || 0,
            taxRate: Number(l.taxRate) || 20,
            sortOrder: l.sortOrder || 0,
          })));
        } else {
          setLines([emptyLine()]);
        }
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [orderId, dispatch, form]);

  useEffect(() => {
    if (open) {
      if (isEdit) {
        loadOrder();
      } else {
        form.resetFields();
        form.setFieldsValue({ currency: 'MAD', orderDate: dayjs() });
        setLines([emptyLine()]);
        setAccounts([]);
        setProducts([]);
      }
    }
  }, [open, isEdit, form, loadOrder]);

  // ── Line helpers ─────────────────────────────────────────────────────────
  const updateLine = (key: string, field: keyof LineRow, value: any) => {
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: value } : l));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);

  const removeLine = (key: string) => setLines(prev => prev.filter(l => l._key !== key));

  const applyProduct = (key: string, product: ProductOption) => {
    setLines(prev => prev.map(l => l._key === key ? {
      ...l,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      unitPrice: product.unitPrice,
      unitOfMeasure: product.unitOfMeasure || 'unité',
    } : l));
  };

  // ── Totals ───────────────────────────────────────────────────────────────
  const validLines = lines.filter(l => l.productName?.trim());
  const subtotal = validLines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
  const discountTotal = validLines.reduce((s, l) => {
    const base = (l.quantity || 0) * (l.unitPrice || 0);
    return s + base * ((l.discountPercent || 0) / 100);
  }, 0);
  const taxTotal = validLines.reduce((s, l) => {
    const base = (l.quantity || 0) * (l.unitPrice || 0);
    const afterDiscount = base - base * ((l.discountPercent || 0) / 100);
    return s + afterDiscount * ((l.taxRate || 0) / 100);
  }, 0);
  const orderTotal = subtotal - discountTotal + taxTotal;

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2 }).format(n);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        orderDate: values.orderDate?.format('YYYY-MM-DD'),
        expectedDeliveryDate: values.expectedDeliveryDate?.format('YYYY-MM-DD') || undefined,
        lines: validLines.map(({ _key, ...l }) => l),
      };

      if (isEdit) {
        await dispatch(updateSalesOrder({ id: orderId!, data: payload })).unwrap();
        message.success('Commande mise à jour');
      } else {
        await dispatch(createSalesOrder(payload)).unwrap();
        message.success('Commande créée');
      }
      onSuccess();
    } catch { /* validation errors handled by antd */ }
  };

  // ── Line table columns ───────────────────────────────────────────────────
  const columns = [
    {
      title: 'Article',
      key: 'article',
      width: 260,
      render: (_: any, record: LineRow) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Select
            showSearch
            placeholder="Rechercher un produit..."
            suffixIcon={<SearchOutlined />}
            filterOption={false}
            loading={productLoading}
            onSearch={handleProductSearch}
            onSelect={(val: string) => {
              const p = products.find(p => p.id === val);
              if (p) applyProduct(record._key, p);
            }}
            style={{ flex: 1 }}
            value={record.productId || undefined}
            notFoundContent={productSearch ? 'Aucun résultat' : 'Tapez pour chercher'}
            options={products.map(p => ({ value: p.id, label: `[${p.code}] ${p.name}` }))}
            size="small"
          />
        </div>
      ),
    },
    {
      title: 'Désignation',
      key: 'productName',
      width: 160,
      render: (_: any, record: LineRow) => (
        <Input
          value={record.productName}
          onChange={e => updateLine(record._key, 'productName', e.target.value)}
          size="small"
          placeholder="Désignation"
        />
      ),
    },
    {
      title: 'Qté',
      key: 'quantity',
      width: 80,
      render: (_: any, record: LineRow) => (
        <InputNumber
          value={record.quantity}
          onChange={v => updateLine(record._key, 'quantity', v ?? 1)}
          min={0}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Prix HT',
      key: 'unitPrice',
      width: 110,
      render: (_: any, record: LineRow) => (
        <InputNumber
          value={record.unitPrice}
          onChange={v => updateLine(record._key, 'unitPrice', v ?? 0)}
          min={0}
          size="small"
          style={{ width: '100%' }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
        />
      ),
    },
    {
      title: 'Remise %',
      key: 'discountPercent',
      width: 90,
      render: (_: any, record: LineRow) => (
        <InputNumber
          value={record.discountPercent}
          onChange={v => updateLine(record._key, 'discountPercent', v ?? 0)}
          min={0}
          max={100}
          size="small"
          style={{ width: '100%' }}
          addonAfter="%"
        />
      ),
    },
    {
      title: 'TVA %',
      key: 'taxRate',
      width: 90,
      render: (_: any, record: LineRow) => (
        <Select
          value={record.taxRate}
          onChange={v => updateLine(record._key, 'taxRate', v)}
          size="small"
          style={{ width: '100%' }}
          options={[
            { value: 0, label: '0%' },
            { value: 7, label: '7%' },
            { value: 10, label: '10%' },
            { value: 14, label: '14%' },
            { value: 20, label: '20%' },
          ]}
        />
      ),
    },
    {
      title: 'Total TTC',
      key: 'lineTotal',
      width: 110,
      align: 'right' as const,
      render: (_: any, record: LineRow) => (
        <Text strong style={{ fontSize: 13 }}>{fmt(computeLineTotal(record))}</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: any, record: LineRow) => (
        <Tooltip title="Supprimer la ligne">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => removeLine(record._key)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Drawer
      title={isEdit ? `Modifier commande` : 'Nouvelle commande'}
      open={open}
      onClose={onClose}
      width="min(1100px, 95vw)"
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {/* ── Header info ── */}
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              name="accountId"
              label="Compte client"
              rules={[{ required: true, message: 'Le compte est obligatoire' }]}
            >
              <Select
                showSearch
                placeholder="Rechercher un compte..."
                filterOption={false}
                loading={accountLoading}
                onSearch={handleAccountSearch}
                notFoundContent={accountSearch ? 'Aucun résultat' : 'Tapez pour chercher'}
                options={accounts.map(a => ({ value: a.id, label: a.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item
              name="orderDate"
              label="Date de commande"
              rules={[{ required: true, message: 'Obligatoire' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="expectedDeliveryDate" label="Livraison prévue">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="currency" label="Devise">
              <Select options={[
                { value: 'MAD', label: 'MAD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'USD', label: 'USD' },
              ]} />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Line items ── */}
        <Divider orientation="left" style={{ margin: '8px 0 12px' }}>Lignes de commande</Divider>
        <Table
          dataSource={lines}
          columns={columns}
          rowKey="_key"
          pagination={false}
          size="small"
          bordered
          style={{ marginBottom: 8 }}
          scroll={{ x: 960 }}
        />
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addLine}
          size="small"
          style={{ marginBottom: 16 }}
        >
          Ajouter une ligne
        </Button>

        {/* ── Totals ── */}
        <Row justify="end">
          <Col span={10}>
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '10px 16px' }}>
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Text type="secondary">Sous-total HT</Text>
                <Text>{fmt(subtotal)} MAD</Text>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Text type="secondary">Remise</Text>
                <Text style={{ color: '#52c41a' }}>- {fmt(discountTotal)} MAD</Text>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Text type="secondary">TVA</Text>
                <Text>{fmt(taxTotal)} MAD</Text>
              </Row>
              <Divider style={{ margin: '6px 0' }} />
              <Row justify="space-between">
                <Text strong style={{ fontSize: 15 }}>Total TTC</Text>
                <Text strong style={{ fontSize: 15, color: '#722ed1' }}>{fmt(orderTotal)} MAD</Text>
              </Row>
            </div>
          </Col>
        </Row>

        {/* ── Shipping & Notes ── */}
        <Divider orientation="left" style={{ margin: '16px 0 12px' }}>Livraison & Notes</Divider>
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item name="shippingStreet" label="Adresse de livraison">
              <Input placeholder="Rue" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="shippingCity" label="Ville">
              <Input placeholder="Ville" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="shippingCountry" label="Pays">
              <Input placeholder="Pays" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Notes internes" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
