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
  generatedAt: Date;
  basedOnMatchCount: number;
  lastMatchId: string | null;
  isActive: boolean;
  model: string;
  createdAt: Date;
}
