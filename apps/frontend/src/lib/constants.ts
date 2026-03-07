import { ReportReason } from '@private-board/shared';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  ILLEGAL_CONTENT: '불법 콘텐츠',
  DEFAMATION: '명예훼손',
  PERSONAL_INFO: '개인정보 침해',
  PHISHING: '피싱 / 사기',
  COPYRIGHT: '저작권 침해',
  OTHER: '기타',
};
