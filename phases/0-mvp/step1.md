# Step 1: core-types

## 읽어야 할 파일

- `/CLAUDE.md`, `/docs/ARCHITECTURE.md`, `/docs/PRD.md` (도메인 이해: 요약·검증·MD 산출물)
- `/src/app/page.tsx`, `/tsconfig.json` (step 0에서 생성된 스캐폴드 확인)

이전 step에서 만들어진 스캐폴드를 확인하고, 설계 의도를 이해한 뒤 작업하라.

## 작업

이 앱의 도메인 모델을 `src/types/index.ts` 한 파일에 정의한다. 로직 없이 **타입만** 선언한다. 아래 인터페이스를 그대로 정의하라(필드명·유니온 값을 바꾸지 마라 — 이후 모든 step이 이 계약에 의존한다):

```ts
export interface VideoMetadata {
  videoId: string;
  url: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  channelUrl?: string;
  publishedAt?: string;   // YouTube Data API 있을 때만
  durationSec?: number;   // 있을 때만
  viewCount?: number;     // 있을 때만
  description?: string;    // 있을 때만
  tags?: string[];         // 있을 때만
}

export interface TranscriptSegment {
  text: string;
  offset: number;    // 초 단위 시작 시각
  duration: number;  // 초 단위 길이
}

export type Verdict = "match" | "partial" | "mismatch";

export interface TitleVerification {
  titleClaim: string;      // 제목/썸네일이 약속·암시하는 것
  actualContent: string;   // 영상이 실제로 다루는 것
  verdict: Verdict;        // 일치 / 부분일치 / 불일치(낚시)
  rationale: string;       // 판단 근거
}

export interface SummarySection {
  heading: string;         // 섹션 제목
  timestamp?: string;      // "12:34" 형태(있으면)
  content: string;         // 과하게 압축하지 않은 상세 요약(여러 문장)
}

export interface SummaryResult {
  tldr: string;                    // 한 줄 요약
  conclusion: string;              // 영상이 실제로 도달한 핵심 결론
  overview: string;                // 전체 흐름 개요(한~여러 문단)
  sections: SummarySection[];      // 섹션별 상세
  keyPoints: string[];             // 핵심 포인트
  quotes: string[];                // 주요 인용/수치(원문 뉘앙스 보존)
  entities: string[];             // 언급된 인물/제품/기업/링크
  keywords: string[];              // 키워드/태그
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
  savedPath?: string;   // WIKI_OUTPUT_DIR 저장 성공 시 경로(저장 실패/생략 시 없음)
}

export type ApiErrorCode = "INVALID_URL" | "NO_TRANSCRIPT" | "INTERNAL";  // 에러 3종만

export interface ApiError {
  error: string;   // 사용자에게 보여줄 한국어 메시지
  code: ApiErrorCode;
}
```

## Acceptance Criteria

```bash
npm run build      # tsc 타입 체크 통과(에러 없음)
npx vitest run     # 기존 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트: 타입이 `src/types/index.ts`에 있는가? 필드명/유니온 값이 위 명세와 정확히 일치하는가?
3. `phases/0-mvp/index.json`의 step 1을 업데이트한다(성공 시 `completed` + `summary`, 실패 시 `error`, 개입 필요 시 `blocked`).

## 금지사항

- 타입 외의 로직·함수·클래스를 만들지 마라. 이유: 이 step은 타입 계약만 확정한다.
- 위 필드명이나 `Verdict`/`ApiErrorCode` 유니온 값을 바꾸지 마라. 이유: 이후 step들이 이 계약에 의존한다.
- 기존 테스트를 깨뜨리지 마라.
