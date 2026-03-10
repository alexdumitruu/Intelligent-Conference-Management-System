import { PaperStatus } from './entities/paper-history.entity';
export const VALID_STATUS_TRANSITIONS: Record<PaperStatus, PaperStatus[]> = {
    [PaperStatus.DRAFT]:        [PaperStatus.SUBMITTED],
    [PaperStatus.SUBMITTED]:    [PaperStatus.BIDDING],
    [PaperStatus.BIDDING]:      [PaperStatus.UNDER_REVIEW],
    [PaperStatus.UNDER_REVIEW]: [PaperStatus.DISCUSSION],
    [PaperStatus.DISCUSSION]:   [PaperStatus.ACCEPTED, PaperStatus.REJECTED],
    [PaperStatus.ACCEPTED]:     [],
    [PaperStatus.REJECTED]:     [],
};