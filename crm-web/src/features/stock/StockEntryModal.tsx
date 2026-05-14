import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Divider,
  Row,
  Col,
  Alert,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { createStockEntry, fetchLowStock } from './inventorySlice';
import productsApi from '@/api/products';
import type { ProductListItem } from '@/types/product';

interface StockEntryModalProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
}

const StockEntryModal: React.FC<StockEntryModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { warehouses, loading } = useAppSelector((state) => state.inventory);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProducts('');
    } else {
      form.resetFields();
      setProducts([]);
    }
  }, [open]);

  const loadProducts = async (search: string) => {
    setSearchLoading(true);
    try {
      const result = await productsApi.getAll({ search, isStockable: true, size: 50 });
      setProducts(result.content);
    } catch {
      // silent
    } finally {
      setSearchLoading(false);
    }
  };

  const handleProductSearch = (value: string) => {
    loadProducts(value);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(
        createStockEntry({
          productId: values.productId,
          warehouseId: values.warehouseId,
          movementType: 'PURCHASE',
          quantity: values.quantity,
          unitCost: values.unitCost ?? undefined,
          notes: values.notes ?? undefined,
        })
      ).unwrap();

      message.success('Stock ajouté avec succès');
      dispatch(fetchLowStock());
      form.resetFields();
      onClose(true);
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || "Erreur lors de l'entrée de stock"));
    }
  };

  const warehouseOptions = warehouses.map((w) => ({
    value: w.id,
    label: w.isDefault ? `${w.name} (principal)` : w.name,
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
  }));

  return (
    <Modal
      title={
        <span>
          <PlusOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          Entrée de stock
        </span>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onClose(false);
      }}
      okText="Ajouter au stock"
      cancelText="Annuler"
      confirmLoading={loading}
      width={580}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        message="Réception de marchandises"
        description="Cette opération enregistre une entrée de stock de type Achat et met à jour le coût moyen pondéré du produit."
        className="mb-4 mt-2"
      />

      <Form form={form} layout="vertical">
        <Divider orientation="left" plain>
          Produit &amp; Entrepôt
        </Divider>

        <Form.Item
          name="productId"
          label="Produit"
          rules={[{ required: true, message: 'Veuillez sélectionner un produit' }]}
        >
          <Select
            showSearch
            placeholder="Rechercher un produit stockable..."
            filterOption={false}
            onSearch={handleProductSearch}
            loading={searchLoading}
            options={productOptions}
            notFoundContent={searchLoading ? 'Chargement...' : 'Aucun produit trouvé'}
          />
        </Form.Item>

        <Form.Item
          name="warehouseId"
          label="Entrepôt de destination"
          rules={[{ required: true, message: "Veuillez sélectionner l'entrepôt" }]}
        >
          <Select
            placeholder="Sélectionner l'entrepôt"
            options={warehouseOptions}
          />
        </Form.Item>

        <Divider orientation="left" plain>
          Quantité &amp; Coût
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="Quantité reçue"
              rules={[
                { required: true, message: 'Quantité requise' },
                { type: 'number', min: 0.01, message: 'La quantité doit être supérieure à 0' },
              ]}
            >
              <InputNumber
                min={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="Ex : 100"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unitCost"
              label="Coût unitaire"
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="Ex : 450.00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          Informations complémentaires
        </Divider>

        <Form.Item name="notes" label="Notes / Référence">
          <Input.TextArea
            rows={3}
            placeholder="Numéro BL, fournisseur, remarques..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StockEntryModal;
