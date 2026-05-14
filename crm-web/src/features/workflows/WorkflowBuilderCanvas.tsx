/**
 * WorkflowBuilderCanvas — éditeur visuel de workflow basé sur React Flow.
 *
 * Fonctionnalités :
 *  - Chaque WorkflowStep = nœud déplaçable color-codé par type
 *  - Chaque WorkflowTransition = arête animée reliant deux nœuds
 *  - Cliquer sur un nœud ouvre un panneau de configuration (droite)
 *  - Connecter deux nœuds crée une transition
 *  - Supprimer une arête (touche Delete) retire la transition
 *  - Les positions sont sauvegardées dans positionX/positionY du step
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type EdgeChange,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Button, Input, Select, Space, Typography, Tag, Tooltip,
  Card, Divider,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  MailOutlined, CheckSquareOutlined, CalendarOutlined,
  EditFilled, BellOutlined, ClockCircleOutlined,
  ForkOutlined, AuditOutlined, RobotOutlined, ApiOutlined,
} from '@ant-design/icons';
import { WorkflowStep, WorkflowTransition, STEP_TYPES } from '@/types/workflow';

const { Text } = Typography;

// ── Icône par type de step ────────────────────────────────────────────────────

const STEP_ICONS: Record<string, React.ReactNode> = {
  SEND_EMAIL:          <MailOutlined />,
  CREATE_TASK:         <CheckSquareOutlined />,
  CREATE_ACTIVITY:     <CalendarOutlined />,
  UPDATE_ENTITY:       <EditFilled />,
  SEND_NOTIFICATION:   <BellOutlined />,
  DELAY:               <ClockCircleOutlined />,
  CONDITION:           <ForkOutlined />,
  APPROVAL:            <AuditOutlined />,
  AI_ACTION:           <RobotOutlined />,
  WEBHOOK:             <ApiOutlined />,
};

// ── Custom Step Node ──────────────────────────────────────────────────────────

interface StepNodeData {
  label: string;
  stepType: string;
  stepTypLabel: string;
  color: string;
  isEntryPoint: boolean;
  isSelected: boolean;
  nodeIndex: number;
  onSelect: () => void;
  onDelete: () => void;
}

function StepNode({ data }: { data: StepNodeData }) {
  const {
    label, stepType, stepTypLabel, color, isEntryPoint,
    isSelected, onDelete, onSelect,
  } = data;

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#fff',
        border: `2px solid ${isSelected ? '#1890ff' : color}`,
        borderRadius: 10,
        minWidth: 190,
        maxWidth: 220,
        boxShadow: isSelected
          ? `0 0 0 3px rgba(24,144,255,0.25), 0 4px 16px rgba(0,0,0,0.12)`
          : '0 2px 10px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }}
      />

      {/* ── Header ── */}
      <div
        style={{
          background: color,
          borderRadius: '8px 8px 0 0',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <Space size={4}>
          <span style={{ color: '#fff', fontSize: 13 }}>
            {STEP_ICONS[stepType] || <ApiOutlined />}
          </span>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
            {stepTypLabel}
          </span>
        </Space>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: 'rgba(0,0,0,0.20)',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            padding: '0 5px',
            lineHeight: '18px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '8px 12px', minHeight: 42 }}>
        <div style={{
          fontWeight: 600,
          fontSize: 13,
          color: '#262626',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label || <span style={{ color: '#bfbfbf', fontWeight: 400 }}>Sans nom</span>}
        </div>
        {isEntryPoint && (
          <span style={{ fontSize: 10, color: '#52c41a', fontWeight: 600 }}>
            ● Point d'entrée
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color, width: 10, height: 10, border: '2px solid #fff' }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { stepNode: StepNode as any };

// ── Conversion helpers ────────────────────────────────────────────────────────

function buildNodes(
  steps: WorkflowStep[],
  selectedIndex: number | null,
  onSelect: (i: number) => void,
  onDelete: (i: number) => void,
  prevNodes: Node[],
): Node[] {
  return steps.map((step, i) => {
    const st = STEP_TYPES.find(s => s.value === step.stepType);
    // Preserve position from previous RF state if node existed
    const prev = prevNodes.find(n => n.id === String(i));
    const position = prev
      ? prev.position
      : { x: step.positionX ?? (200 + (i % 3) * 260), y: step.positionY ?? (80 + Math.floor(i / 3) * 160) };

    return {
      id: String(i),
      type: 'stepNode',
      position,
      data: {
        label: step.name,
        stepType: step.stepType,
        stepTypLabel: st?.label ?? step.stepType,
        color: st?.color ?? '#8c8c8c',
        isEntryPoint: !!step.isEntryPoint,
        isSelected: selectedIndex === i,
        nodeIndex: i,
        onSelect: () => onSelect(i),
        onDelete: () => onDelete(i),
      } satisfies StepNodeData,
    };
  });
}

function buildEdges(transitions: WorkflowTransition[]): Edge[] {
  return transitions
    .filter(t => t.fromStepIndex !== undefined && t.toStepIndex !== undefined)
    .map((t, i) => ({
      id: `e${i}-${t.fromStepIndex}-${t.toStepIndex}`,
      source: String(t.fromStepIndex),
      target: String(t.toStepIndex),
      label: t.label || '',
      labelStyle: { fontSize: 11, fill: '#595959' },
      labelBgStyle: { fill: '#f5f5f5', fillOpacity: 0.9 },
      labelBgPadding: [4, 6] as [number, number],
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8c8c8c', width: 20, height: 20 },
      style: { stroke: '#adb5bd', strokeWidth: 2 },
    }));
}

// ── Main component ────────────────────────────────────────────────────────────

export interface WorkflowBuilderCanvasHandle {
  getSteps: () => WorkflowStep[];
  getTransitions: () => WorkflowTransition[];
}

interface Props {
  initialSteps: WorkflowStep[];
  initialTransitions: WorkflowTransition[];
  onChange: (steps: WorkflowStep[], transitions: WorkflowTransition[]) => void;
}

export default function WorkflowBuilderCanvas({
  initialSteps,
  initialTransitions,
  onChange,
}: Props) {
  // ── Internal state ──────────────────────────────────────────────────────────
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>(initialTransitions);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Track if we're currently dragging (to avoid syncing positions mid-drag)
  const isDragging = useRef(false);

  // ── Sync steps → RF nodes ───────────────────────────────────────────────────
  useEffect(() => {
    setNodes(prev => buildNodes(steps, selectedIndex, handleSelect, handleDelete, prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, selectedIndex]);

  // ── Sync transitions → RF edges ─────────────────────────────────────────────
  useEffect(() => {
    setEdges(buildEdges(transitions));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitions]);

  // ── Notify parent ───────────────────────────────────────────────────────────
  useEffect(() => {
    onChange(steps, transitions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, transitions]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
  }, []);

  const handleDelete = useCallback((index: number) => {
    setSteps(prev => {
      const newSteps = prev.filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepOrder: i, isEntryPoint: i === 0 }));
      return newSteps;
    });
    setTransitions(prev =>
      prev
        .filter(t => t.fromStepIndex !== index && t.toStepIndex !== index)
        .map(t => ({
          ...t,
          fromStepIndex: t.fromStepIndex! > index ? t.fromStepIndex! - 1 : t.fromStepIndex,
          toStepIndex:   t.toStepIndex!   > index ? t.toStepIndex!   - 1 : t.toStepIndex,
        }))
    );
    setSelectedIndex(prev => {
      if (prev === index) return null;
      if (prev !== null && prev > index) return prev - 1;
      return prev;
    });
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    const from = parseInt(connection.source!);
    const to   = parseInt(connection.target!);
    if (isNaN(from) || isNaN(to) || from === to) return;

    setTransitions(prev => {
      const exists = prev.some(t => t.fromStepIndex === from && t.toStepIndex === to);
      if (exists) return prev;
      return [...prev, { fromStepIndex: from, toStepIndex: to, label: 'Suivant' }];
    });

    setEdges(prev => addEdge({
      ...connection,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8c8c8c', width: 20, height: 20 },
      style: { stroke: '#adb5bd', strokeWidth: 2 },
    }, prev));
  }, [setEdges]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    const removals = changes.filter(
      (c): c is { type: 'remove'; id: string } => c.type === 'remove',
    );

    if (removals.length > 0) {
      // Read prevEdges BEFORE applying changes, then apply them manually.
      // This lets us identify which edges were removed (their source/target)
      // before React Flow's applyEdgeChanges removes them.
      setEdges(prevEdges => {
        const deletedIds = new Set(removals.map(r => r.id));
        const deletedEdges = prevEdges.filter(e => deletedIds.has(e.id));

        if (deletedEdges.length > 0) {
          const deletedPairs = deletedEdges.map(e => ({
            from: parseInt(e.source),
            to:   parseInt(e.target),
          }));
          setTransitions(prev =>
            prev.filter(t =>
              !deletedPairs.some(
                d => d.from === t.fromStepIndex && d.to === t.toStepIndex,
              ),
            ),
          );
        }

        // Manually apply all changes to the edges array
        return applyEdgeChanges(changes, prevEdges);
      });
      return;
    }

    // No deletions — let RF handle normally (selections, etc.)
    onEdgesChange(changes);
  }, [onEdgesChange, setEdges]);

  // Commit node positions to steps after drag ends
  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    isDragging.current = false;
    const idx = parseInt(node.id);
    if (isNaN(idx)) return;
    setSteps(prev => prev.map((s, i) =>
      i === idx
        ? { ...s, positionX: Math.round(node.position.x), positionY: Math.round(node.position.y) }
        : s
    ));
  }, []);

  const handleNodeDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  // ── Add step ────────────────────────────────────────────────────────────────

  const addStep = useCallback(() => {
    setSteps(prev => {
      const col = prev.length % 3;
      const row = Math.floor(prev.length / 3);
      return [
        ...prev,
        {
          name: `Étape ${prev.length + 1}`,
          stepType: 'SEND_NOTIFICATION',
          actionConfig: '{}',
          stepOrder: prev.length,
          positionX: 60 + col * 260,
          positionY: 60 + row * 160,
          isEntryPoint: prev.length === 0,
        },
      ];
    });
  }, []);

  // ── Step config panel ───────────────────────────────────────────────────────

  const updateStep = useCallback((field: keyof WorkflowStep, value: unknown) => {
    setSteps(prev => {
      if (selectedIndex === null) return prev;
      return prev.map((s, i) => i === selectedIndex ? { ...s, [field]: value } : s);
    });
  }, [selectedIndex]);

  const selectedStep = selectedIndex !== null ? steps[selectedIndex] : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', gap: 12, height: 460 }}>

      {/* ── React Flow canvas ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          border: '1px solid #e8e8e8',
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          background: '#fafafa',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.35, maxZoom: 1.2 }}
          deleteKeyCode="Delete"
          minZoom={0.3}
          maxZoom={1.6}
        >
          <Background color="#e0e0e0" gap={18} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const idx = parseInt(n.id);
              const s = steps[idx];
              return STEP_TYPES.find(st => st.value === s?.stepType)?.color ?? '#8c8c8c';
            }}
            style={{ borderRadius: 8 }}
          />
        </ReactFlow>

        {/* Toolbar overlay */}
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={addStep}
            style={{ borderRadius: 6 }}
          >
            Ajouter une étape
          </Button>
        </div>

        {/* Empty state */}
        {steps.length === 0 && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔗</div>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Cliquez sur <strong>+ Ajouter une étape</strong> pour commencer
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              Reliez les étapes en glissant depuis les connecteurs
            </Text>
          </div>
        )}

        {/* Hint for connections */}
        {steps.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 20,
            padding: '3px 12px', fontSize: 11, pointerEvents: 'none', zIndex: 10,
          }}>
            Glissez depuis ● vers ● pour créer une liaison · Suppr pour effacer
          </div>
        )}
      </div>

      {/* ── Step config panel ──────────────────────────────────────────────── */}
      <div
        style={{
          width: 256,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {selectedStep ? (
          <Card
            size="small"
            title={
              <Space size={4}>
                <EditOutlined style={{ color: '#1890ff' }} />
                <span>Configurer l'étape</span>
              </Space>
            }
            style={{ height: '100%', overflow: 'auto' }}
            styles={{ body: { padding: '12px' } }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={10}>

              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Nom de l'étape *</Text>
                <Input
                  value={selectedStep.name}
                  onChange={e => updateStep('name', e.target.value)}
                  placeholder="Nom de l'étape"
                  size="small"
                  style={{ marginTop: 3 }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Type d'action</Text>
                <Select
                  value={selectedStep.stepType}
                  onChange={v => updateStep('stepType', v)}
                  options={STEP_TYPES.map(st => ({
                    value: st.value,
                    label: (
                      <Space size={4}>
                        <span style={{ color: st.color }}>{STEP_ICONS[st.value]}</span>
                        {st.label}
                      </Space>
                    ),
                  }))}
                  size="small"
                  style={{ width: '100%', marginTop: 3 }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Configuration (JSON)</Text>
                <Input.TextArea
                  value={selectedStep.actionConfig ?? '{}'}
                  onChange={e => updateStep('actionConfig', e.target.value)}
                  rows={8}
                  placeholder='{}'
                  size="small"
                  style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 3 }}
                />
              </div>

              <div>
                <Tooltip title="Premier nœud exécuté lors du déclenchement">
                  <Tag color={selectedStep.isEntryPoint ? 'success' : 'default'}>
                    {selectedStep.isEntryPoint ? '● Point d\'entrée' : '○ Nœud intermédiaire'}
                  </Tag>
                </Tooltip>
              </div>

              <Divider style={{ margin: '4px 0' }} />

              <Button
                danger
                size="small"
                block
                icon={<DeleteOutlined />}
                onClick={() => { handleDelete(selectedIndex!); }}
              >
                Supprimer cette étape
              </Button>
            </Space>
          </Card>
        ) : (
          <div
            style={{
              height: '100%',
              border: '1px dashed #d9d9d9',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: '#fafafa',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
            <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
              Cliquez sur un nœud pour le configurer
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
