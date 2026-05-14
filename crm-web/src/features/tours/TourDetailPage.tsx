import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, List, Progress, message, Spin, Empty, Statistic } from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTourById, startTour, completeTour, reorderTourVisits } from './toursSlice';
import { fetchExpenseReportsByTour } from './expenseReports/expenseReportSlice';
import { TOUR_STATUSES, TOUR_VEHICLE_TYPES } from '@/types/tour';
import { VISIT_STATUSES, VISIT_TYPES } from '@/types/visit';
import SortableVisitList from './SortableVisitList';
import { ExpenseReportsList, ExpenseReportFormModal } from './expenseReports';
import { LocationMap } from '@/components/maps';
import type { MapMarker } from '@/components/maps';

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTour, loading } = useAppSelector((state) => state.tours);
  const { tourItems: expenseReports, loading: expLoading } = useAppSelector((state) => state.expenseReports);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTourById(id));
      dispatch(fetchExpenseReportsByTour(id));
    }
  }, [id, dispatch]);

  const loadExpenseReports = useCallback(() => {
    if (id) {
      dispatch(fetchExpenseReportsByTour(id));
    }
  }, [id, dispatch]);

  const handleStart = async () => {
    if (id) {
      await dispatch(startTour(id));
      message.success('Tournée démarrée');
    }
  };

  const handleComplete = async () => {
    if (id) {
      await dispatch(completeTour(id));
      message.success('Tournée terminée');
    }
  };

  const handleReorderVisits = async (visitIds: string[]) => {
    if (id) {
      try {
        await dispatch(reorderTourVisits({ tourId: id, visitIds })).unwrap();
        message.success('Ordre des visites mis à jour');
      } catch {
        message.error('Erreur lors du réordonnement');
        // Reload to reset order
        dispatch(fetchTourById(id));
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" tip="Chargement..."><div /></Spin></div>;
  }

  if (!selectedTour) {
    return <Empty description="Tournée introuvable" />;
  }

  const percent = selectedTour.totalVisits > 0
    ? Math.round((selectedTour.completedVisits / selectedTour.totalVisits) * 100)
    : 0;

  const statusConfig = TOUR_STATUSES.find((s) => s.value === selectedTour.status);

  return (
    <div className="page-container">
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tours')}>Retour</Button>
        {(selectedTour.status === 'draft' || selectedTour.status === 'planned') && (
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStart}>Démarrer</Button>
        )}
        {selectedTour.status === 'in_progress' && (
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Terminer</Button>
        )}
      </Space>

      <Card title={selectedTour.name} extra={<Tag color={statusConfig?.color}>{statusConfig?.label}</Tag>}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Date">{dayjs(selectedTour.tourDate).format('DD/MM/YYYY')}</Descriptions.Item>
          <Descriptions.Item label="Région">{selectedTour.region || '-'}</Descriptions.Item>
          <Descriptions.Item label="Assigné à">{selectedTour.assignedTo?.fullName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Progression">
            <Space>
              <Progress percent={percent} size="small" style={{ width: 120 }} />
              {selectedTour.completedVisits}/{selectedTour.totalVisits} visites
            </Space>
          </Descriptions.Item>
          {selectedTour.startAddress && <Descriptions.Item label="Départ">{selectedTour.startAddress}</Descriptions.Item>}
          {selectedTour.endAddress && <Descriptions.Item label="Arrivée">{selectedTour.endAddress}</Descriptions.Item>}
          {selectedTour.description && <Descriptions.Item label="Description" span={2}>{selectedTour.description}</Descriptions.Item>}
          {selectedTour.notes && <Descriptions.Item label="Notes" span={2}>{selectedTour.notes}</Descriptions.Item>}
        </Descriptions>
      </Card>

      {/* Objectifs & Résultats */}
      {(selectedTour.objective || selectedTour.tourResult) && (
        <Card title="Objectifs & Résultats" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered size="small">
            {selectedTour.objective && (
              <Descriptions.Item label="Objectif de la tournée" span={2}>{selectedTour.objective}</Descriptions.Item>
            )}
            {selectedTour.tourResult && (
              <Descriptions.Item label="Résultat de la tournée" span={2}>{selectedTour.tourResult}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Commercial */}
      {(selectedTour.estimatedRevenue != null || selectedTour.actualRevenue != null) && (
        <Card title="Commercial" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered size="small">
            {selectedTour.estimatedRevenue != null && (
              <Descriptions.Item label="CA estimé">{selectedTour.estimatedRevenue.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Descriptions.Item>
            )}
            {selectedTour.actualRevenue != null && (
              <Descriptions.Item label="CA réalisé">{selectedTour.actualRevenue.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Logistique & Dépenses */}
      {(selectedTour.vehicleType || selectedTour.fuelCost != null || selectedTour.totalExpenses != null || selectedTour.startTime || selectedTour.endTime) && (
        <Card title="Logistique & Dépenses" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered size="small">
            {selectedTour.vehicleType && (
              <Descriptions.Item label="Type de véhicule">
                {TOUR_VEHICLE_TYPES.find((v) => v.value === selectedTour.vehicleType)?.label || selectedTour.vehicleType}
              </Descriptions.Item>
            )}
            {selectedTour.fuelCost != null && (
              <Descriptions.Item label="Coût carburant">{selectedTour.fuelCost.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Descriptions.Item>
            )}
            {selectedTour.totalExpenses != null && (
              <Descriptions.Item label="Total dépenses">{selectedTour.totalExpenses.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Descriptions.Item>
            )}
            {selectedTour.startTime && (
              <Descriptions.Item label="Heure de départ">{dayjs(selectedTour.startTime).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            )}
            {selectedTour.endTime && (
              <Descriptions.Item label="Heure d'arrivée">{dayjs(selectedTour.endTime).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Suivi */}
      {selectedTour.followUpNotes && (
        <Card title="Suivi" style={{ marginTop: 16 }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Notes de suivi">{selectedTour.followUpNotes}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Carte de la tournée */}
      {(() => {
        const mapMarkers: MapMarker[] = [];

        // Marqueur départ (vert)
        if (selectedTour.startLatitude && selectedTour.startLongitude) {
          mapMarkers.push({
            lat: selectedTour.startLatitude,
            lng: selectedTour.startLongitude,
            label: 'Départ',
            popup: selectedTour.startAddress || 'Point de départ',
            color: '#52c41a',
          });
        }

        // Marqueurs visites (bleus numérotés)
        if (selectedTour.visits) {
          selectedTour.visits.forEach((visit, idx) => {
            if (visit.latitude && visit.longitude) {
              mapMarkers.push({
                lat: visit.latitude,
                lng: visit.longitude,
                label: visit.subject || `Visite ${idx + 1}`,
                popup: `${visit.subject || 'Visite'}${visit.city ? ' — ' + visit.city : ''}${visit.contactName ? ' (' + visit.contactName + ')' : ''}`,
                color: '#1890ff',
                number: idx + 1,
              });
            }
          });
        }

        // Marqueur arrivée (rouge)
        if (selectedTour.endLatitude && selectedTour.endLongitude) {
          mapMarkers.push({
            lat: selectedTour.endLatitude,
            lng: selectedTour.endLongitude,
            label: 'Arrivée',
            popup: selectedTour.endAddress || "Point d'arrivée",
            color: '#f5222d',
          });
        }

        if (mapMarkers.length === 0) return null;

        return (
          <Card title={<span><EnvironmentOutlined /> Carte de la tournée</span>} style={{ marginTop: 16 }}>
            <LocationMap markers={mapMarkers} polyline height={450} />
          </Card>
        );
      })()}

      {(() => {
        const canReorder = selectedTour.status === 'draft' || selectedTour.status === 'planned';
        return (
          <Card title="Visites de la tournée" style={{ marginTop: 16 }} extra={
            canReorder && <Tag color="blue">Glissez pour réordonner</Tag>
          }>
            {selectedTour.visits && selectedTour.visits.length > 0 ? (
              canReorder ? (
                <SortableVisitList visits={selectedTour.visits} onReorder={handleReorderVisits} />
              ) : (
                <List
                  dataSource={selectedTour.visits}
                  renderItem={(visit, index) => {
                    const typeConfig = VISIT_TYPES.find((t) => t.value === visit.visitType);
                    const visitStatusConfig = VISIT_STATUSES.find((s) => s.value === visit.status);
                    return (
                      <List.Item
                        extra={<Tag color={visitStatusConfig?.color}>{visitStatusConfig?.label || visit.status}</Tag>}
                      >
                        <List.Item.Meta
                          avatar={<div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#1890ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{index + 1}</div>}
                          title={visit.subject}
                          description={
                            <Space size="small" wrap>
                              <Tag color={typeConfig?.color}>{typeConfig?.label || visit.visitType}</Tag>
                              {visit.city && <span><EnvironmentOutlined /> {visit.city}</span>}
                              {visit.contactName && <span>{visit.contactName}</span>}
                              {visit.accountName && <span>({visit.accountName})</span>}
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )
            ) : (
              <Empty description="Aucune visite dans cette tournée" />
            )}
          </Card>
        );
      })()}

      {/* Notes de Frais */}
      <Card
        title={
          <Space>
            <WalletOutlined />
            <span>Notes de frais</span>
            {expenseReports.length > 0 && <Tag color="blue">{expenseReports.length}</Tag>}
          </Space>
        }
        style={{ marginTop: 16 }}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setExpenseModalOpen(true)}
            size="small"
          >
            Nouvelle note de frais
          </Button>
        }
      >
        {selectedTour.expenseReportCount != null && selectedTour.expenseReportCount > 0 && selectedTour.totalExpenseReportsAmount != null && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 24 }}>
            <Statistic
              title="Total notes de frais"
              value={selectedTour.totalExpenseReportsAmount}
              precision={2}
              suffix=""
              valueStyle={{ fontSize: 18, color: '#1890ff' }}
            />
            <Statistic
              title="Nombre de notes"
              value={selectedTour.expenseReportCount}
              valueStyle={{ fontSize: 18 }}
            />
          </div>
        )}
        <ExpenseReportsList
          items={expenseReports}
          loading={expLoading}
          tourId={id}
          tourName={selectedTour.name}
          onRefresh={loadExpenseReports}
        />
      </Card>

      <ExpenseReportFormModal
        open={expenseModalOpen}
        editingId={null}
        tourId={id!}
        tourName={selectedTour.name}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => {
          setExpenseModalOpen(false);
          message.success('Note de frais créée');
          loadExpenseReports();
          dispatch(fetchTourById(id!));
        }}
      />
    </div>
  );
}
