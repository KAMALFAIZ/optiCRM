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
  InputNumber,
  DatePicker,
} from 'antd';
import { useAppDispatch, useAppSelector } from '@/store';
import { createPayment, updatePayment, fetchPaymentById, clearSelectedPayment } from './paymentsSlice';
import {
  CreatePaymentRequest,
  PAYMENT_METHOD_CONFIG,
  PAYMENT_STATUS_CONFIG,
  CURRENCIES,
} from '@/types/payment';
import apiClient from '@/api/client';
import { ApiResponse } from '@/types/api';
import dayjs from 'dayjs';

interface Account {
  id: string;
  name: string;
}

interface PaymentFormModalProps {
  open: boolean;
  paymentId: string | null;
  onClose: (refresh?: boolean) => void;
}

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({ open, paymentId, onClose }) => {
  const dispatch = useAppDispatch();
  const { selectedPayment, loading } = useAppSelector((state) => state.payments);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const isEditing = !!paymentId;

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await apiClient.get<ApiResponse<{ content: Account[] }>>('/accounts?size=1000');
        setAccounts(response.data.data?.content || []);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };
    loadAccounts();
  }, []);

  useEffect(() => {
    if (open) {
      if (paymentId) {
        dispatch(fetchPaymentById(paymentId));
      }
    } else {
      form.resetFields();
      dispatch(clearSelectedPayment());
    }
  }, [open, paymentId, dispatch, form]);

  useEffect(() => {
    if (selectedPayment && isEditing) {
      form.setFieldsValue({
        ...selectedPayment,
        accountId: selectedPayment.account?.id,
        paymentDate: dayjs(selectedPayment.paymentDate),
      });
    }
  }, [selectedPayment, isEditing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data: CreatePaymentRequest = {
        ...values,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
      };

      if (isEditing && paymentId) {
        await dispatch(updatePayment({ id: paymentId, data })).unwrap();
        message.success('Paiement mis à jour avec succès');
      } else {
        await dispatch(createPayment(data)).unwrap();
        message.success('Paiement créé avec succès');
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

  const methodOptions = Object.entries(PAYMENT_METHOD_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const statusOptions = Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  return (
    <Modal
      title={isEditing ? 'Modifier le paiement' : 'Nouveau paiement'}
      open={open}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      width={700}
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
            currency: 'MAD',
            status: 'RECEIVED',
            paymentDate: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="accountId"
                label="Compte client"
                rules={[{ required: true, message: 'Le compte est obligatoire' }]}
              >
                <Select
                  placeholder="Sélectionner un compte"
                  options={accountOptions}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paymentDate"
                label="Date du paiement"
                rules={[{ required: true, message: 'La date est obligatoire' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="amount"
                label="Montant"
                rules={[{ required: true, message: 'Le montant est obligatoire' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Devise">
                <Select options={CURRENCIES} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paymentMethod"
                label="Méthode de paiement"
                rules={[{ required: true, message: 'La méthode est obligatoire' }]}
              >
                <Select placeholder="Sélectionner" options={methodOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reference" label="Référence">
                <Input placeholder="N° chèque, virement..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankAccount" label="Compte bancaire">
                <Input placeholder="IBAN ou nom de banque" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Statut">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Informations complémentaires..." />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default PaymentFormModal;
