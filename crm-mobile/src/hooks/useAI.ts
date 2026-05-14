import apiClient from '../api/client';

export interface GenerateMeetingSummaryParams {
  notes: string;
  meetingType?: string;
  participants?: string;
  date?: string;
  accountName?: string;
}

export interface SuggestFollowUpsParams {
  contactName: string;
  company?: string;
  lastInteraction?: string;
  lastInteractionDate?: string;
  status?: string;
  notes?: string;
}

export async function generateMeetingSummary(params: GenerateMeetingSummaryParams): Promise<string> {
  const response = await apiClient.post('/ai/generate-meeting-summary', params);
  const data = response.data;
  if (typeof data === 'string') return data;
  if (data?.data) return data.data;
  if (data?.summary) return data.summary;
  return JSON.stringify(data);
}

export async function suggestFollowUps(params: SuggestFollowUpsParams): Promise<string> {
  const response = await apiClient.post('/ai/suggest-follow-ups', params);
  const data = response.data;
  if (typeof data === 'string') return data;
  if (data?.data) return data.data;
  if (data?.suggestions) return data.suggestions;
  return JSON.stringify(data);
}
