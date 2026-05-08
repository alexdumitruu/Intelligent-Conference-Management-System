// ─────────────────────────────────────────────────────────────
// API Response & Domain Types
// Mirrors the NestJS backend entities for the mobile client.
// ─────────────────────────────────────────────────────────────

/** POST /auth/login response */
export interface LoginResponse {
  accessToken: string;
}

/** User profile returned by GET /users/profile */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  affiliation?: string;
}

/** Finite State Machine statuses for a paper */
export enum PaperStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  BIDDING = 'BIDDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DISCUSSION = 'DISCUSSION',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

/** Nested author on a paper (via PaperAuthor join) */
export interface PaperAuthor {
  id: number;
  paperId: number;
  userId: number;
  authorOrder: number;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'affiliation'>;
}

/** Paper entity returned by GET /conferences/:id/papers/mine */
export interface Paper {
  id: number;
  title: string;
  abstract: string;
  pdfPath: string | null;
  status: PaperStatus;
  conferenceId: number;
  keywords?: string[];
  topics?: string[];
  rebuttalText?: string;
  authors?: PaperAuthor[];
  createdAt: string;
  updatedAt: string;
}

/** Conference entity returned by GET /conferences */
export interface Conference {
  id: number;
  title: string;
  description?: string;
  submissionDeadline: string;
  reviewDeadline?: string;
  discussionDeadline?: string;
  isDoubleBlind?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** React Navigation param list */
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};
