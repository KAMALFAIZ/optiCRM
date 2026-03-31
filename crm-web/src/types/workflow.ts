export interface Workflow {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  triggerType: string;
  triggerConfig?: string;
  isActive: boolean;
  version: number;
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
  createdBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt?: string;
  totalExecutions?: number;
  activeExecutions?: number;
}

export interface WorkflowListItem {
  id: string;
  name: string;
  entityType: string;
  triggerType: string;
  isActive: boolean;
  version: number;
  stepCount: number;
  totalExecutions: number;
  activeExecutions: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkflowStep {
  id?: string;
  name: string;
  stepType: string;
  actionConfig?: string;
  stepOrder: number;
  positionX?: number;
  positionY?: number;
  isEntryPoint?: boolean;
}

export interface WorkflowTransition {
  id?: string;
  fromStepId?: string;
  toStepId?: string;
  fromStepIndex?: number;
  toStepIndex?: number;
  label?: string;
  conditionExpression?: string;
  evalOrder?: number;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  entityType: string;
  triggerType: string;
  triggerConfig?: string;
  steps?: WorkflowStep[];
  transitions?: WorkflowTransition[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  entityType?: string;
  triggerType?: string;
  triggerConfig?: string;
  isActive?: boolean;
  steps?: WorkflowStep[];
  transitions?: WorkflowTransition[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  entityType: string;
  entityId: string;
  status: string;
  currentStepId?: string;
  currentStepName?: string;
  resumeAt?: string;
  errorMessage?: string;
  triggeredById?: string;
  startedAt: string;
  completedAt?: string;
  logs?: ExecutionLog[];
}

export interface ExecutionLog {
  id: string;
  stepId: string;
  stepName: string;
  stepType: string;
  status: string;
  inputData?: string;
  outputData?: string;
  errorMessage?: string;
  durationMs?: number;
  executedAt: string;
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  runningExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  pausedExecutions: number;
}

// ── Workflow Templates ────────────────────────────────────────────────────────

export interface WorkflowTemplateStep {
  name: string;
  stepType: string;
  actionConfig?: string;
  stepOrder: number;
  isEntryPoint?: boolean;
  positionX?: number;
  positionY?: number;
}

export interface WorkflowTemplateTransition {
  fromStepIndex: number;
  toStepIndex: number;
  label?: string;
  conditionExpression?: string;
  evalOrder?: number;
}

/** Vue liste (galerie) */
export interface WorkflowTemplateListItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  entityType: string;
  triggerType: string;
  tags?: string;
  isSystem: boolean;
  usageCount: number;
  stepCount: number;
  createdAt: string;
}

/** Vue détail (preview avant utilisation) */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  entityType: string;
  triggerType: string;
  triggerConfig?: string;
  steps: WorkflowTemplateStep[];
  transitions: WorkflowTemplateTransition[];
  tags?: string;
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt?: string;
}

/** Catégories disponibles dans la galerie */
export const TEMPLATE_CATEGORIES = [
  { value: 'Lead Management',   label: 'Gestion des leads',   icon: '🎯' },
  { value: 'Sales',             label: 'Commercial',          icon: '💼' },
  { value: 'Field Operations',  label: 'Opérations terrain',  icon: '🏗️' },
  { value: 'Client Service',    label: 'Service client',      icon: '🤝' },
];

export const ENTITY_TYPES = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'OPPORTUNITY', label: 'Opportunité' },
  { value: 'ACCOUNT', label: 'Compte' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'QUOTE', label: 'Devis' },
  { value: 'VISIT', label: 'Visite' },
  { value: 'TICKET', label: 'Ticket' },
];

export const TRIGGER_TYPES = [
  { value: 'ENTITY_CREATED', label: 'Création d\'entité' },
  { value: 'FIELD_CHANGED', label: 'Changement de champ' },
  { value: 'STATUS_CHANGED', label: 'Changement de statut' },
  { value: 'SCORE_REACHED', label: 'Score atteint' },
  { value: 'CRON', label: 'Planifié (CRON)' },
  { value: 'MANUAL', label: 'Manuel' },
];

export const STEP_TYPES = [
  { value: 'SEND_EMAIL', label: 'Envoyer email', icon: 'mail', color: '#1890ff' },
  { value: 'CREATE_TASK', label: 'Créer tâche', icon: 'check-square', color: '#52c41a' },
  { value: 'CREATE_ACTIVITY', label: 'Créer activité', icon: 'calendar', color: '#722ed1' },
  { value: 'UPDATE_ENTITY', label: 'Modifier entité', icon: 'edit', color: '#fa8c16' },
  { value: 'SEND_NOTIFICATION', label: 'Envoyer notification', icon: 'bell', color: '#eb2f96' },
  { value: 'DELAY', label: 'Délai / Attente', icon: 'clock-circle', color: '#8c8c8c' },
  { value: 'CONDITION', label: 'Condition (SI/SINON)', icon: 'fork', color: '#13c2c2' },
  { value: 'APPROVAL', label: 'Approbation', icon: 'audit', color: '#faad14' },
  { value: 'AI_ACTION', label: 'Action IA', icon: 'robot', color: '#9254de' },
  { value: 'WEBHOOK', label: 'Webhook', icon: 'api', color: '#595959' },
];
