export type ProjectStatus  = 'DRAFT' | 'ACTIF' | 'EN_PAUSE' | 'TERMINE' | 'ANNULE';
export type MilestoneStatus = 'EN_ATTENTE' | 'ATTEINT' | 'MANQUE';
export type TaskStatus     = 'A_FAIRE' | 'EN_COURS' | 'EN_REVUE' | 'FAIT' | 'ANNULE';
export type TaskPriority   = 'BASSE' | 'NORMALE' | 'HAUTE' | 'CRITIQUE';
export type TaskType       = 'TACHE' | 'LIVRABLE' | 'REUNION' | 'BUG' | 'FEATURE';
export type MemberRole     = 'CHEF' | 'MEMBRE' | 'OBSERVATEUR';

export interface ProjectRelated { id: string; name: string; }
export interface ProjectUser    { id: string; fullName: string; email: string; }

export interface ProjectMember {
  userId: string;
  fullName: string;
  email: string;
  role: MemberRole;
}

export interface Milestone {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  sortOrder: number;
  taskCount: number;
}

export interface Project {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  progressPct: number;
  account: ProjectRelated | null;
  opportunity: ProjectRelated | null;
  manager: ProjectUser | null;
  createdBy: ProjectUser | null;
  members: ProjectMember[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string | null;
}

export interface ProjectListItem {
  id: string;
  reference: string;
  name: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  progressPct: number;
  budget: number | null;
  accountId: string | null;
  accountName: string | null;
  managerId: string | null;
  managerName: string | null;
  taskCount: number;
  memberCount: number;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  estimatedHours: number | null;
  actualHours: number | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  projectId: string;
  projectName: string;
  milestoneId: string | null;
  milestoneName: string | null;
  parentTaskId: string | null;
  assignee: ProjectUser | null;
  createdBy: ProjectUser | null;
  comments: TaskComment[];
  subTasks: Task[];
  createdAt: string;
  updatedAt: string | null;
}

export interface TaskListItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate: string | null;
  estimatedHours: number | null;
  overdue: boolean;
  projectId: string;
  projectName: string;
  milestoneId: string | null;
  milestoneName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  subTaskCount: number;
  commentCount: number;
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  accountId?: string;
  opportunityId?: string;
  managerId?: string;
}

export interface UpdateProjectPayload extends CreateProjectPayload {
  status?: ProjectStatus;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  milestoneId?: string;
  parentTaskId?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  type?: TaskType;
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  milestoneId?: string;
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
}
