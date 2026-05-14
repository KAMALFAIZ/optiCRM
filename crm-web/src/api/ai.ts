import apiClient from './client';
import { store } from '@/store';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateEmailRequest {
  subject: string;
  recipientName?: string;
  recipientCompany?: string;
  context?: string;
  tone?: 'professional' | 'friendly' | 'formal';
}

export interface AnalyzeLeadRequest {
  leadName: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: string;
  industry?: string;
  estimatedValue?: number;
  notes?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const streamChat = (
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): (() => void) => {
  const token = store.getState().auth.accessToken;
  const controller = new AbortController();
  let settled = false; // garantit que onDone OU onError est appelé, jamais les deux

  const finish = (fn: () => void) => {
    if (settled) return;
    settled = true;
    fn();
  };

  (async () => {
    try {
      const response = await fetch(`${BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        finish(() => onError('Erreur lors de la connexion au service AI.'));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        finish(() => onError('Flux de réponse indisponible.'));
        return;
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event:done') || line.startsWith('event: done')) {
            finish(() => onDone());
            return;
          }
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data) onChunk(data);
          }
        }
      }

      finish(() => onDone());
    } catch (err) {
      // controller.signal.aborted est fiable sur tous les navigateurs,
      // contrairement à e.name === 'AbortError' (Chrome peut lancer TypeError)
      if (!controller.signal.aborted) {
        finish(() => onError('Une erreur est survenue. Veuillez réessayer.'));
      }
    }
  })();

  return () => controller.abort();
};

export const generateEmail = async (request: GenerateEmailRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/generate-email',
    request
  );
  return response.data.data;
};

export const analyzeLead = async (request: AnalyzeLeadRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/analyze-lead',
    request
  );
  return response.data.data;
};

export interface AnalyzeOpportunityRequest {
  opportunityName: string;
  stageName?: string;
  amount?: number;
  probability?: number;
  closeDate?: string;
  accountName?: string;
  productNames?: string;
  notes?: string;
}

export interface AnalyzeAccountRequest {
  accountName: string;
  industry?: string;
  city?: string;
  revenueCurrentYear?: number;
  pipelineValue?: number;
  overdueAmount?: number;
  contactCount?: number;
}

export interface GenerateSalesInsightsRequest {
  period: string;
  caRealise: number;
  caObjectif: number;
  tauxAtteinte: number;
  nbExceeded: number;
  nbAchieved: number;
  nbInProgress: number;
  nbFailed: number;
}

export const analyzeOpportunity = async (request: AnalyzeOpportunityRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/analyze-opportunity',
    request
  );
  return response.data.data;
};

export const analyzeAccount = async (request: AnalyzeAccountRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/analyze-account',
    request
  );
  return response.data.data;
};

export const generateSalesInsights = async (request: GenerateSalesInsightsRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/generate-sales-insights',
    request
  );
  return response.data.data;
};

// ─── Nouvelles fonctions AI ──────────────────────────────────────────

export interface SummarizePipelineRequest {
  totalOpportunities?: number;
  totalValue?: number;
  wonCount?: number;
  lostCount?: number;
  inProgressCount?: number;
  winRate?: number;
  topStage?: string;
  period?: string;
}

export interface SuggestFollowUpsRequest {
  contactName: string;
  company?: string;
  lastInteraction?: string;
  lastInteractionDate?: string;
  status?: string;
  opportunityStage?: string;
  dealValue?: number;
  notes?: string;
}

export interface GenerateMeetingSummaryRequest {
  notes: string;
  meetingType?: string;
  participants?: string;
  date?: string;
  accountName?: string;
}

export interface SmartSearchRequest {
  query: string;
  context?: string;
}

export const summarizePipeline = async (request: SummarizePipelineRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/summarize-pipeline',
    request
  );
  return response.data.data;
};

export const suggestFollowUps = async (request: SuggestFollowUpsRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/suggest-follow-ups',
    request
  );
  return response.data.data;
};

export const generateMeetingSummary = async (request: GenerateMeetingSummaryRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/generate-meeting-summary',
    request
  );
  return response.data.data;
};

export const smartSearch = async (request: SmartSearchRequest): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/smart-search',
    request
  );
  return response.data.data;
};

// ─── P1 : Nouvelles fonctionnalités IA ──────────────────────────────

export interface AccountSummary360Request {
  accountId: string;
}

export const accountSummary360 = async (request: AccountSummary360Request): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/account-summary-360',
    request
  );
  return response.data.data;
};

export interface LeadScoringAiRequest {
  leadId: string;
}

export interface LeadScoringAiResponse {
  score: number;
  label: string;
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  reasoning: string;
}

export const leadScoringAi = async (request: LeadScoringAiRequest): Promise<LeadScoringAiResponse> => {
  const response = await apiClient.post<{ success: boolean; data: string }>(
    '/ai/lead-scoring-ai',
    request
  );
  // Backend returns JSON string, parse it
  try {
    let raw = response.data.data.trim();
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(raw);
  } catch {
    return {
      score: 0,
      label: 'Indisponible',
      strengths: [],
      weaknesses: [],
      nextActions: [],
      reasoning: response.data.data,
    };
  }
};

export interface ClassifyTicketRequest {
  title: string;
  description?: string;
  accountName?: string;
}

export interface ClassifyTicketResponse {
  category: string;
  priority: string;
  reasoning: string;
}

export const classifyTicket = async (request: ClassifyTicketRequest): Promise<ClassifyTicketResponse> => {
  const response = await apiClient.post<{ success: boolean; data: ClassifyTicketResponse }>(
    '/ai/classify-ticket',
    request
  );
  return response.data.data;
};
