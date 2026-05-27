export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ClassType = 'mole' | 'non_mole' | 'pimple' | 'healthy';

export interface ABCDEScores {
  asymmetry: number;
  border: number;
  color: number;
  diameter: number;
  evolution: number;
}

export interface ScanResult {
  id: string;
  image_url: string;
  class_name: ClassType;
  label: string;
  confidence: number;
  all_probabilities: Record<string, number>;
  is_malignant: boolean | null;
  color: string;
  urgency: string;
  advice: string;
  emoji: string;
  abcde_scores: ABCDEScores;
  risk_level: RiskLevel;
  risk_score: number;
  explanation: string;
  skin_ratio: number;
  body_location?: string;
  created_at?: string;
  result?: string;
}
