import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Input, Select, Modal, Tooltip,
  Badge, Space, Typography, Divider, message, Spin, Empty, Steps,
} from 'antd';
import {
  ThunderboltOutlined, PlusOutlined, EyeOutlined, SearchOutlined,
  TeamOutlined, MailOutlined, CheckSquareOutlined, CalendarOutlined,
  BellOutlined, ClockCircleOutlined, ForkOutlined, AuditOutlined,
  RobotOutlined, ApiOutlined, EditOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchTemplates,
  fetchTemplateById,
  useTemplate,
  setTemplateFilters,
  clearSelectedTemplate,
} from './workflowsSlice';
import {
  ENTITY_TYPES,
  TRIGGER_TYPES,
  TEMPLATE_CATEGORIES,
  WorkflowTemplateListItem,
  WorkflowTemplate,
} from '@/types/workflow';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// ── Helpers ──────────────────────────────────────────────────────────────────

const ENTITY_COLOR: Record<string, string> = {
  LEAD: 'blue', OPPORTUNITY: 'green', ACCOUNT: 'purple',
  CONTACT: 'cyan', QUOTE: 'orange', VISIT: 'geekblue', TICKET: 'red',
};

const STEP_ICON: Record<string, React.ReactNode> = {
  SEND_EMAIL:         <MailOutlined />,
  CREATE_TASK:        <CheckSquareOutlined />,
  CREATE_ACTIVITY:    <CalendarOutlined />,
  UPDATE_ENTITY:      <EditOutlined />,
  SEND_NOTIFICATION:  <BellOutlined />,
  DELAY:              <ClockCircleOutlined />,
  CONDITION:          <ForkOutlined />,
  APPROVAL:           <AuditOutlined />,
  AI_ACTION:          <RobotOutlined />,
  WEBHOOK:            <ApiOutlined />,
};

const STEP_COLOR: Record<string, string> = {
  SEND_EMAIL: '#1890ff', CREATE_TASK: '#52c41a', CREATE_ACTIVITY: '#722ed1',
  UPDATE_ENTITY: '#fa8c16', SEND_NOTIFICATION: '#eb2f96', DELAY: '#8c8c8c',
  CONDITION: '#13c2c2', APPROVAL: '#faad14', AI_ACTION: '#9254de', WEBHOOK: '#595959',
};

const entityLabel = (v: string) =>
  ENTITY_TYPES.find(e => e.value === v)?.label ?? v;

const triggerLabel = (v: string) =>
  TRIGGER_TYPES.find(t => t.value === v)?.label ?? v;

// ── Template Card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  tpl: WorkflowTemplateListItem;
  onPreview: (id: string) => void;
  onUse: (id: string, name: string) => void;
  using: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ tpl, onPreview, onUse, using }) => (
  <Card
    hoverable
    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    actions={[
      <Tooltip title="Aperçu des étapes" key="preview">
        <Button type="text" icon={<EyeOutlined />} onClick={() => onPreview(tpl.id)}>
          Aperçu
        </Button>
      </Tooltip>,
      <Tooltip title="Créer un workflow depuis ce template" key="use">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={using}
          onClick={() => onUse(tpl.id, tpl.name)}
          size="small"
        >
          Utiliser
        </Button>
      </Tooltip>,
    ]}
  >
    {/* Header */}
    <Space align="start" style={{ marginBottom: 12 }}>
      <span style={{ fontSize: 28 }}>{tpl.icon || '⚙️'}</span>
      <div>
        <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>{tpl.name}</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>{tpl.category}</Text>
      </div>
    </Space>

    {/* Description */}
    <Paragraph
      ellipsis={{ rows: 2 }}
      style={{ fontSize: 13, color: '#595959', flex: 1, marginBottom: 12 }}
    >
      {tpl.description}
    </Paragraph>

    {/* Badges */}
    <Space wrap size={4} style={{ marginBottom: 8 }}>
      <Tag color={ENTITY_COLOR[tpl.entityType] || 'default'}>{entityLabel(tpl.entityType)}</Tag>
      <Tag icon={<ThunderboltOutlined />} color="default" style={{ fontSize: 11 }}>
        {triggerLabel(tpl.triggerType)}
      </Tag>
    </Space>

    {/* Footer stats */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        <TeamOutlined /> {tpl.stepCount} étape{tpl.stepCount > 1 ? 's' : ''}
      </Text>
      {tpl.usageCount > 0 && (
        <Badge
          count={tpl.usageCount}
          style={{ backgroundColor: '#52c41a' }}
          title={`Utilisé ${tpl.usageCount} fois`}
          overflowCount={999}
        />
      )}
    </div>

    {/* Tags */}
    {tpl.tags && (
      <div style={{ marginTop: 8 }}>
        {tpl.tags.split(',').slice(0, 4).map(tag => (
          <Tag key={tag.trim()} style={{ fontSize: 11, marginBottom: 2 }}>{tag.trim()}</Tag>
        ))}
      </div>
    )}
  </Card>
);

// ── Preview Modal ─────────────────────────────────────────────────────────────

interface PreviewModalProps {
  template: WorkflowTemplate | null;
  open: boolean;
  onClose: () => void;
  onUse: (id: string, name: string) => void;
  using: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ template, open, onClose, onUse, using }) => {
  if (!template) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={700}
      title={
        <Space>
          <span style={{ fontSize: 22 }}>{template.icon || '⚙️'}</span>
          <span>{template.name}</span>
          <Tag color="blue">{template.category}</Tag>
        </Space>
      }
      footer={[
        <Button key="close" onClick={onClose}>Fermer</Button>,
        <Button
          key="use"
          type="primary"
          icon={<PlusOutlined />}
          loading={using}
          onClick={() => onUse(template.id, template.name)}
        >
          Utiliser ce template
        </Button>,
      ]}
    >
      {/* Description */}
      <Paragraph style={{ fontSize: 14, color: '#595959' }}>{template.description}</Paragraph>

      {/* Metadata */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Tag color={ENTITY_COLOR[template.entityType] || 'default'}>
          {entityLabel(template.entityType)}
        </Tag>
        <Tag icon={<ThunderboltOutlined />} color="geekblue">
          {triggerLabel(template.triggerType)}
        </Tag>
        {template.triggerConfig && (
          <Tag color="orange">Config déclencheur définie</Tag>
        )}
      </Space>

      <Divider orientation="left" plain>Étapes ({template.steps.length})</Divider>

      {/* Steps preview */}
      <Steps
        direction="vertical"
        size="small"
        current={-1}
        items={template.steps.map((step, idx) => ({
          key: idx,
          title: (
            <Space>
              <span style={{ color: STEP_COLOR[step.stepType] || '#000' }}>
                {STEP_ICON[step.stepType]}
              </span>
              <Text strong>{step.name}</Text>
              <Tag style={{ fontSize: 11 }}>{step.stepType.replace('_', ' ')}</Tag>
              {step.isEntryPoint && <Tag color="green" style={{ fontSize: 11 }}>Point d'entrée</Tag>}
            </Space>
          ),
          description: step.actionConfig && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {(() => {
                try {
                  const cfg = JSON.parse(step.actionConfig);
                  return Object.entries(cfg)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ');
                } catch {
                  return step.actionConfig;
                }
              })()}
            </Text>
          ),
          icon: (
            <span style={{ color: STEP_COLOR[step.stepType] || '#8c8c8c', fontSize: 16 }}>
              {STEP_ICON[step.stepType]}
            </span>
          ),
        }))}
      />

      {/* Transitions */}
      {template.transitions.length > 0 && (
        <>
          <Divider orientation="left" plain>Transitions ({template.transitions.length})</Divider>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {template.transitions.map((t, i) => (
              <Tag key={i} icon={<ArrowRightOutlined />} color="default">
                Étape {t.fromStepIndex + 1} → Étape {t.toStepIndex + 1}
                {t.label && <span style={{ marginLeft: 4, fontWeight: 600 }}>[{t.label}]</span>}
              </Tag>
            ))}
          </div>
        </>
      )}

      {/* Usage count */}
      {template.usageCount > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            <TeamOutlined /> Utilisé {template.usageCount} fois
          </Text>
        </div>
      )}
    </Modal>
  );
};

// ── Name Dialog ───────────────────────────────────────────────────────────────

interface NameDialogProps {
  open: boolean;
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const NameDialog: React.FC<NameDialogProps> = ({
  open, defaultName, onConfirm, onCancel, loading
}) => {
  const [name, setName] = useState(defaultName);
  useEffect(() => { setName(defaultName); }, [defaultName]);

  return (
    <Modal
      open={open}
      title="Nommer le workflow"
      onCancel={onCancel}
      onOk={() => onConfirm(name)}
      okText="Créer le workflow"
      confirmLoading={loading}
    >
      <div style={{ marginBottom: 8 }}>
        <Text>Vous pouvez personnaliser le nom de votre nouveau workflow :</Text>
      </div>
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nom du workflow"
        autoFocus
      />
    </Modal>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const WorkflowTemplatesGallery: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    templates, selectedTemplate, templatesLoading, templateFilters,
  } = useAppSelector(s => s.workflows);

  const [previewOpen, setPreviewOpen]     = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [pendingName, setPendingName]     = useState('');
  const [usingId, setUsingId]             = useState<string | null>(null);

  // Charger les templates au montage
  useEffect(() => {
    dispatch(fetchTemplates(templateFilters));
  }, [dispatch, templateFilters]);

  // Grouper par catégorie
  const grouped = templates.reduce((acc, tpl) => {
    if (!acc[tpl.category]) acc[tpl.category] = [];
    acc[tpl.category].push(tpl);
    return acc;
  }, {} as Record<string, WorkflowTemplateListItem[]>);

  // Handlers
  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    await dispatch(fetchTemplateById(id));
    setPreviewLoading(false);
    setPreviewOpen(true);
  };

  const handleUseRequest = (id: string, defaultName: string) => {
    if (previewOpen) setPreviewOpen(false);
    setPendingTemplateId(id);
    setPendingName(defaultName);
    setNameDialogOpen(true);
  };

  const handleConfirmUse = async (name: string) => {
    if (!pendingTemplateId) return;
    setUsingId(pendingTemplateId);
    setNameDialogOpen(false);
    try {
      await dispatch(useTemplate({ templateId: pendingTemplateId, customName: name })).unwrap();
      message.success(`Workflow "${name}" créé avec succès depuis le template !`);
    } catch (err: any) {
      message.error(err || 'Erreur lors de la création du workflow');
    } finally {
      setUsingId(null);
      setPendingTemplateId(null);
    }
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    dispatch(setTemplateFilters({ ...templateFilters, [key]: value || undefined }));
  };

  return (
    <div>
      {/* Filtres */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input
          placeholder="Rechercher un template..."
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          allowClear
          value={templateFilters.search || ''}
          onChange={e => handleFilterChange('search', e.target.value || undefined)}
        />
        <Select
          placeholder="Catégorie"
          allowClear
          style={{ width: 200 }}
          value={templateFilters.category}
          onChange={v => handleFilterChange('category', v)}
        >
          {TEMPLATE_CATEGORIES.map(c => (
            <Option key={c.value} value={c.value}>
              {c.icon} {c.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Type d'entité"
          allowClear
          style={{ width: 180 }}
          value={templateFilters.entityType}
          onChange={v => handleFilterChange('entityType', v)}
        >
          {ENTITY_TYPES.map(e => (
            <Option key={e.value} value={e.value}>{e.label}</Option>
          ))}
        </Select>
      </div>

      {/* Contenu */}
      {templatesLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" tip="Chargement des templates..." />
        </div>
      ) : templates.length === 0 ? (
        <Empty
          description="Aucun template trouvé"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 40 }}>
            {/* Titre de la catégorie */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>
                {TEMPLATE_CATEGORIES.find(c => c.value === category)?.icon || '📁'}
              </span>
              <Title level={4} style={{ margin: 0 }}>{category}</Title>
              <Tag>{items.length} template{items.length > 1 ? 's' : ''}</Tag>
            </div>

            <Row gutter={[16, 16]}>
              {items.map(tpl => (
                <Col key={tpl.id} xs={24} sm={12} lg={8} xl={6}>
                  <TemplateCard
                    tpl={tpl}
                    onPreview={handlePreview}
                    onUse={handleUseRequest}
                    using={usingId === tpl.id}
                  />
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}

      {/* Preview Modal */}
      <PreviewModal
        template={selectedTemplate}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          dispatch(clearSelectedTemplate());
        }}
        onUse={handleUseRequest}
        using={previewLoading}
      />

      {/* Name Dialog */}
      <NameDialog
        open={nameDialogOpen}
        defaultName={pendingName}
        onConfirm={handleConfirmUse}
        onCancel={() => { setNameDialogOpen(false); setPendingTemplateId(null); }}
        loading={usingId !== null}
      />
    </div>
  );
};

export default WorkflowTemplatesGallery;
