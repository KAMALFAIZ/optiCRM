import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  InputNumber,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Typography,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { pricingCategoriesApi } from '@/api/pricingCategories';
import { PricingCategory, CreatePricingCategoryRequest, UpdatePricingCategoryRequest } from '@/types/pricingCategory';

const { Title } = Typography;

const PricingCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PricingCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await pricingCategoriesApi.getAll();
      setCategories(data);
    } catch (error: any) {
      message.error(error.message || 'Erreur lors du chargement des catégories tarifaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, isDefault: false, sortOrder: 0 });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: PricingCategory) => {
    setEditingCategory(cat);
    form.setFieldsValue({
      code: cat.code,
      name: cat.name,
      description: cat.description,
      isDefault: cat.isDefault,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await pricingCategoriesApi.delete(id);
      message.success('Catégorie supprimée');
      loadCategories();
    } catch (error: any) {
      message.error(error.message || 'Impossible de supprimer cette catégorie');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingCategory) {
        const data: UpdatePricingCategoryRequest = {
          name: values.name,
          description: values.description,
          isDefault: values.isDefault,
          isActive: values.isActive,
          sortOrder: values.sortOrder,
        };
        await pricingCategoriesApi.update(editingCategory.id, data);
        message.success('Catégorie mise à jour');
      } else {
        const data: CreatePricingCategoryRequest = {
          code: values.code,
          name: values.name,
          description: values.description,
          isDefault: values.isDefault,
          isActive: values.isActive,
          sortOrder: values.sortOrder,
        };
        await pricingCategoriesApi.create(data);
        message.success('Catégorie créée');
      }

      setModalOpen(false);
      loadCategories();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<PricingCategory> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (code: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PricingCategory) => (
        <Space>
          <span>{name}</span>
          {record.isDefault && <Tag color="gold">Défaut</Tag>}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc?: string) => desc || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Ordre',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center',
    },
    {
      title: 'État',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (isActive: boolean) =>
        isActive ? <Tag color="green">Actif</Tag> : <Tag color="default">Inactif</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_: any, record: PricingCategory) => (
        <Space>
          <Tooltip title="Modifier">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isDefault ? 'Impossible de supprimer la catégorie par défaut' : 'Supprimer'}>
            <Popconfirm
              title="Supprimer cette catégorie tarifaire ?"
              description="Cette action est irréversible."
              onConfirm={() => handleDelete(record.id)}
              okText="Supprimer"
              okButtonProps={{ danger: true }}
              cancelText="Annuler"
              disabled={record.isDefault}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record.isDefault}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <TagsOutlined style={{ fontSize: 22, color: '#7c3aed' }} />
          <Title level={3} style={{ margin: 0 }}>
            Catégories tarifaires
          </Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          Nouvelle catégorie
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{ emptyText: 'Aucune catégorie tarifaire' }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Modifier la catégorie tarifaire' : 'Nouvelle catégorie tarifaire'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingCategory ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        confirmLoading={submitting}
        destroyOnHidden
        width={520}
      >
        <Form form={form} layout="vertical" requiredMark="optional" style={{ marginTop: 16 }}>
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Le code est obligatoire' },
              { max: 50, message: 'Le code ne doit pas dépasser 50 caractères' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Le code doit être en majuscules (A-Z, 0-9, _)' },
            ]}
            tooltip="Code unique, ex: STANDARD, GROSSISTE, REVENDEUR. Sera converti en majuscules automatiquement."
          >
            <Input
              placeholder="GROSSISTE"
              disabled={!!editingCategory}
              onChange={(e) => form.setFieldValue('code', e.target.value.toUpperCase())}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Nom"
            rules={[
              { required: true, message: 'Le nom est obligatoire' },
              { max: 100, message: 'Le nom ne doit pas dépasser 100 caractères' },
            ]}
          >
            <Input placeholder="Tarif Grossiste" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Description optionnelle..." maxLength={500} showCount />
          </Form.Item>

          <Form.Item name="sortOrder" label="Ordre d'affichage" initialValue={0}>
            <InputNumber style={{ width: 120 }} min={0} placeholder="0" />
          </Form.Item>

          <Space size="large">
            <Form.Item name="isDefault" label="Par défaut" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="Oui" unCheckedChildren="Non" />
            </Form.Item>
            <Form.Item name="isActive" label="Actif" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="Oui" unCheckedChildren="Non" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default PricingCategoriesPage;
