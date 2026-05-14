import { useEffect, useState, useCallback } from 'react';
import {
  Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, Divider, message,
} from 'antd';
import dayjs from 'dayjs';

import { useAppDispatch } from '@/store';
import { createCampaign, updateCampaign, fetchCampaignById } from './campaignsSlice';
import {
  CAMPAIGN_TYPE_CONFIG,
  CAMPAIGN_STATUS_CONFIG,
} from '@/types/campaign';

interface Props {
  open: boolean;
  campaignId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS = Object.entries(CAMPAIGN_TYPE_CONFIG).map(([value, cfg]) => ({
  value, label: cfg.label,
}));

const STATUS_OPTIONS = Object.entries(CAMPAIGN_STATUS_CONFIG).map(([value, cfg]) => ({
  value, label: cfg.label,
}));

export default function CampaignFormModal({ open, campaignId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const isEdit = !!campaignId;

  const [loading, setLoading] = useState(false);

  const loadCampaign = useCallback(async () => {
    if (campaignId) {
      setLoading(true);
      try {
        const result = await dispatch(fetchCampaignById(campaignId)).unwrap();
        if (result) {
          form.setFieldsValue({
            name: result.name,
            description: result.description,
            type: result.type,
            status: result.status,
            startDate: result.startDate ? dayjs(result.startDate) : null,
            endDate: result.endDate ? dayjs(result.endDate) : null,
            budget: result.budget,
            actualCost: result.actualCost,
            expectedRevenue: result.expectedRevenue,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
  }, [campaignId, dispatch, form]);

  useEffect(() => {
    if (open) {
      if (isEdit) {
        loadCampaign();
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 'draft',
        });
      }
    }
  }, [open, isEdit, form, loadCampaign]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      };

      if (isEdit) {
        await dispatch(updateCampaign({ id: campaignId!, data: payload })).unwrap();
        message.success('Campagne mise à jour');
      } else {
        await dispatch(createCampaign(payload)).unwrap();
        message.success('Campagne créée');
      }
      onSuccess();
    } catch {
      // validation errors handled by antd
    }
  };

  return (
    <Modal
      title={isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      width={700}
      destroyOnHidden
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Divider orientation="left" plain>Informations</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Nom de la campagne"
              rules={[{ required: true, message: 'Le nom est obligatoire' }]}
            >
              <Input placeholder="Nom de la campagne" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Type">
              <Select
                placeholder="Sélectionner un type"
                options={TYPE_OPTIONS}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="Statut">
              <Select
                options={STATUS_OPTIONS}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} placeholder="Description de la campagne" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="startDate" label="Date de début">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="endDate" label="Date de fin">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>Budget</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="budget" label="Budget">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0.00"
                precision={2}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="actualCost" label="Coût réel">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0.00"
                precision={2}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="expectedRevenue" label="Revenue attendu">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0.00"
                precision={2}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
