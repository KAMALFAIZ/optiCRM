import { useEffect, useState, useCallback } from 'react';
import {
  Modal, Form, Input, Select, InputNumber, Table, Button, message, Spin, Empty,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { chantiersApi, CreateEchantillonRequest } from '@/api/chantiers';
import { productsApi } from '@/api/products';
import type { ProductListItem } from '@/types/product';

interface Props {
  open: boolean;
  chantierId: string;
  chantierNom: string;
  onClose: (refresh?: boolean) => void;
}

interface LigneRow {
  key: string;
  productId?: string;
  productCode: string;
  productName: string;
  quantite: number;
}

export default function EchantillonModal({ open, chantierId, chantierNom, onClose }: Props) {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [lignes, setLignes] = useState<LigneRow[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await productsApi.getAll({ isSellable: true, isActive: true, size: 500 });
      setProducts(res.content);
    } catch {
      // silent
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadProducts();
      setLignes([]);
      setNotes('');
    }
  }, [open, loadProducts]);

  const addLigne = () => {
    setLignes(prev => [...prev, { key: Date.now().toString(), productId: undefined, productCode: '', productName: '', quantite: 1 }]);
  };

  const removeLigne = (key: string) => {
    setLignes(prev => prev.filter(l => l.key !== key));
  };

  const updateLigne = (key: string, field: keyof LigneRow, value: any) => {
    setLignes(prev => prev.map(l => l.key === key ? { ...l, [field]: value } : l));
  };

  const handleSelectProduct = (key: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setLignes(prev => prev.map(l => l.key === key ? {
        ...l,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
      } : l));
    }
  };

  const handleSubmit = async () => {
    const validLignes = lignes.filter(l => l.productCode && l.productName);
    if (validLignes.length === 0) {
      message.warning('Veuillez ajouter au moins un produit');
      return;
    }

    const payload: CreateEchantillonRequest = {
      notes: notes.trim() || undefined,
      lignes: validLignes.map(l => ({
        productId: l.productId,
        productCode: l.productCode,
        productName: l.productName,
        quantite: l.quantite,
      })),
    };

    setSaving(true);
    try {
      await chantiersApi.createEchantillon(chantierId, payload);
      message.success('Demande d\'échantillons envoyée à l\'ADV');
      onClose(true);
    } catch (err: any) {
      message.error(err?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSaving(false);
    }
  };

  const productOptions = products.map(p => ({
    value: p.id,
    label: `[${p.code}] ${p.name}`,
  }));

  const columns = [
    {
      title: 'Produit',
      dataIndex: 'productId',
      render: (val: string | undefined, record: LigneRow) => (
        <Select
          value={val}
          showSearch
          placeholder="Rechercher un produit…"
          options={productOptions}
          filterOption={(input, opt) =>
            (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          onChange={v => handleSelectProduct(record.key, v)}
          style={{ width: '100%' }}
          size="small"
          loading={loadingProducts}
        />
      ),
    },
    {
      title: 'Qté',
      dataIndex: 'quantite',
      width: 90,
      render: (val: number, record: LigneRow) => (
        <InputNumber
          value={val}
          min={1}
          precision={0}
          onChange={v => updateLigne(record.key, 'quantite', v ?? 1)}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_: any, record: LigneRow) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeLigne(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={`Demande d'échantillons — ${chantierNom}`}
      open={open}
      onOk={handleSubmit}
      onCancel={() => onClose(false)}
      okText="Envoyer à l'ADV"
      cancelText="Annuler"
      width={700}
      confirmLoading={saving}
    >
      <Spin spinning={loadingProducts}>
        {lignes.length > 0 ? (
          <Table
            dataSource={lignes}
            rowKey="key"
            columns={columns}
            pagination={false}
            size="small"
            style={{ marginBottom: 8 }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Aucun produit ajouté"
            style={{ marginBottom: 8 }}
          />
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addLigne}
          style={{ width: '100%', marginBottom: 16 }}
        >
          Ajouter un produit
        </Button>

        <Form layout="vertical">
          <Form.Item label="Notes / Remarques">
            <Input.TextArea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Destination, délai souhaité, précisions…"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
