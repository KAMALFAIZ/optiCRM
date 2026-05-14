import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Tag, Space } from 'antd';
import { HolderOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { VISIT_TYPES, VISIT_STATUSES } from '@/types/visit';

interface TourVisitItem {
  visitId: string;
  visitOrder: number;
  subject: string;
  visitType: string;
  status: string;
  address?: string;
  city?: string;
  contactName?: string;
  accountName?: string;
  visitDate?: string;
}

interface SortableVisitListProps {
  visits: TourVisitItem[];
  onReorder: (visitIds: string[]) => void;
}

function SortableVisitItem({ visit, index }: { visit: TourVisitItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: visit.visitId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: '12px 16px',
    marginBottom: 8,
    backgroundColor: isDragging ? '#e6f7ff' : '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'grab',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
  };

  const typeConfig = VISIT_TYPES.find((t) => t.value === visit.visitType);
  const statusConfig = VISIT_STATUSES.find((s) => s.value === visit.status);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HolderOutlined style={{ color: '#bfbfbf', fontSize: 16, cursor: 'grab' }} />
      <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#1890ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{visit.subject}</div>
        <Space size="small" wrap>
          <Tag color={typeConfig?.color}>{typeConfig?.label || visit.visitType}</Tag>
          {visit.city && <span style={{ fontSize: 12, color: '#8c8c8c' }}><EnvironmentOutlined /> {visit.city}</span>}
          {visit.contactName && <span style={{ fontSize: 12, color: '#8c8c8c' }}>{visit.contactName}</span>}
          {visit.accountName && <span style={{ fontSize: 12, color: '#8c8c8c' }}>({visit.accountName})</span>}
        </Space>
      </div>
      <Tag color={statusConfig?.color}>{statusConfig?.label || visit.status}</Tag>
    </div>
  );
}

export default function SortableVisitList({ visits, onReorder }: SortableVisitListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = visits.findIndex((v) => v.visitId === active.id);
      const newIndex = visits.findIndex((v) => v.visitId === over.id);
      const reordered = arrayMove(visits, oldIndex, newIndex);
      onReorder(reordered.map((v) => v.visitId));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={handleDragEnd}>
      <SortableContext items={visits.map((v) => v.visitId)} strategy={verticalListSortingStrategy}>
        {visits.map((visit, index) => (
          <SortableVisitItem key={visit.visitId} visit={visit} index={index} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
