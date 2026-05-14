import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import {
  Space,
  Typography,
  Tag,
  Tooltip,
  Button,
  Spin,
  Badge,
  message,
  Progress,
  Card,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  CalendarOutlined,
  ReloadOutlined,
  PlusOutlined,
  TrophyOutlined,
  RocketOutlined,
  FunnelPlotOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { opportunitiesApi } from '@/api/opportunities';
import { PipelineSummary, PipelineStageData, OpportunityListItem } from '@/types/opportunity';
import OpportunityFormModal from './OpportunityFormModal';

dayjs.locale('fr');

const { Text } = Typography;

// ─── Formatage ─────────────────────────────────────────────────────────────
const formatCurrency = (amount?: number | null): string => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ─── Forecast category helpers ──────────────────────────────────────────────
const FORECAST_LABELS: Record<string, string> = {
  COMMIT: 'Commit',
  BEST_CASE: 'Best Case',
  PIPELINE: 'Pipeline',
};
const FORECAST_COLORS: Record<string, string> = {
  COMMIT: '#52c41a',
  BEST_CASE: '#1890ff',
  PIPELINE: '#faad14',
};

// ─── OpportunityCard (visual representation, no DnD logic) ─────────────────
const OpportunityCard: React.FC<{
  opportunity: OpportunityListItem;
  onEdit: (op: OpportunityListItem) => void;
  isOverlay?: boolean;
}> = ({ opportunity, onEdit, isOverlay = false }) => {
  const isOverdue =
    opportunity.closeDate &&
    !opportunity.isClosed &&
    dayjs(opportunity.closeDate).isBefore(dayjs(), 'day');

  const fc = opportunity.forecastCategory;
  const borderColor = fc ? FORECAST_COLORS[fc] : '#d9d9d9';

  return (
    <Card
      size="small"
      onClick={() => !isOverlay && onEdit(opportunity)}
      hoverable={!isOverlay}
      style={{
        marginBottom: 8,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: isOverlay
          ? '0 12px 28px rgba(0,0,0,0.18)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        userSelect: 'none',
        cursor: isOverlay ? 'grabbing' : 'pointer',
        rotate: isOverlay ? '2deg' : undefined,
        background: '#fff',
      }}
      styles={{ body: { padding: '10px 12px' } }}
    >
      {/* Name + Amount */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 6,
          marginBottom: 4,
        }}
      >
        <Text
          strong
          style={{ fontSize: 13, lineHeight: 1.4, flex: 1, minWidth: 0 }}
          ellipsis={{ tooltip: opportunity.name }}
        >
          {opportunity.name}
        </Text>
        {opportunity.amount != null && (
          <Text
            strong
            style={{ fontSize: 12, color: '#389e0d', whiteSpace: 'nowrap' }}
          >
            {formatCurrency(opportunity.amount)}
          </Text>
        )}
      </div>

      {/* Account */}
      <Text
        type="secondary"
        style={{ fontSize: 11, display: 'block', marginBottom: 6 }}
        ellipsis
      >
        {opportunity.accountName}
      </Text>

      {/* Probability bar */}
      <Progress
        percent={opportunity.probability || 0}
        size="small"
        showInfo={false}
        strokeColor={
          (opportunity.probability || 0) >= 70
            ? '#52c41a'
            : (opportunity.probability || 0) >= 40
            ? '#faad14'
            : '#ff4d4f'
        }
        style={{ marginBottom: 8 }}
      />

      {/* Footer: close date + forecast + avatar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space size={4} wrap={false}>
          {opportunity.closeDate && (
            <Tooltip
              title={`Clôture : ${dayjs(opportunity.closeDate).format('DD/MM/YYYY')}`}
            >
              <Tag
                color={isOverdue ? 'error' : 'default'}
                style={{ fontSize: 10, padding: '0 4px', margin: 0 }}
              >
                <CalendarOutlined style={{ marginRight: 2 }} />
                {dayjs(opportunity.closeDate).format('DD/MM')}
              </Tag>
            </Tooltip>
          )}
          {fc && (
            <Tag
              style={{
                fontSize: 10,
                padding: '0 4px',
                margin: 0,
                background: FORECAST_COLORS[fc] + '20',
                color: FORECAST_COLORS[fc],
                border: `1px solid ${FORECAST_COLORS[fc]}40`,
              }}
            >
              {FORECAST_LABELS[fc]}
            </Tag>
          )}
        </Space>
        {opportunity.assignedToName && (
          <Tooltip title={opportunity.assignedToName}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#1677ff',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {opportunity.assignedToName.charAt(0).toUpperCase()}
            </div>
          </Tooltip>
        )}
      </div>
    </Card>
  );
};

// ─── DraggableCard ───────────────────────────────────────────────────────────
const DraggableCard: React.FC<{
  opportunity: OpportunityListItem;
  stageId: string;
  onEdit: (op: OpportunityListItem) => void;
}> = ({ opportunity, stageId, onEdit }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opportunity.id,
    data: { opportunity, stageId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.25 : 1 }}
      {...listeners}
      {...attributes}
    >
      <OpportunityCard opportunity={opportunity} onEdit={onEdit} />
    </div>
  );
};

// ─── DroppableColumn ─────────────────────────────────────────────────────────
const DroppableColumn: React.FC<{
  stageData: PipelineStageData;
  isOver: boolean;
  onEdit: (op: OpportunityListItem) => void;
}> = ({ stageData, isOver, onEdit }) => {
  const { setNodeRef } = useDroppable({ id: stageData.id });

  return (
    <div
      style={{
        width: 272,
        minWidth: 272,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRadius: 10,
        background: isOver ? '#e6f4ff' : '#f7f8fa',
        border: `2px ${isOver ? 'dashed #1677ff' : 'solid transparent'}`,
        transition: 'background 0.15s, border-color 0.15s',
        maxHeight: 'calc(100vh - 270px)',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid #ebebeb',
          borderRadius: '10px 10px 0 0',
          background: isOver ? '#d6eaff' : '#eef0f4',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Tag
            color={stageData.color || 'blue'}
            style={{ fontWeight: 600, fontSize: 12 }}
          >
            {stageData.name}
          </Tag>
          <Badge
            count={stageData.count}
            showZero
            style={{ backgroundColor: '#8c8c8c' }}
          />
        </div>
        <Text style={{ fontSize: 12, color: '#389e0d', fontWeight: 600 }}>
          {formatCurrency(stageData.totalAmount)}{' '}
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
            MAD
          </Text>
        </Text>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          minHeight: 80,
        }}
      >
        {stageData.opportunities.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 8px',
              color: '#bfbfbf',
              fontSize: 12,
            }}
          >
            Aucune opportunité
          </div>
        ) : (
          stageData.opportunities.map((opp) => (
            <DraggableCard
              key={opp.id}
              opportunity={opp}
              stageId={stageData.id}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main: OpportunitiesKanbanPage ───────────────────────────────────────────
const OpportunitiesKanbanPage: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOpportunity, setActiveOpportunity] =
    useState<OpportunityListItem | null>(null);
  const [overStageId, setOverStageId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<OpportunityListItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    })
  );

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const data = await opportunitiesApi.getPipeline();
      setPipeline(data);
    } catch {
      message.error('Erreur lors du chargement du pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveOpportunity(
      (event.active.data.current as { opportunity: OpportunityListItem })
        ?.opportunity ?? null
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverStageId((event.over?.id as string) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);
    setOverStageId(null);

    if (!over || !pipeline) return;

    const opportunityId = active.id as string;
    const targetStageId = over.id as string;
    const sourceStageId = (
      active.data.current as { stageId: string }
    )?.stageId;

    // Not moved
    if (!sourceStageId || sourceStageId === targetStageId) return;

    // Optimistic update — move card between columns
    const sourceStage = pipeline.stages.find((s) => s.id === sourceStageId);
    const movedOpp = sourceStage?.opportunities.find(
      (o) => o.id === opportunityId
    );
    if (!movedOpp) return;

    setPipeline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stages: prev.stages.map((stage) => {
          if (stage.id === sourceStageId) {
            const remaining = stage.opportunities.filter(
              (o) => o.id !== opportunityId
            );
            return {
              ...stage,
              opportunities: remaining,
              count: remaining.length,
              totalAmount: remaining.reduce((s, o) => s + (o.amount || 0), 0),
            };
          }
          if (stage.id === targetStageId) {
            const updated = [
              ...stage.opportunities,
              { ...movedOpp, stageId: targetStageId, stageName: stage.name, stageColor: stage.color },
            ];
            return {
              ...stage,
              opportunities: updated,
              count: updated.length,
              totalAmount: updated.reduce((s, o) => s + (o.amount || 0), 0),
            };
          }
          return stage;
        }),
      };
    });

    // API call
    try {
      await opportunitiesApi.moveToStage(opportunityId, targetStageId);
      message.success('Opportunité déplacée');
    } catch {
      // Revert on error
      message.error('Erreur lors du déplacement, rechargement...');
      loadPipeline();
    }
  };

  // ── Modal handlers ───────────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingOpportunity(null);
    setModalVisible(true);
  };

  const handleEdit = (op: OpportunityListItem) => {
    setEditingOpportunity(op);
    setModalVisible(true);
  };

  const handleModalClose = (success?: boolean) => {
    setModalVisible(false);
    setEditingOpportunity(null);
    if (success) loadPipeline();
  };

  // ── Forecast summary bar ─────────────────────────────────────────────────
  const ForecastBar = () => {
    if (!pipeline) return null;
    return (
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col>
          <Card
            size="small"
            style={{ background: '#f6ffed', border: '1px solid #b7eb8f', minWidth: 140 }}
            styles={{ body: { padding: '8px 14px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <TrophyOutlined style={{ color: '#52c41a' }} />
              <Text style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>Commit</Text>
            </div>
            <Text strong style={{ fontSize: 15 }}>
              {formatCurrency(pipeline.commitAmount)}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>MAD</Text>
          </Card>
        </Col>
        <Col>
          <Card
            size="small"
            style={{ background: '#e6f4ff', border: '1px solid #91caff', minWidth: 140 }}
            styles={{ body: { padding: '8px 14px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <RocketOutlined style={{ color: '#1677ff' }} />
              <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>Best Case</Text>
            </div>
            <Text strong style={{ fontSize: 15 }}>
              {formatCurrency(pipeline.bestCaseAmount)}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>MAD</Text>
          </Card>
        </Col>
        <Col>
          <Card
            size="small"
            style={{ background: '#fffbe6', border: '1px solid #ffe58f', minWidth: 140 }}
            styles={{ body: { padding: '8px 14px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <FunnelPlotOutlined style={{ color: '#faad14' }} />
              <Text style={{ fontSize: 12, color: '#d48806', fontWeight: 600 }}>Pipeline</Text>
            </div>
            <Text strong style={{ fontSize: 15 }}>
              {formatCurrency(pipeline.pipelineAmount)}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>MAD</Text>
          </Card>
        </Col>
        <Col>
          <Card
            size="small"
            style={{ background: '#f9f0ff', border: '1px solid #d3adf7', minWidth: 140 }}
            styles={{ body: { padding: '8px 14px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <DollarOutlined style={{ color: '#722ed1' }} />
              <Text style={{ fontSize: 12, color: '#722ed1', fontWeight: 600 }}>Total pondéré</Text>
            </div>
            <Text strong style={{ fontSize: 15 }}>
              {formatCurrency(pipeline.totalWeighted)}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>MAD</Text>
          </Card>
        </Col>
        <Col flex="auto" />
        <Col style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadPipeline}
            loading={loading}
          >
            Actualiser
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Nouvelle opportunité
          </Button>
        </Col>
      </Row>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading && !pipeline) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" tip="Chargement du pipeline..." />
      </div>
    );
  }

  if (!pipeline || pipeline.stages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Empty description="Aucune opportunité ouverte dans le pipeline" />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          style={{ marginTop: 16 }}
        >
          Créer une opportunité
        </Button>
        <OpportunityFormModal
          visible={modalVisible}
          opportunity={editingOpportunity}
          onClose={handleModalClose}
        />
      </div>
    );
  }

  return (
    <div>
      {/* ── Forecast summary ── */}
      <ForecastBar />

      {/* ── Kanban board ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 12,
            alignItems: 'flex-start',
          }}
        >
          {pipeline.stages.map((stage) => (
            <DroppableColumn
              key={stage.id}
              stageData={stage}
              isOver={overStageId === stage.id}
              onEdit={handleEdit}
            />
          ))}
        </div>

        {/* Drag overlay — follows the cursor */}
        <DragOverlay dropAnimation={null}>
          {activeOpportunity && (
            <div style={{ width: 248 }}>
              <OpportunityCard
                opportunity={activeOpportunity}
                onEdit={() => {}}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Modal ── */}
      <OpportunityFormModal
        visible={modalVisible}
        opportunity={editingOpportunity}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default OpportunitiesKanbanPage;
