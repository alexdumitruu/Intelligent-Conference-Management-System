export interface Paper {
  id: number;
  title: string;
  abstract: string;
  status: string;
  pdfPath: string | null;
  conferenceId: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlaggedCitation {
  citationNumber: number;
  referenceText: string;
  reason: string;
}

export interface CitationReport {
  id: number;
  paperId: number;
  totalCitations: number;
  verifiedCitations: number;
  flaggedErrors: FlaggedCitation[];
  extractionMethod: "REGEX" | "AI";
  createdAt: string;
  threshold?: number;
}

export interface AuthResponse {
  accessToken: string;
}
