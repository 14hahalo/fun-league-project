export interface StructuredInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  trend: string;
  attendance: string;
  advice: string;
}

export interface PlayerAnalysis {
  id: string;
  playerId: string;
  analysisText: string;
  structuredInsights?: StructuredInsights;
  generatedAt: string;
  basedOnMatchCount: number;
  lastMatchId: string | null;
  isActive: boolean;
  model: string;
  createdAt: string;
}

export interface PlayerAnalysisHistory {
  items: PlayerAnalysis[];
  page: number;
  pageSize: number;
}

export interface PlayerAnalysisFailure {
  playerId: string;
  lastError: string;
  lastMatchId: string | null;
  lastAttemptAt: string;
}
