export interface DesignDoctrine {
  hierarchy: string[];
  principles: string[];
  constraints: string[];
  antiPatterns: string[];
}

export interface QAChecklist {
  items: Array<{
    category: string;
    checks: string[];
  }>;
}
