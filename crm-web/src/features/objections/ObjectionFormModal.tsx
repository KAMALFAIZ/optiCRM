import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  Spin,
  Divider,
} from 'antd';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createObjection,
  updateObjection,
  fetchObjectionById,
  clearSelectedObjection,
} from './objectionsSlice';
import {
  CreateObjectionRequest,
  OBJECTION_CATEGORY_CONFIG,
  OBJECTION_STATUS_CONFIG,
  OBJECTION_PRIORITY_CONFIG,
  OBJECTION_SOURCE_CONFIG,
} from '@/types/objection';
import apiClient from '@/api/client';
import { ApiResponse } from '@/types/api';

interface Account {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface User {
  id: string;
  fullName: string;
}

interface ObjectionFormModalProps {
  open: boolean;
  objectionId: string | null;
  onClose: (refresh?: boolean) => void;
}

const ObjectionFormModal: React.FC<ObjectionFormModalProps> = ({
  open,
  objectionId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { selectedObjection, loading } = useAppSelector((state) => state.objections);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const isEditing = !!objectionId;

  // Load reference data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsRes, contactsRes, usersRes] = await Promise.all([
          apiClient.get<ApiResponse<{ content: Account[] }>>('/accounts?size=1000'),
          apiClient.get<ApiResponse<{ content: Contact[] }>>('/contacts?size=1000'),
          apiClient.get<ApiResponse<User[]>>('/users'),
        ]);
        setAccounts(accountsRes.data.data?.content || []);
        setContacts(contactsRes.data.data?.content || []);
        setUsers(usersRes.data.data || []);
      } catch (error) {
        console.error('Error loading reference data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (open) {
      if (objectionId) {
        dispatch(fetchObjectionById(objectionId));
      }
    } else {
      form.resetFields();
      dispatch(clearSelectedObjection());
    }
  }, [open, objectionId, dispatch, form]);

  useEffect(() => {
    if (selectedObjection && isEditing) {
      form.setFieldsValue({
        ...selectedObjection,
        contactId: selectedObjection.contact?.id,
        accountId: selectedObjection.account?.id,
        opportunityId: selectedObjection.opportunity?.id,
        assignedToId: selectedObjection.assignedTo?.id,
      });
    }
  }, [selectedObjection, isEditing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data: CreateObjectionRequest = {
        ...values,
      };

      if (isEditing && objectionId) {
        await dispatch(updateObjection({ id: objectionId, data })).unwrap();
        message.success('Objection mise à jour avec succès');
      } else {
        await dispatch(createObjection(data)).unwrap();
        message.success('Objection créée avec succès');
      }

      onClose(true);
    } catch (error: any) {
      if (error.errorFields) {
        return; // Validation errors
      }
      message.error(typeof error === 'string' ? error : (error?.message || 'Une erreur est survenue'));
    } finally {
      setSubmitting(false);
    }
  };

  const accountOptions = accounts.map((acc) => ({
    value: acc.id,
    label: acc.name,
  }));

  const contactOptions = contacts.map((c) => ({
    value: c.id,
    label: `${c.firstName} ${c.lastName}`,
  }));

  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.fullName,
  }));

  const categoryOptions = Object.entries(OBJECTION_CATEGORY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const statusOptions = Object.entries(OBJECTION_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const priorityOptions = Object.entries(OBJECTION_PRIORITY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const sourceOptions = Object.entries(OBJECTION_SOURCE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  return (
    <Modal
      title={isEditing ? "Modifier l'objection" : 'Nouvelle objection'}
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
          initialValues={{
            status: 'OPEN',
            priority: 'MEDIUM',
          }}
        >
          <Form.Item
            name="title"
            label="Titre"
            rules={[
              { required: true, message: 'Le titre est obligatoire' },
              { max: 200, message: 'Le titre ne doit pas dépasser 200 caractères' },
            ]}
          >
            <Input placeholder="Résumé de l'objection" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Décrivez l'objection en détail..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label="Catégorie">
                <Select
                  placeholder="Sélectionner"
                  options={categoryOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="Priorité">
                <Select options={priorityOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Statut">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source" label="Source">
                <Select
                  placeholder="Comment l'objection a été soulevée"
                  options={sourceOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignedToId" label="Assigné à">
                <Select
                  placeholder="Sélectionner un utilisateur"
                  options={userOptions}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Relations</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountId" label="Compte">
                <Select
                  placeholder="Sélectionner un compte"
                  options={accountOptions}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactId" label="Contact">
                <Select
                  placeholder="Sélectionner un contact"
                  options={contactOptions}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Réponse</Divider>

          <Form.Item name="response" label="Réponse / Solution">
            <Input.TextArea
              rows={4}
              placeholder="Réponse à l'objection, arguments, solution proposée..."
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ObjectionFormModal;
