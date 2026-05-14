import { useState } from 'react';
import { Table, Tag, Button, Dropdown, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch } from '@/store';
import {
  deleteExpenseReport,
  submitExpenseReport,
} from './expenseReportSlice';
import {
  ExpenseReportListItem,
  EXPENSE_REPORT_STATUSES,
  ExpenseReportStatus,
} from '@/types/expenseReport';
import ExpenseReportDetail from './ExpenseReportDetail';
import ExpenseReportFormModal from './ExpenseReportFormModal';

interface Props {
  items: ExpenseReportListItem[];
  loading?: boolean;
  tourId?: string;
  tourName?: string;
  showTourColumn?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRefresh?: () => void;
}

export default function ExpenseReportsList({
  items,
  loading,
  tourId,
  tourName,
  showTourColumn = false,
  pagination,
  onRefresh,
}: Props) {
  const dispatch = useAppDispatch();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleView = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer cette note de frais ?',
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteExpenseReport(id)).unwrap();
          message.success('Note de frais supprimée');
          onRefresh?.();
        } catch (error: any) {
          message.error(error?.message || 'Erreur lors de la suppression');
        }
      },
    });
  };

  const handleSubmit = (id: string) => {
    Modal.confirm({
      title: 'Soumettre cette note de frais ?',
      content: 'Elle ne pourra plus être modifiée après soumission.',
      okText: 'Soumettre',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(submitExpenseReport(id)).unwrap();
          message.success('Note de frais soumise');
          onRefresh?.();
        } catch (error: any) {
          message.error(error?.message || 'Erreur');
        }
      },
    });
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setDetailId(null);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditId(null);
  };

  const handleEditSuccess = () => {
    handleEditClose();
    message.success(editId ? 'Note de frais mise à jour' : 'Note de frais créée');
    onRefresh?.();
  };

  const columns: ColumnsType<ExpenseReportListItem> = [
    {
      title: 'N°',
      dataIndex: 'reportNumber',
      key: 'reportNumber',
      width: 120,
      render: (num: string) => <span style={{ fontFamily: 'monospace' }}>{num}</span>,
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    ...(showTourColumn
      ? [
          {
            title: 'Tournée',
            dataIndex: 'tourName',
            key: 'tourName',
            width: 180,
            ellipsis: true,
            render: (name: string) => name || '-',
          } as const,
        ]
      : []),
    {
      title: 'Soumis par',
      dataIndex: 'submittedByName',
      key: 'submittedByName',
      width: 150,
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: 'Montant',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      align: 'right' as const,
      render: (amount: number, record: ExpenseReportListItem) => (
        <span style={{ fontWeight: 600 }}>
          {amount?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {record.currency}
        </span>
      ),
      sorter: true,
    },
    {
      title: 'Lignes',
      dataIndex: 'lineCount',
      key: 'lineCount',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ExpenseReportStatus) => {
        const config = EXPENSE_REPORT_STATUSES[status];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ExpenseReportListItem) => {
        const isDraft = record.status === 'DRAFT';
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  icon: <EyeOutlined />,
                  label: 'Détail',
                  onClick: () => handleView(record.id),
                },
                ...(isDraft
                  ? [
                      {
                        key: 'edit',
                        icon: <EditOutlined />,
                        label: 'Modifier',
                        onClick: () => handleEdit(record.id),
                      },
                      {
                        key: 'submit',
                        icon: <SendOutlined />,
                        label: 'Soumettre',
                        onClick: () => handleSubmit(record.id),
                      },
                      { type: 'divider' as const },
                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: 'Supprimer',
                        danger: true,
                        onClick: () => handleDelete(record.id),
                      },
                    ]
                  : []),
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        scroll={{ x: 900 }}
        size="small"
        pagination={
          pagination
            ? {
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}`,
                onChange: pagination.onChange,
              }
            : { pageSize: 10, showSizeChanger: false, showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}` }
        }
      />

      <ExpenseReportDetail
        open={detailOpen}
        reportId={detailId}
        onClose={handleDetailClose}
        onUpdate={() => {
          onRefresh?.();
        }}
      />

      <ExpenseReportFormModal
        open={editModalOpen}
        editingId={editId}
        tourId={tourId}
        tourName={tourName}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
