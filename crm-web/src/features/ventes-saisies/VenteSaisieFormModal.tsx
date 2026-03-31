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
import dayjs from 'dayjs';
import apiClient from '@/api/client';
import ventesSaisiesApi, {
  VenteSaisieDto,
  CreateVenteSaisieRequest,
  UpdateVenteSaisieRequest,
} from '@/api/ventesSaisies';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountOption {
  id: string;
  name: string;
}

interface VenteSaisieFormModalProps {
  open: boolean;
  venteId: string | null;
  onClose: (refresh?: boolean) => void;
}

// ─── Statut config ────────────────────────────────────────────────────────────

const STATUT_OPTIONS = [
  { value: 'CONFIRME',   label: 'Confirmé' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'ANNULE',     label: 'Annulé' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const VenteSaisieFormModal: React.FC<VenteSaisieFormModalProps> = ({
  open,
  venteId,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  const isEditing = !!venteId;

  // ── Load accounts ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await apiClient.get('/accounts?size=1000&sort=name,asc');
        const content = res.data?.data?.content ?? [];
        setAccounts(content.map((a: any) => ({ id: a.id, name: a.name })));
      } catch {
        // silently ignore
      }
    };
    loadAccounts();
  }, []);

  // ── Load existing vente when editing ──────────────────────────────────────
  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    if (venteId) {
      setLoadingData(true);
      ventesSaisiesApi
        .findById(venteId)
        .then((data: VenteSaisieDto) => {
          form.setFieldsValue({
            accountId:   data.accountId,
            reference:   data.reference,
            dateVente:   data.dateVente ? dayjs(data.dateVente) : null,
            montantHt:   data.montantHt,
            montantTtc:  data.montantTtc,
            description: data.description,
            statut:      data.statut,
          });
        })
        .catch(() => message.error('Erreur lors du chargement de la vente'))
        .finally(() => setLoadingData(false));
    } else {
      form.setFieldsValue({
        dateVente: dayjs(),
        statut: 'CONFIRME',
      });
    }
  }, [open, venteId, form]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const dateVente = values.dateVente?.format('YYYY-MM-DD') ?? '';

      if (isEditing && venteId) {
        const req: UpdateVenteSaisieRequest = {
          accountId:   values.accountId,
          reference:   values.reference,
          dateVente,
          montantHt:   values.montantHt,
          montantTtc:  values.montantTtc,
          description: values.description,
          statut:      values.statut,
        };
        await ventesSaisiesApi.update(venteId, req);
        message.success('Vente mise à jour avec succès');
      } else {
        const req: CreateVenteSaisieRequest = {
          accountId:   values.accountId,
          reference:   values.reference,
          dateVente,
          montantHt:   values.montantHt,
          montantTtc:  values.montantTtc,
          description: values.description,
          statut:      values.statut,
        };
        await ventesSaisiesApi.create(req);
        message.success('Vente créée avec succès');
      }

      onClose(true);
    } catch (error: any) {
      if (error?.errorFields) return; // Validation errors
      message.error(error?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  return (
    <Modal
      title={isEditing ? 'Modifier la vente' : 'Nouvelle vente saisie'}
      open={open}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      width={680}
      okText={isEditing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Spin spinning={loadingData}>
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          style={{ marginTop: 8 }}
        >
          {/* Compte */}
          <Form.Item
            name="accountId"
            label="Compte client"
            rules={[{ required: true, message: 'Le compte est obligatoire' }]}
          >
            <Select
              placeholder="Sélectionner un compte..."
              options={accountOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            />
          </Form.Item>

          <Row gutter={16}>
            {/* Référence */}
            <Col span={12}>
              <Form.Item name="reference" label="Référence">
                <Input placeholder="N° facture, bon de commande..." />
              </Form.Item>
            </Col>
            {/* Date */}
            <Col span={12}>
              <Form.Item
                name="dateVente"
                label="Date de vente"
                rules={[{ required: true, message: 'La date est obligatoire' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Montant HT */}
            <Col span={12}>
              <Form.Item
                name="montantHt"
                label="Montant HT (MAD)"
                rules={[{ required: true, message: 'Le montant HT est obligatoire' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                />
              </Form.Item>
            </Col>
            {/* Montant TTC */}
            <Col span={12}>
              <Form.Item
                name="montantTtc"
                label="Montant TTC (MAD)"
                rules={[{ required: true, message: 'Le montant TTC est obligatoire' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Statut */}
            <Col span={10}>
              <Form.Item name="statut" label="Statut" initialValue="CONFIRME">
                <Select options={STATUT_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          {/* Description */}
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Informations complémentaires..." />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default VenteSaisieFormModal;
