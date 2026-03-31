import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Upload,
  message,
  Tabs,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  createExpenseReport,
  updateExpenseReport,
  fetchExpenseReportById,
  clearSelectedExpenseReport,
} from './expenseReportSlice';
import { EXPENSE_CATEGORIES } from '@/types/expenseReport';
import expenseReportsApi from '@/api/expenseReports';
import { GpsLocationPicker } from '@/components/maps';
import type { GpsCoordinates } from '@/components/maps';

const { Text } = Typography;

interface Props {
  open: boolean;
  editingId: string | null;
  tourId?: string;
  tourName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseReportFormModal({
  open,
  editingId,
  tourId,
  tourName,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { selectedReport, loading } = useAppSelector((state) => state.expenseReports);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingId && open) {
      dispatch(fetchExpenseReportById(editingId));
    } else if (open) {
      form.resetFields();
      dispatch(clearSelectedExpenseReport());
    }
  }, [editingId, open, dispatch, form]);

  useEffect(() => {
    if (selectedReport && editingId) {
      form.setFieldsValue({
        title: selectedReport.title,
        description: selectedReport.description,
        currency: selectedReport.currency,
        lines: selectedReport.lines?.map((line) => ({
          category: line.category,
          description: line.description,
          amount: line.amount,
          expenseDate: line.expenseDate ? dayjs(line.expenseDate) : undefined,
          receiptUrl: line.receiptUrl,
          latitude: line.latitude,
          longitude: line.longitude,
          address: line.address,
        })),
      });
    }
  }, [selectedReport, editingId, form]);

  const handleUploadReceipt = async (file: File, lineIndex: number) => {
    try {
      setUploading(true);
      const url = await expenseReportsApi.uploadReceipt(file);
      const lines = form.getFieldValue('lines') || [];
      lines[lineIndex] = { ...lines[lineIndex], receiptUrl: url };
      form.setFieldsValue({ lines });
      message.success('Justificatif uploadé');
    } catch {
      message.error("Erreur lors de l'upload du justificatif");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const calculateTotal = (): number => {
    const lines = form.getFieldValue('lines') || [];
    return lines.reduce((sum: number, line: any) => sum + (line?.amount || 0), 0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const lines = (values.lines || []).map((line: any, index: number) => ({
        category: line.category,
        description: line.description,
        amount: line.amount,
        expenseDate: line.expenseDate?.format('YYYY-MM-DD'),
        receiptUrl: line.receiptUrl,
        latitude: line.latitude,
        longitude: line.longitude,
        address: line.address,
        sortOrder: index,
      }));

      if (editingId) {
        await dispatch(
          updateExpenseReport({
            id: editingId,
            data: {
              title: values.title,
              description: values.description,
              currency: values.currency,
              lines,
            },
          })
        ).unwrap();
      } else {
        if (!tourId) {
          message.error('Impossible de créer une note de frais sans tournée associée.');
          return;
        }
        await dispatch(
          createExpenseReport({
            tourId,
            title: values.title,
            description: values.description,
            currency: values.currency,
            lines,
          })
        ).unwrap();
      }
      onSuccess();
    } catch (error: any) {
      if (error?.message) {
        message.error(error.message);
      }
    }
  };

  return (
    <Modal
      title={editingId ? 'Modifier la note de frais' : 'Nouvelle note de frais'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading || uploading}
      width={900}
      destroyOnHidden
      okText={editingId ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
    >
      <Form form={form} layout="vertical" initialValues={{ currency: 'MAD', lines: [{}] }}>
        <Tabs type="card" size="small" items={[
          {
            key: 'infos',
            label: 'Informations',
            children: (
              <>
                {tourName && (
                  <div style={{ marginBottom: 16, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                    <Text type="secondary">Tournée : </Text>
                    <Text strong>{tourName}</Text>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item
                    name="title"
                    label="Titre"
                    rules={[{ required: true, message: 'Titre requis' }]}
                    style={{ flex: 2 }}
                  >
                    <Input placeholder="Ex: Frais de déplacement zone Nord" />
                  </Form.Item>
                  <Form.Item name="currency" label="Devise" style={{ flex: 1 }}>
                    <Select
                      options={[
                        { value: 'MAD', label: 'MAD' },
                        { value: 'EUR', label: 'EUR' },
                        { value: 'USD', label: 'USD' },
                      ]}
                    />
                  </Form.Item>
                </div>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} placeholder="Description optionnelle..." />
                </Form.Item>
              </>
            ),
          },
          {
            key: 'lignes',
            label: (
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const lines = form.getFieldValue('lines') || [];
                  return `Lignes (${lines.length})`;
                }}
              </Form.Item>
            ),
            children: (
              <>
                <Form.List name="lines">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div
                          key={key}
                          style={{
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 12,
                            backgroundColor: '#fafafa',
                          }}
                        >
                          <div style={{ display: 'flex', gap: 12 }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'category']}
                              label="Catégorie"
                              rules={[{ required: true, message: 'Requis' }]}
                              style={{ flex: 1 }}
                            >
                              <Select
                                placeholder="Sélectionner"
                                options={EXPENSE_CATEGORIES.map((c) => ({
                                  value: c.value,
                                  label: c.label,
                                }))}
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              label="Description"
                              rules={[{ required: true, message: 'Requis' }]}
                              style={{ flex: 2 }}
                            >
                              <Input placeholder="Détail de la dépense" />
                            </Form.Item>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'amount']}
                              label="Montant"
                              rules={[{ required: true, message: 'Requis' }]}
                              style={{ flex: 1 }}
                            >
                              <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'expenseDate']}
                              label="Date"
                              rules={[{ required: true, message: 'Requis' }]}
                              style={{ flex: 1 }}
                            >
                              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Justificatif" style={{ flex: 1 }}>
                              <Space>
                                <Upload
                                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                  showUploadList={false}
                                  beforeUpload={(file) => {
                                    handleUploadReceipt(file, name);
                                    return false;
                                  }}
                                >
                                  <Button icon={<UploadOutlined />} size="small" loading={uploading}>
                                    {form.getFieldValue(['lines', name, 'receiptUrl']) ? 'Remplacer' : 'Upload'}
                                  </Button>
                                </Upload>
                                {form.getFieldValue(['lines', name, 'receiptUrl']) && (
                                  <Text type="success" style={{ fontSize: 12 }}>Uploadé</Text>
                                )}
                              </Space>
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'receiptUrl']} hidden>
                              <Input />
                            </Form.Item>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                              style={{ marginBottom: 24 }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <Form.Item
                              {...restField}
                              name={[name, 'address']}
                              label="Lieu de la dépense"
                              style={{ flex: 2 }}
                            >
                              <Input placeholder="Adresse ou lieu..." />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'latitude']} hidden>
                              <InputNumber />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'longitude']} hidden>
                              <InputNumber />
                            </Form.Item>
                            <Form.Item label=" " style={{ flex: 0, marginBottom: 24 }}>
                              <GpsLocationPicker
                                compact
                                label="GPS"
                                value={
                                  form.getFieldValue(['lines', name, 'latitude']) && form.getFieldValue(['lines', name, 'longitude'])
                                    ? {
                                        latitude: form.getFieldValue(['lines', name, 'latitude']),
                                        longitude: form.getFieldValue(['lines', name, 'longitude']),
                                      }
                                    : undefined
                                }
                                onChange={(coords: GpsCoordinates | undefined) => {
                                  const lines = form.getFieldValue('lines') || [];
                                  if (coords) {
                                    lines[name] = { ...lines[name], latitude: coords.latitude, longitude: coords.longitude };
                                  } else {
                                    lines[name] = { ...lines[name], latitude: undefined, longitude: undefined };
                                  }
                                  form.setFieldsValue({ lines });
                                }}
                              />
                            </Form.Item>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        style={{ marginBottom: 16 }}
                      >
                        Ajouter une ligne
                      </Button>
                    </>
                  )}
                </Form.List>

                <div
                  style={{
                    textAlign: 'right',
                    padding: '12px 16px',
                    backgroundColor: '#e6f7ff',
                    borderRadius: 6,
                    marginTop: 8,
                  }}
                >
                  <Form.Item noStyle shouldUpdate>
                    {() => (
                      <Text strong style={{ fontSize: 16 }}>
                        Total : {calculateTotal().toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                      </Text>
                    )}
                  </Form.Item>
                </div>
              </>
            ),
          },
        ]} />
      </Form>
    </Modal>
  );
}
