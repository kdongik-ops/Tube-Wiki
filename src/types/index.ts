export interface VideoMetadata {
  videoId: string;
  url: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  channelUrl?: string;
  publishedAt?: string; // YouTube Data API 있을 때만
  durationSec?: number; // 있을 때만
  viewCount?: number; // 있을 때만
  description?: string; // 있을 때만
  tags?: string[]; // 있을 때만
}

export interface TranscriptSegment {
  text: string;
  offset: number; // 초 단위 시작 시각
  duration: number; // 초 단위 길이
}

export type Verdict = "match" | "partial" | "mismatch";

export interface TitleVerification {
  titleClaim: string; // 제목/썸네일이 약속·암시하는 것
  actualContent: string; // 영상이 실제로 다루는 것
  verdict: Verdict; // 일치 / 부분일치 / 불일치(낚시)
  rationale: string; // 판단 근거
}

export interface SummarySection {
  heading: string; // 섹션 제목
  timestamp?: string; // "12:34" 형태(있으면)
  content: string; // 과하게 압축하지 않은 상세 요약(여러 문장)
}

export interface SummaryResult {
  tldr: string; // 한 줄 요약
  conclusion: string; // 영상이 실제로 도달한 핵심 결론
  overview: string; // 전체 흐름 개요(한~여러 문단)
  sections: SummarySection[]; // 섹션별 상세
  keyPoints: string[]; // 핵심 포인트
  quotes: string[]; // 주요 인용/수치(원문 뉘앙스 보존)
  entities: string[]; // 언급된 인물/제품/기업/링크
  keywords: string[]; // 키워드/태그
  verification: TitleVerification; // 제목-내용 검증
}

// API 계약
export interface SummarizeRequest {
  url: string;
}

export interface SummarizeResponse {
  metadata: VideoMetadata;
  result: SummaryResult;
  markdown: string;
  savedPath?: string; // WIKI_OUTPUT_DIR 저장 성공 시 경로(저장 실패/생략 시 없음)
}

export type ApiErrorCode = "INVALID_URL" | "NO_TRANSCRIPT" | "INTERNAL"; // 에러 3종만

export interface ApiError {
  error: string; // 사용자에게 보여줄 한국어 메시지
  code: ApiErrorCode;
}
