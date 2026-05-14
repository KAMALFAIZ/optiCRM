import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Tabs,
  message,
  Spin,
  InputNumber,
  Switch,
  Divider,
  Upload,
  Button,
  Space,
  Typography,
  Empty,
  Table,
  Alert,
  Popconfirm,
  Tag,
} from 'antd';
import { UploadOutlined, DeleteOutlined, FilePdfOutlined, MailOutlined, PaperClipOutlined, EditOutlined, TagsOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import SendDatasheetModal from './SendDatasheetModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { createProduct, updateProduct, fetchProductById, clearSelectedProduct, fetchCategories } from './productsSlice';
import { CreateProductRequest, CURRENCIES, UNITS_OF_MEASURE } from '@/types/product';
import apiClient from '@/api/client';
import { ApiResponse } from '@/types/api';

interface TaxRate {
  id: string;
  code: string;
  name: string;
  rate: number;
}

interface ProductFormModalProps {
  open: boolean;
  productId: string | null;
  onClose: (refresh?: boolean) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ open, productId, onClose }) => {
  const dispatch = useAppDispatch();
  const { selectedProduct, loading, categories } = useAppSelector((state) => state.products);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  // Datasheet state
  const [datasheetInfo, setDatasheetInfo] = useState<{ url: string; name: string } | null>(null);
  const [datasheetUploading, setDatasheetUploading] = useState(false);
  const [pendingDatasheetFile, setPendingDatasheetFile] = useState<File | null>(null);
  const [sendDatasheetOpen, setSendDatasheetOpen] = useState(false);

  // Pricing per category state
  const [pricingCategories, setPricingCategories] = useState<{ id: string; code: string; name: string; isDefault: boolean }[]>([]);
  const [productPrices, setProductPrices] = useState<{ id: string; categoryId: string; categoryCode: string; categoryName: string; categoryIsDefault: boolean; unitPrice: number; currency: string }[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [setPriceModal, setSetPriceModal] = useState<{ categoryId: string; categoryName: string; existingPrice?: { unitPrice: number; currency: string } } | null>(null);
  const [setPriceForm] = Form.useForm();
  const [savingPrice, setSavingPrice] = useState(false);

  const isEditing = !!productId;

  // Load tax rates and pricing categories on mount
  useEffect(() => {
    const loadTaxRates = async () => {
      try {
        const response = await apiClient.get<ApiResponse<TaxRate[]>>('/tax-rates');
        setTaxRates(response.data.data || []);
      } catch (error) {
        console.error('Error loading tax rates:', error);
      }
    };
    const loadPricingCategories = async () => {
      try {
        const response = await apiClient.get<ApiResponse<{ id: string; code: string; name: string; isDefault: boolean }[]>>('/pricing-categories/active');
        setPricingCategories(response.data.data || []);
      } catch (error) {
        console.error('Error loading pricing categories:', error);
      }
    };
    loadTaxRates();
    loadPricingCategories();
  }, []);

  useEffect(() => {
    if (open) {
      dispatch(fetchCategories());
      if (productId) {
        dispatch(fetchProductById(productId));
      }
      // Load product prices for editing
      if (productId) {
        setPricesLoading(true);
        apiClient.get<ApiResponse<typeof productPrices>>(`/products/${productId}/prices`)
          .then(res => setProductPrices(res.data.data || []))
          .catch(() => {})
          .finally(() => setPricesLoading(false));
      }
    } else {
      form.resetFields();
      dispatch(clearSelectedProduct());
      setImagePreview(null);
      setPendingImageFile(null);
      setDatasheetInfo(null);
      setPendingDatasheetFile(null);
      setProductPrices([]);
    }
  }, [open, productId, dispatch, form]);

  useEffect(() => {
    if (selectedProduct && isEditing) {
      form.setFieldsValue({
        ...selectedProduct,
        categoryId: selectedProduct.category?.id,
        defaultTaxRateId: selectedProduct.defaultTaxRate?.id,
      });
      setImagePreview(selectedProduct.imageUrl || null);
      setDatasheetInfo(selectedProduct.datasheetUrl
        ? { url: selectedProduct.datasheetUrl, name: selectedProduct.datasheetName || 'fiche-technique' }
        : null);
    }
  }, [selectedProduct, isEditing, form]);

  const uploadImage = async (file: File, id: string) => {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post(`/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleImageSelect = (file: File) => {
    if (isEditing && productId) {
      // Upload immediately for existing products
      setImageUploading(true);
      uploadImage(file, productId)
        .then(async () => {
          // Refresh product to get new imageUrl
          const res = await apiClient.get<ApiResponse<any>>(`/products/${productId}`);
          const url = res.data.data?.imageUrl;
          form.setFieldValue('imageUrl', url);
          setImagePreview(url || null);
          message.success('Image mise à jour');
        })
        .catch(() => message.error("Erreur lors de l'upload"))
        .finally(() => setImageUploading(false));
    } else {
      // Store for upload after product creation
      setPendingImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    return false; // prevent antd auto-upload
  };

  const handleDatasheetSelect = (file: File) => {
    if (isEditing && productId) {
      setDatasheetUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      apiClient.post<ApiResponse<any>>(`/products/${productId}/datasheet`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
        .then((res) => {
          const data = res.data.data;
          setDatasheetInfo({ url: data.datasheetUrl, name: data.datasheetName || file.name });
          message.success('Fiche technique mise à jour');
        })
        .catch((err) => {
          const msg = err?.response?.data?.error?.message || "Erreur lors de l'upload de la fiche";
          message.error(msg);
        })
        .finally(() => setDatasheetUploading(false));
    } else {
      setPendingDatasheetFile(file);
      setDatasheetInfo({ url: '', name: file.name });
    }
    return false;
  };

  const handleDeleteDatasheet = async () => {
    if (!isEditing || !productId) {
      setPendingDatasheetFile(null);
      setDatasheetInfo(null);
      return;
    }
    setDatasheetUploading(true);
    try {
      await apiClient.delete(`/products/${productId}/datasheet`);
      setDatasheetInfo(null);
      message.success('Fiche technique supprimée');
    } catch {
      message.error('Erreur lors de la suppression');
    } finally {
      setDatasheetUploading(false);
    }
  };

  const handleOpenSetPrice = (categoryId: string, categoryName: string) => {
    const existing = productPrices.find(p => p.categoryId === categoryId);
    setSetPriceModal({
      categoryId,
      categoryName,
      existingPrice: existing ? { unitPrice: existing.unitPrice, currency: existing.currency } : undefined,
    });
    setPriceForm.setFieldsValue({
      unitPrice: existing?.unitPrice ?? null,
      currency: existing?.currency || 'MAD',
    });
  };

  const handleSavePrice = async () => {
    if (!productId || !setPriceModal) return;
    try {
      const values = await setPriceForm.validateFields();
      setSavingPrice(true);
      await apiClient.put<ApiResponse<any>>(`/products/${productId}/prices`, {
        pricingCategoryId: setPriceModal.categoryId,
        unitPrice: values.unitPrice,
        currency: values.currency || 'MAD',
      });
      const res = await apiClient.get<ApiResponse<typeof productPrices>>(`/products/${productId}/prices`);
      setProductPrices(res.data.data || []);
      setSetPriceModal(null);
      setPriceForm.resetFields();
      message.success('Prix enregistré');
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || 'Erreur lors de la sauvegarde du prix');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleDeletePrice = async (categoryId: string) => {
    if (!productId) return;
    try {
      await apiClient.delete(`/products/${productId}/prices/${categoryId}`);
      setProductPrices(prev => prev.filter(p => p.categoryId !== categoryId));
      message.success('Prix supprimé');
    } catch (error: any) {
      message.error(error.message || 'Erreur lors de la suppression du prix');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data: CreateProductRequest = {
        ...values,
      };

      if (isEditing && productId) {
        await dispatch(updateProduct({ id: productId, data })).unwrap();
        message.success('Produit mis à jour avec succès');
      } else {
        const created = await dispatch(createProduct(data)).unwrap() as any;
        // Upload pending image if any
        if (pendingImageFile && created?.id) {
          try {
            await uploadImage(pendingImageFile, created.id);
          } catch {
            // non-blocking
          }
        }
        // Upload pending datasheet if any
        if (pendingDatasheetFile && created?.id) {
          try {
            const formData = new FormData();
            formData.append('file', pendingDatasheetFile);
            await apiClient.post(`/products/${created.id}/datasheet`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch {
            // non-blocking
          }
        }
        message.success('Produit créé avec succès');
      }

      onClose(true);
    } catch (error: any) {
      if (error.errorFields) {
        return; // Validation errors
      }
      const msg = typeof error === 'string' ? error : (error?.message || error?.response?.data?.error?.message || 'Une erreur est survenue');
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));

  const taxRateOptions = taxRates.map(tax => ({
    value: tax.id,
    label: `${tax.name} (${tax.rate}%)`,
  }));

  const tabItems = [
    {
      key: 'general',
      label: 'Informations générales',
      children: (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="code"
                label="Code produit"
                rules={[
                  { required: true, message: 'Le code est obligatoire' },
                  { max: 50, message: 'Le code ne doit pas dépasser 50 caractères' },
                ]}
              >
                <Input placeholder="PROD-001" disabled={isEditing} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Nom du produit"
                rules={[
                  { required: true, message: 'Le nom est obligatoire' },
                  { max: 255, message: 'Le nom ne doit pas dépasser 255 caractères' },
                ]}
              >
                <Input placeholder="Nom du produit" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="Catégorie">
                <Select
                  placeholder="Sélectionner une catégorie"
                  options={categoryOptions}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="Marque">
                <Input placeholder="Marque" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description du produit" />
          </Form.Item>

          <Form.Item name="imageUrl" label="Image du produit" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="Image du produit">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {imagePreview && (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #d9d9d9' }}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ position: 'absolute', top: -8, right: -8, padding: '0 4px' }}
                    onClick={() => {
                      setImagePreview(null);
                      setPendingImageFile(null);
                      form.setFieldValue('imageUrl', null);
                    }}
                  />
                </div>
              )}
              <Upload
                accept="image/jpeg,image/png,image/gif,image/webp"
                showUploadList={false}
                beforeUpload={(file) => handleImageSelect(file)}
              >
                <Button icon={<UploadOutlined />} loading={imageUploading}>
                  {imagePreview ? 'Changer l\'image' : 'Sélectionner une image'}
                </Button>
              </Upload>
            </div>
          </Form.Item>
        </>
      ),
    },
    {
      key: 'pricing',
      label: 'Prix et taxes',
      children: (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="unitPrice"
                label="Prix de vente"
                rules={[{ required: true, message: 'Le prix est obligatoire' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="costPrice" label="Prix de revient">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Devise" initialValue="MAD">
                <Select options={CURRENCIES} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="defaultTaxRateId" label="Taux de TVA par défaut">
                <Select
                  placeholder="Sélectionner un taux"
                  options={taxRateOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitOfMeasure" label="Unité de mesure" initialValue="unité">
                <Select options={UNITS_OF_MEASURE} />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'tarifs',
      label: (
        <Space size={4}>
          <TagsOutlined />
          Tarifs par catégorie
        </Space>
      ),
      children: (() => {
        if (!isEditing) {
          return (
            <Alert
              type="info"
              showIcon
              message="Enregistrez d'abord le produit pour définir les tarifs par catégorie."
            />
          );
        }

        type PriceRow = {
          key: string;
          id: string;
          code: string;
          name: string;
          isDefault: boolean;
          price?: { unitPrice: number; currency: string };
        };

        const priceTableData: PriceRow[] = pricingCategories.map(cat => {
          const price = productPrices.find(p => p.categoryId === cat.id);
          return {
            key: cat.id,
            id: cat.id,
            code: cat.code,
            name: cat.name,
            isDefault: cat.isDefault,
            price: price ? { unitPrice: price.unitPrice, currency: price.currency } : undefined,
          };
        });

        const priceColumns: ColumnsType<PriceRow> = [
          {
            title: 'Catégorie',
            key: 'category',
            render: (_: any, record: PriceRow) => (
              <Space>
                <Tag color="blue" style={{ fontFamily: 'monospace' }}>{record.code}</Tag>
                <span>{record.name}</span>
                {record.isDefault && <Tag color="gold">Défaut</Tag>}
              </Space>
            ),
          },
          {
            title: 'Prix unitaire',
            key: 'price',
            width: 160,
            render: (_: any, record: PriceRow) =>
              record.price ? (
                <Typography.Text strong>
                  {record.price.unitPrice.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.price.currency}</Typography.Text>
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary">—</Typography.Text>
              ),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 160,
            render: (_: any, record: PriceRow) => (
              <Space>
                <Button
                  size="small"
                  icon={record.price ? <EditOutlined /> : <PlusOutlined />}
                  onClick={() => handleOpenSetPrice(record.id, record.name)}
                >
                  {record.price ? 'Modifier' : 'Définir'}
                </Button>
                {record.price && (
                  <Popconfirm
                    title="Supprimer ce tarif ?"
                    onConfirm={() => handleDeletePrice(record.id)}
                    okText="Supprimer"
                    okButtonProps={{ danger: true }}
                    cancelText="Annuler"
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ];

        return (
          <Table
            columns={priceColumns}
            dataSource={priceTableData}
            loading={pricesLoading}
            pagination={false}
            size="small"
            locale={{ emptyText: 'Aucune catégorie tarifaire active' }}
          />
        );
      })(),
    },
    {
      key: 'stock',
      label: 'Stock',
      children: (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="isStockable"
                label="Produit stocké"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Oui" unCheckedChildren="Non" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Seuils d'alerte</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minStockLevel" label="Stock minimum" initialValue={0}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reorderLevel" label="Niveau de réapprovisionnement" initialValue={0}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'datasheet',
      label: 'Fiche technique',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {datasheetInfo ? (
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: '16px 20px',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <Space>
                <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                <div>
                  <Typography.Text strong style={{ display: 'block' }}>
                    {datasheetInfo.name}
                  </Typography.Text>
                  {datasheetInfo.url && (
                    <Typography.Link href={datasheetInfo.url} target="_blank" style={{ fontSize: 12 }}>
                      Télécharger
                    </Typography.Link>
                  )}
                </div>
              </Space>
              <Space>
                {isEditing && datasheetInfo.url && (
                  <Button
                    icon={<MailOutlined />}
                    onClick={() => setSendDatasheetOpen(true)}
                  >
                    Envoyer au client
                  </Button>
                )}
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={datasheetUploading}
                  onClick={handleDeleteDatasheet}
                >
                  Supprimer
                </Button>
              </Space>
            </div>
          ) : (
            <Empty
              image={<PaperClipOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              imageStyle={{ height: 60 }}
              description="Aucune fiche technique attachée"
            />
          )}

          <Upload
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            showUploadList={false}
            beforeUpload={(file) => handleDatasheetSelect(file)}
          >
            <Button icon={<UploadOutlined />} loading={datasheetUploading}>
              {datasheetInfo ? 'Remplacer la fiche technique' : 'Ajouter une fiche technique'}
            </Button>
          </Upload>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Formats acceptés : PDF, JPEG, PNG, GIF, WebP — Taille max : 10 MB
          </Typography.Text>
        </Space>
      ),
    },
    {
      key: 'status',
      label: 'État',
      children: (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="isActive"
                label="Actif"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Oui" unCheckedChildren="Non" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isSellable"
                label="Vendable"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Oui" unCheckedChildren="Non" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isPurchasable"
                label="Achetable"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Oui" unCheckedChildren="Non" />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={isEditing ? 'Modifier le produit' : 'Nouveau produit'}
        open={open}
        onOk={handleSubmit}
        onCancel={() => onClose()}
        width={800}
        okText={isEditing ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Spin spinning={loading && isEditing}>
          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
          >
            <Tabs items={tabItems} />
          </Form>
        </Spin>
      </Modal>

      {datasheetInfo?.url && (
        <SendDatasheetModal
          open={sendDatasheetOpen}
          onClose={() => setSendDatasheetOpen(false)}
          productName={selectedProduct?.name || ''}
          datasheetName={datasheetInfo.name}
          datasheetUrl={datasheetInfo.url}
        />
      )}

      {/* Set / edit price modal */}
      <Modal
        title={
          setPriceModal?.existingPrice
            ? `Modifier le tarif — ${setPriceModal?.categoryName}`
            : `Définir le tarif — ${setPriceModal?.categoryName}`
        }
        open={setPriceModal !== null}
        onOk={handleSavePrice}
        onCancel={() => { setSetPriceModal(null); setPriceForm.resetFields(); }}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={savingPrice}
        width={380}
        destroyOnHidden
      >
        <Form form={setPriceForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="unitPrice"
                label="Prix unitaire"
                rules={[
                  { required: true, message: 'Le prix est obligatoire' },
                  { type: 'number', min: 0, message: 'Le prix doit être positif' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="currency" label="Devise" initialValue="MAD">
                <Select
                  options={[
                    { value: 'MAD', label: 'MAD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default ProductFormModal;
