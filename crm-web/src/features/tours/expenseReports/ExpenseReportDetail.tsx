import { useEffect, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Modal,
  Input,
  message,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FilePdfOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchExpenseReportById,
  submitExpenseReport,
  approveExpenseReport,
  rejectExpenseReport,
  reimburseExpenseReport,
  clearSelectedExpenseReport,
} from './expenseReportSlice';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_REPORT_STATUSES,
  ExpenseReportLine,
  ExpenseReportStatus,
} from '@/types/expenseReport';
import { LocationMap } from '@/components/maps';
import type { MapMarker } from '@/components/maps';

interface Props {
  open: boolean;
  reportId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function ExpenseReportDetail({ open, reportId, onClose, onUpdate }: Props) {
  const dispatch = useAppDispatch();
  const { selectedReport, loading } = useAppSelector((state) => state.expenseReports);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (reportId && open) {
      dispatch(fetchExpenseReportById(reportId));
    }
    return () => {
      dispatch(clearSelectedExpenseReport());
    };
  }, [reportId, open, dispatch]);

  const handleSubmit = async () => {
    if (!reportId) return;
    Modal.confirm({
      title: 'Soumettre cette note de frais ?',
      content: 'Une fois soumise, elle ne pourra plus être modifiée.',
      okText: 'Soumettre',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(submitExpenseReport(reportId)).unwrap();
          message.success('Note de frais soumise');
          onUpdate?.();
        } catch (error: any) {
          message.error(error?.message || 'Erreur lors de la soumission');
        }
      },
    });
  };

  const handleApprove = async () => {
    if (!reportId) return;
    Modal.confirm({
      title: 'Approuver cette note de frais ?',
      okText: 'Approuver',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(approveExpenseReport(reportId)).unwrap();
          message.success('Note de frais approuvée');
          onUpdate?.();
        } catch (error: any) {
          message.error(error?.message || 'Erreur lors de l\'approbation');
        }
      },
    });
  };

  const handleReject = async () => {
    if (!reportId) return;
    try {
      await dispatch(rejectExpenseReport({ id: reportId, reason: rejectReason })).unwrap();
      message.success('Note de frais rejetée');
      setRejectModalOpen(false);
      setRejectReason('');
      onUpdate?.();
    } catch (error: any) {
      message.error(error?.message || 'Erreur lors du rejet');
    }
  };

  const handleReimburse = async () => {
    if (!reportId) return;
    Modal.confirm({
      title: 'Marquer comme remboursée ?',
      okText: 'Confirmer',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(reimburseExpenseReport(reportId)).unwrap();
          message.success('Note de frais marquée comme remboursée');
          onUpdate?.();
        } catch (error: any) {
          message.error(error?.message || 'Erreur');
        }
      },
    });
  };

  const getStatusTag = (status: ExpenseReportStatus) => {
    const config = EXPENSE_REPORT_STATUSES[status];
    return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{status}</Tag>;
  };

  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const getReceiptIcon = (url: string) => {
    if (url.toLowerCase().endsWith('.pdf')) {
      return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    }
    return <FileImageOutlined style={{ color: '#1890ff' }} />;
  };

  const lineColumns: ColumnsType<ExpenseReportLine> = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat: string) => <Tag>{getCategoryLabel(cat)}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ fontWeight: 600 }}>
          {amount?.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Justificatif',
      dataIndex: 'receiptUrl',
      key: 'receiptUrl',
      width: 100,
      align: 'center' as const,
      render: (url: string) =>
        url ? (
          <Tooltip title="Voir le justificatif">
            <a href={url} target="_blank" rel="noopener noreferrer">
              {getReceiptIcon(url)}
            </a>
          </Tooltip>
        ) : (
          <span style={{ color: '#bfbfbf' }}>-</span>
        ),
    },
  ];

  const renderActions = () => {
    if (!selectedReport) return null;
    const status = selectedReport.status as ExpenseReportStatus;

    return (
      <Space>
        {status === 'DRAFT' && (
          <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit}>
            Soumettre
          </Button>
        )}
        {status === 'SUBMITTED' && (
          <>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
              Approuver
            </Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModalOpen(true)}>
              Rejeter
            </Button>
          </>
        )}
        {status === 'APPROVED' && (
          <Button type="primary" icon={<DollarOutlined />} onClick={handleReimburse}>
            Marquer remboursée
          </Button>
        )}
      </Space>
    );
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <span>Note de frais</span>
            {selectedReport && getStatusTag(selectedReport.status as ExpenseReportStatus)}
          </Space>
        }
        open={open}
        onClose={onClose}
        width={750}
        extra={renderActions()}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Chargement..."><div /></Spin>
          </div>
        ) : !selectedReport ? (
          <Empty description="Note de frais introuvable" />
        ) : (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="N°">{selectedReport.reportNumber}</Descriptions.Item>
              <Descriptions.Item label="Statut">
                {getStatusTag(selectedReport.status as ExpenseReportStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="Titre" span={2}>{selectedReport.title}</Descriptions.Item>
              {selectedReport.description && (
                <Descriptions.Item label="Description" span={2}>{selectedReport.description}</Descriptions.Item>
              )}
              <Descriptions.Item label="Tournée">{selectedReport.tour?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Date tournée">
                {selectedReport.tour?.tourDate ? dayjs(selectedReport.tour.tourDate).format('DD/MM/YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Soumis par">{selectedReport.submittedBy?.fullName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Total">
                <span style={{ fontWeight: 700, fontSize: 16, color: '#1890ff' }}>
                  {selectedReport.totalAmount?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {selectedReport.currency}
                </span>
              </Descriptions.Item>
              {selectedReport.submittedAt && (
                <Descriptions.Item label="Soumise le">{dayjs(selectedReport.submittedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              )}
              {selectedReport.approvedAt && (
                <Descriptions.Item label="Approuvée le">{dayjs(selectedReport.approvedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              )}
              {selectedReport.approvedBy && (
                <Descriptions.Item label="Approuvée par">{selectedReport.approvedBy.fullName}</Descriptions.Item>
              )}
              {selectedReport.reimbursedAt && (
                <Descriptions.Item label="Remboursée le">{dayjs(selectedReport.reimbursedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              )}
              {selectedReport.rejectionReason && (
                <Descriptions.Item label="Motif de rejet" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{selectedReport.rejectionReason}</span>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Créée le">
                {dayjs(selectedReport.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 12 }}>
              Lignes de dépenses ({selectedReport.lines?.length || 0})
            </h4>
            <Table
              rowKey={(_, index) => String(index)}
              columns={lineColumns}
              dataSource={selectedReport.lines || []}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong style={{ fontSize: 14, color: '#1890ff' }}>
                      {selectedReport.totalAmount?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {selectedReport.currency}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              )}
            />

            {/* Mini carte des lieux de dépenses */}
            {(() => {
              const expenseMarkers: MapMarker[] = (selectedReport.lines || [])
                .filter((line) => line.latitude && line.longitude)
                .map((line, idx) => ({
                  lat: line.latitude!,
                  lng: line.longitude!,
                  label: line.description || line.category,
                  popup: `${getCategoryLabel(line.category)} — ${line.amount?.toLocaleString('fr-MA')}${line.address ? '\n' + line.address : ''}`,
                  color: '#fa8c16',
                  number: idx + 1,
                }));
              if (expenseMarkers.length === 0) return null;
              return (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ marginBottom: 12 }}>📍 Lieux des dépenses</h4>
                  <LocationMap markers={expenseMarkers} height={300} />
                </div>
              );
            })()}
          </>
        )}
      </Drawer>

      <Modal
        title="Rejeter la note de frais"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason('');
        }}
        okText="Rejeter"
        okButtonProps={{ danger: true }}
        cancelText="Annuler"
      >
        <p>Veuillez indiquer le motif du rejet :</p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Motif du rejet..."
        />
      </Modal>
    </>
  );
}
