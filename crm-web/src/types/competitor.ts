export interface Competitor {
  id: string;
  name: string;
  website?: string;
  description?: string;
  strengths?: string;
  weaknesses?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCompetitorRequest {
  name: string;
  website?: string;
  description?: string;
  strengths?: string;
  weaknesses?: string;
}

export interface UpdateCompetitorRequest extends Partial<CreateCompetitorRequest> {
  isActive?: boolean;
}
