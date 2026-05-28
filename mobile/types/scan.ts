export type RiskLevel  = 'Low' | 'Medium' | 'High' | 'Critical';
export type ClassType  = 'melanoma' | 'non_melanoma' | 'acne' | 'healthy';
export type UrgencyLvl = 'URGENT' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';

export interface ABCDEScores {
  asymmetry: number;
  border:    number;
  color:     number;
  diameter:  number;
  evolution: number;
}

export interface DoctorSuggestion {
  stage?:         string | null;
  urgency_level:  UrgencyLvl;
  urgency_emoji:  string;
  doctor_type?:   string | null;
  department?:    string | null;
  message:        string;
  timeline?:      string | null;
  action?:        string | null;
  search_query?:  string | null;
  color:          string;
}

export interface ScanResult {
  is_demo_mode?: boolean;
  id:                string;
  image_url:         string;
  class_name:        ClassType;
  label:             string;
  confidence:        number;
  all_probabilities: Record<string, number>;
  is_malignant:      boolean | null;
  color:             string;
  urgency:           string;
  advice:            string;
  emoji:             string;
  abcde_scores:      ABCDEScores;
  risk_level:        RiskLevel;
  risk_score:        number;
  explanation:       string;
  skin_ratio:        number;
  body_location?:    string;
  created_at?:       string;
  result?:           string;
  doctor_suggestion?: DoctorSuggestion;
}
