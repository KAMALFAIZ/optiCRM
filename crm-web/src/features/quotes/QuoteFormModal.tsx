import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  message,
  Divider,
  Table,
  Button,
  Card,
  Tabs,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { createQuote, updateQuote, fetchQuoteById } from './quotesSlice';
import { QuoteListItem, CreateQuoteRequest, UpdateQuoteRequest, LineItemRequest } from '@/types/quote';
import { accountsApi } from '@/api/accounts';
import { contactsApi } from '@/api/contacts';
import { opportunitiesApi } from '@/api/opportunities';
import { productsApi } from '@/api/products';
import { AccountListItem } from '@/types/account';
import { ContactListItem } from '@/types/contact';
import { OpportunityListItem } from '@/types/opportunity';
import { ProductListItem } from '@/types/product';
import type { RootState } from '@/store';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface QuoteFormModalProps {
  visible: boolean;
  quote: QuoteListItem | null;
  onClose: (success?: boolean) => void;
}

const CURRENCIES = [
  { value: 'MAD', label: 'DH MAD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'GBP', label: '£ GBP' },
];

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  visible,
  quote,
  onClose,
}) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { loading, currentQuote } = useAppSelector((state: RootState) => state.quotes);

  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItemRequest[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const isEditing = !!quote;

  useEffect(() => {
    if (visible) {
      loadAccounts();
      loadProducts();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedAccountId) {
      loadContacts(selectedAccountId);
      loadOpportunities(selectedAccountId);
    } else {
      setContacts([]);
      setOpportunities([]);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (visible && quote) {
      dispatch(fetchQuoteById(quote.id));
    }
  }, [visible, quote, dispatch]);

  useEffect(() => {
    if (visible && currentQuote && quote) {
      setSelectedAccountId(currentQuote.account.id);
      setLineItems(currentQuote.lineItems.map((item, index) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        sortOrder: index,
      })));

      form.setFieldsValue({
        name: currentQuote.name,
        accountId: currentQuote.account.id,
        contactId: currentQuote.contact?.id,
        opportunityId: currentQuote.opportunity?.id,
        quoteDate: currentQuote.quoteDate ? dayjs(currentQuote.quoteDate) : undefined,
        validUntil: currentQuote.validUntil ? dayjs(currentQuote.validUntil) : undefined,
        currency: currentQuote.currency || 'MAD',
        discountPercent: currentQuote.discountPercent,
        taxPercent: currentQuote.taxPercent,
        shippingAmount: currentQuote.shippingAmount,
        terms: currentQuote.terms,
        notes: currentQuote.notes,
        billingAddress: currentQuote.billingAddress,
        shippingAddress: currentQuote.shippingAddress,
      });
    } else if (visible && !quote) {
      form.resetFields();
      form.setFieldsValue({
        currency: 'MAD',
        taxPercent: 20,
        quoteDate: dayjs(),
        validUntil: dayjs().add(30, 'day'),
      });
      setSelectedAccountId(null);
      setLineItems([]);
    }
  }, [visible, currentQuote, quote, form]);

  const loadAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await accountsApi.getAll({ size: 100 });
      setAccounts(response.content);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const loadContacts = async (accountId: string) => {
    setContactsLoading(true);
    try {
      const response = await contactsApi.getByAccount(accountId);
      setContacts(response);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadOpportunities = async (accountId: string) => {
    setOpportunitiesLoading(true);
    try {
      const response = await opportunitiesApi.getByAccount(accountId);
      setOpportunities(response);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setOpportunitiesLoading(false);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await productsApi.getAll({ isSellable: true, isActive: true, size: 500 });
      setProducts(response.content);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    form.setFieldValue('contactId', undefined);
    form.setFieldValue('opportunityId', undefined);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        name: '',
        quantity: 1,
        unit: 'unité',
        unitPrice: 0,
        sortOrder: lineItems.length,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemRequest, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discount = item.discountPercent ? (lineTotal * item.discountPercent) / 100 : 0;
      return sum + lineTotal - discount;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountPercent = form.getFieldValue('discountPercent') || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxPercent = form.getFieldValue('taxPercent') || 0;
    const taxAmount = (afterDiscount * taxPercent) / 100;
    const shippingAmount = form.getFieldValue('shippingAmount') || 0;
    return afterDiscount + taxAmount + shippingAmount;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (lineItems.length === 0) {
        message.error('Veuillez ajouter au moins un article');
        return;
      }

      const hasEmptyItems = lineItems.some((item) => !item.name || !item.unitPrice);
      if (hasEmptyItems) {
        message.error('Veuillez remplir tous les articles');
        return;
      }

      const formData = {
        ...values,
        quoteDate: values.quoteDate ? values.quoteDate.format('YYYY-MM-DD') : undefined,
        validUntil: values.validUntil ? values.validUntil.format('YYYY-MM-DD') : undefined,
        lineItems: lineItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      };

      if (isEditing && quote) {
        await dispatch(updateQuote({ id: quote.id, data: formData as UpdateQuoteRequest })).unwrap();
        message.success('Devis mis à jour avec succès');
      } else {
        await dispatch(createQuote(formData as CreateQuoteRequest)).unwrap();
        message.success('Devis créé avec succès');
      }

      onClose(true);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(typeof error === 'string' ? error : (error?.message || 'Une erreur est survenue'));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(value);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const updated = [...lineItems];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        name: product.name,
        sku: product.code,
        unitPrice: product.unitPrice,
        unit: product.unitOfMeasure || 'unité',
      };
      setLineItems(updated);
    }
  };

  const lineItemColumns = [
    {
      title: 'Article',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: LineItemRequest, index: number) => (
        <Select
          value={record.productId || undefined}
          onChange={(value: string) => handleProductSelect(index, value)}
          placeholder="Sélectionner un produit"
          showSearch
          loading={productsLoading}
          filterOption={(input, option) =>
            (option?.label as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={products.map((p) => ({
            value: p.id,
            label: `${p.code} - ${p.name}`,
          }))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Qté',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (_: any, record: LineItemRequest, index: number) => (
        <InputNumber
          value={record.quantity}
          onChange={(val) => updateLineItem(index, 'quantity', val)}
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (_: any, record: LineItemRequest, index: number) => (
        <InputNumber
          value={record.unitPrice}
          onChange={(val) => updateLineItem(index, 'unitPrice', val)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Remise %',
      dataIndex: 'discountPercent',
      key: 'discountPercent',
      width: 90,
      render: (_: any, record: LineItemRequest, index: number) => (
        <InputNumber
          value={record.discountPercent}
          onChange={(val) => updateLineItem(index, 'discountPercent', val)}
          min={0}
          max={100}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Total ligne',
      key: 'lineTotal',
      width: 120,
      render: (_: any, record: LineItemRequest) => {
        const lineTotal = (record.quantity || 0) * (record.unitPrice || 0);
        const discount = record.discountPercent ? (lineTotal * record.discountPercent) / 100 : 0;
        return formatCurrency(lineTotal - discount);
      },
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLineItem(index)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={isEditing ? 'Modifier le devis' : 'Nouveau devis'}
      open={visible}
      onCancel={() => onClose()}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={960}
      okText={isEditing ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      styles={{ body: { paddingTop: 8 } }}
    >
      <Form form={form} layout="vertical">
        <Tabs type="card" size="small" items={[
          {
            key: 'infos',
            label: 'Informations',
            children: (
              <>
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item name="name" label="Nom du devis" rules={[{ required: true, message: 'Le nom est obligatoire' }]}>
                      <Input placeholder="Ex: Devis - Projet CRM" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="currency" label="Devise" initialValue="MAD">
                      <Select options={CURRENCIES} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="accountId" label="Compte" rules={[{ required: true, message: 'Le compte est obligatoire' }]}>
                      <Select
                        placeholder="Sélectionner un compte"
                        loading={accountsLoading} showSearch
                        filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}
                        onChange={handleAccountChange}
                      >
                        {accounts.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="contactId" label="Contact">
                      <Select placeholder="Sélectionner un contact" loading={contactsLoading} disabled={!selectedAccountId} allowClear showSearch
                        filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                        {contacts.map(c => <Option key={c.id} value={c.id}>{c.fullName}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="opportunityId" label="Opportunité">
                      <Select placeholder="Sélectionner une opportunité" loading={opportunitiesLoading} disabled={!selectedAccountId} allowClear showSearch
                        filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                        {opportunities.map(o => <Option key={o.id} value={o.id}>{o.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="quoteDate" label="Date du devis">
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="validUntil" label="Valide jusqu'au" rules={[{ required: true, message: 'La date de validité est obligatoire' }]}>
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: 'articles',
            label: `Articles (${lineItems.length})`,
            children: (
              <Table
                dataSource={lineItems}
                columns={lineItemColumns}
                rowKey={(_, index) => index?.toString() || '0'}
                pagination={false}
                size="small"
                footer={() => (
                  <Button type="dashed" onClick={addLineItem} icon={<PlusOutlined />} block>
                    Ajouter un article
                  </Button>
                )}
              />
            ),
          },
          {
            key: 'totaux',
            label: 'Totaux & Conditions',
            children: (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="notes" label="Notes internes">
                    <TextArea rows={3} placeholder="Notes internes..." />
                  </Form.Item>
                  <Form.Item name="terms" label="Conditions">
                    <TextArea rows={3} placeholder="Conditions de paiement, garantie, etc." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                    <Row gutter={[8, 8]}>
                      <Col span={12}>Sous-total :</Col>
                      <Col span={12} style={{ textAlign: 'right' }}>{formatCurrency(calculateSubtotal())}</Col>
                      <Col span={8}>Remise :</Col>
                      <Col span={8}>
                        <Form.Item name="discountPercent" noStyle>
                          <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        -{formatCurrency((calculateSubtotal() * (form.getFieldValue('discountPercent') || 0)) / 100)}
                      </Col>
                      <Col span={8}>TVA :</Col>
                      <Col span={8}>
                        <Form.Item name="taxPercent" noStyle initialValue={20}>
                          <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        {formatCurrency((calculateSubtotal() * (1 - (form.getFieldValue('discountPercent') || 0) / 100) * (form.getFieldValue('taxPercent') || 0)) / 100)}
                      </Col>
                      <Col span={8}>Frais de port :</Col>
                      <Col span={8}>
                        <Form.Item name="shippingAmount" noStyle>
                          <InputNumber min={0} style={{ width: '100%' }} precision={2} size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>{formatCurrency(form.getFieldValue('shippingAmount') || 0)}</Col>
                      <Col span={24}><Divider style={{ margin: '8px 0' }} /></Col>
                      <Col span={12} style={{ fontWeight: 'bold', fontSize: 16 }}>Total :</Col>
                      <Col span={12} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16, color: '#1890ff' }}>
                        {formatCurrency(calculateTotal())}
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]} />
      </Form>
    </Modal>
  );
};

export default QuoteFormModal;
