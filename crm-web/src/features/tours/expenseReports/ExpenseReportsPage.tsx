import { useEffect, useState, useCallback } from 'react';
import { Card, Space, Input, Select, Row, Col, Statistic, Button, Modal, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchExpenseReports,
  setExpenseReportFilters,
} from './expenseReportSlice';
import { EXPENSE_REPORT_STATUSES } from '@/types/expenseReport';
import ExpenseReportsList from './ExpenseReportsList';
import ExpenseReportFormModal from './ExpenseReportFormModal';
import toursApi from '@/api/tours';
import { TourListItem } from '@/types/tour';

const { Search } = Input;

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(EXPENSE_REPORT_STATUSES).map(([value, config]) => ({
    value,
    label: config.label,
  })),
];

export default function ExpenseReportsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters } = useAppSelector((state) => state.expenseReports);
  const [searchText, setSearchText] = useState('');

  // Tour-picker state
  const [tourPickerOpen, setTourPickerOpen] = useState(false);
  const [tours, setTours] = useState<TourListItem[]>([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string | undefined>();

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createTourId, setCreateTourId] = useState<string | undefined>();
  const [createTourName, setCreateTourName] = useState<string | undefined>();

  const loadData = useCallback(() => {
    dispatch(fetchExpenseReports(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    dispatch(setExpenseReportFilters({ search: value, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    dispatch(setExpenseReportFilters({ status: value || undefined, page: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    dispatch(setExpenseReportFilters({ page, size: pageSize }));
  };

  const handleOpenTourPicker = async () => {
    setTourPickerOpen(true);
    setSelectedTourId(undefined);
    setToursLoading(true);
    try {
      const result = await toursApi.getAll({ size: 200 });
      setTours(result.content);
    } catch {
      message.error('Erreur lors du chargement des tournées');
    } finally {
      setToursLoading(false);
    }
  };

  const handleTourPickerConfirm = () => {
    if (!selectedTourId) {
      message.warning('Veuillez sélectionner une tournée');
      return;
    }
    const tour = tours.find((t) => t.id === selectedTourId);
    setCreateTourId(selectedTourId);
    setCreateTourName(tour?.name);
    setTourPickerOpen(false);
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
    setCreateTourId(undefined);
    setCreateTourName(undefined);
  };

  const handleCreateSuccess = () => {
    handleCreateClose();
    message.success('Note de frais créée');
    loadData();
  };

  const stats = {
    total: pagination.totalElements,
    draft: items.filter((i) => i.status === 'DRAFT').length,
    submitted: items.filter((i) => i.status === 'SUBMITTED').length,
    approved: items.filter((i) => i.status === 'APPROVED').length,
  };

  return (
    <div className="page-container">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="Total" value={stats.total} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Brouillons" value={stats.draft} valueStyle={{ color: '#8c8c8c' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="En attente" value={stats.submitted} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Approuvées" value={stats.approved} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Notes de frais"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenTourPicker}
          >
            Nouvelle note de frais
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="Rechercher..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Statut"
            allowClear
            style={{ width: 180 }}
            onChange={handleStatusFilter}
            options={statusOptions}
          />
        </Space>

        <ExpenseReportsList
          items={items}
          loading={loading}
          showTourColumn
          pagination={{
            current: pagination.page || 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            onChange: handlePageChange,
          }}
          onRefresh={loadData}
        />
      </Card>

      {/* Tour picker modal */}
      <Modal
        title="Sélectionner une tournée"
        open={tourPickerOpen}
        onOk={handleTourPickerConfirm}
        onCancel={() => setTourPickerOpen(false)}
        okText="Continuer"
        cancelText="Annuler"
        width={420}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 8, color: '#475569', fontSize: 13 }}>
            Choisissez la tournée à laquelle rattacher cette note de frais :
          </div>
          <Select
            showSearch
            placeholder="Sélectionner une tournée..."
            style={{ width: '100%' }}
            loading={toursLoading}
            value={selectedTourId}
            onChange={(val) => setSelectedTourId(val)}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={tours.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />
        </div>
      </Modal>

      {/* Create expense report modal */}
      <ExpenseReportFormModal
        open={createOpen}
        editingId={null}
        tourId={createTourId}
        tourName={createTourName}
        onClose={handleCreateClose}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
