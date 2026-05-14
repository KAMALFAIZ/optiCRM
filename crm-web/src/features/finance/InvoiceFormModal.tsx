import { useEffect, useState, useCallback } from 'react';
import {
  Modal, Form, Input, Select, DatePicker, InputNumber, Button, Space, Table, message, Divider, Row, Col,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch } from '@/store';
import { createInvoice, updateInvoice, fetchInvoiceById } from './invoicesSlice';
import { InvoiceLine, INVOICE_TYPE_CONFIG } from '@/types/invoice';
import { CURRENCIES } from '@/types/payment';

interface Props {
  open: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const INVOICE_TYPE_OPTIONS = Object.entries(INVOICE_TYPE_CONFIG).map(([value, cfg]) => ({
  value, label: cfg.label,
}));

const TAX_RATE_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 7, label: '7%' },
  { value: 10, label: '10%' },
  { value: 14, label: '14%' },
  { value: 20, label: '20%' },
];

export default function InvoiceFormModal({ open, invoiceId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const isEdit = !!invoiceId;

  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 20, discountAmount: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (invoiceId) {
      setLoading(true);
      try {
        const result = await dispatch(fetchInvoiceById(invoiceId)).unwrap();
        if (result) {
          form.setFieldsValue({
            invoiceType: result.invoiceType,
            accountId: result.account?.id,
            invoiceDate: result.invoiceDate ? dayjs(result.invoiceDate) : null,
            dueDate: result.dueDate ? dayjs(result.dueDate) : null,
            currency: result.currency,
            discountAmount: result.discountAmount,
            billingName: result.billingName,
            billingStreet: result.billingStreet,
            billingCity: result.billingCity,
            billingCountry: result.billingCountry,
            notes: result.notes,
          });
          if (result.lines && result.lines.length > 0) {
            setLines(result.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxRate: l.taxRate || 0,
              discountAmount: l.discountAmount || 0,
              productId: l.productId,
              productCode: l.productCode,
            })));
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
  }, [invoiceId, dispatch, form]);

  useEffect(() => {
    if (open) {
      if (isEdit) {
        loadInvoice();
      } else {
        form.resetFields();
        form.setFieldsValue({
          invoiceType: 'INVOICE',
          currency: 'MAD',
          invoiceDate: dayjs(),
          dueDate: dayjs().add(30, 'day'),
        });
        setLines([{ description: '', quantity: 1, unitPrice: 0, taxRate: 20, discountAmount: 0 }]);
      }
    }
  }, [open, isEdit, form, loadInvoice]);

  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 20, discountAmount: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: unknown) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const calcLineTotal = (line: InvoiceLine) => {
    const sub = (line.quantity || 0) * (line.unitPrice || 0);
    const discount = line.discountAmount || 0;
    return sub - discount;
  };

  const calcLineTax = (line: InvoiceLine) => {
    const afterDiscount = calcLineTotal(line);
    const rate = line.taxRate || 0;
    return afterDiscount * rate / 100;
  };

  const subtotal = lines.reduce((sum, l) => sum + calcLineTotal(l), 0);
  const taxTotal = lines.reduce((sum, l) => sum + calcLineTax(l), 0);
  const discountAmount = Form.useWatch('discountAmount', form) || 0;
  const grandTotal = subtotal + taxTotal - discountAmount;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const validLines = lines.filter((l) => l.description && l.quantity > 0);
      if (validLines.length === 0) {
        message.error('Ajoutez au moins une ligne de facture');
        return;
      }

      const payload = {
        ...values,
        invoiceDate: values.invoiceDate?.format('YYYY-MM-DD'),
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        discountAmount: values.discountAmount || 0,
        lines: validLines.map((l, idx) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate || 0,
          discountAmount: l.discountAmount || 0,
          productId: l.productId,
          productCode: l.productCode,
          sortOrder: idx,
        })),
      };

      if (isEdit) {
        await dispatch(updateInvoice({ id: invoiceId!, data: payload })).unwrap();
        message.success('Facture mise à jour');
      } else {
        await dispatch(createInvoice(payload)).unwrap();
        message.success('Facture créée');
      }
      onSuccess();
    } catch {
      // validation errors handled by antd
    }
  };

  const lineColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_: string, _record: InvoiceLine, index: number) => (
        <Input
          value={lines[index].description}
          onChange={(e) => updateLine(index, 'description', e.target.value)}
          placeholder="Description"
          size="small"
        />
      ),
    },
    {
      title: 'Qté',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (_: number, _record: InvoiceLine, index: number) => (
        <InputNumber
          value={lines[index].quantity}
          onChange={(val) => updateLine(index, 'quantity', val || 0)}
          min={0.001}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (_: number, _record: InvoiceLine, index: number) => (
        <InputNumber
          value={lines[index].unitPrice}
          onChange={(val) => updateLine(index, 'unitPrice', val || 0)}
          min={0}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'TVA %',
      dataIndex: 'taxRate',
      key: 'taxRate',
      width: 90,
      render: (_: number, _record: InvoiceLine, index: number) => (
        <Select
          value={lines[index].taxRate}
          onChange={(val) => updateLine(index, 'taxRate', val)}
          options={TAX_RATE_OPTIONS}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Total HT',
      key: 'lineTotal',
      width: 100,
      align: 'right' as const,
      render: (_: unknown, _record: InvoiceLine, index: number) => (
        <span style={{ fontWeight: 500 }}>
          {calcLineTotal(lines[index]).toFixed(2)}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: unknown, _record: InvoiceLine, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          disabled={lines.length <= 1}
          onClick={() => removeLine(index)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={isEdit ? 'Modifier la facture' : 'Nouvelle facture'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      width={900}
      destroyOnHidden
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="invoiceType" label="Type">
              <Select options={INVOICE_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="accountId"
              label="Compte client"
              rules={[{ required: true, message: 'Le compte est obligatoire' }]}
            >
              <Input placeholder="ID du compte" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="currency" label="Devise">
              <Select options={CURRENCIES} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="invoiceDate"
              label="Date de facture"
              rules={[{ required: true, message: 'La date est obligatoire' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="dueDate"
              label="Date d'échéance"
              rules={[{ required: true, message: "La date d'échéance est obligatoire" }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="discountAmount" label="Remise globale">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>Lignes de facture</Divider>

        <Table
          dataSource={lines.map((l, i) => ({ ...l, key: i }))}
          columns={lineColumns}
          pagination={false}
          size="small"
          footer={() => (
            <Button type="dashed" icon={<PlusOutlined />} onClick={addLine} block>
              Ajouter une ligne
            </Button>
          )}
        />

        <Row justify="end" style={{ marginTop: 12 }}>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sous-total HT :</span>
                <strong>{subtotal.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TVA :</span>
                <strong>{taxTotal.toFixed(2)}</strong>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
                  <span>Remise :</span>
                  <strong>-{discountAmount.toFixed(2)}</strong>
                </div>
              )}
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                <strong>Total TTC :</strong>
                <strong style={{ color: '#1890ff' }}>{grandTotal.toFixed(2)}</strong>
              </div>
            </Space>
          </Col>
        </Row>

        <Divider orientation="left" plain>Adresse de facturation</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="billingName" label="Nom">
              <Input placeholder="Nom de facturation" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="billingStreet" label="Adresse">
              <Input placeholder="Rue" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="billingCity" label="Ville">
              <Input placeholder="Ville" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="billingCountry" label="Pays">
              <Input placeholder="Pays" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={1} placeholder="Notes internes" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
