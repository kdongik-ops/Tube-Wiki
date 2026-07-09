# Step 2: youtube-service

## 읽어야 할 파일

- `/CLAUDE.md` (외부 API는 services/에서만, 환경변수 규칙), `/docs/ADR.md` (ADR-002 메타데이터 전략), `/docs/ARCHITECTURE.md`
- `/src/types/index.ts` (step 1의 `VideoMetadata`, `TranscriptSegment`, `ApiErrorCode` 계약)

이전 step의 타입 계약을 정확히 읽고 그 형태에 맞춰 구현하라.

## 작업

두 모듈을 만든다. **네트워크 I/O는 `services/`에, 순수 함수는 `lib/`에** 둔다.

### 1) `src/lib/youtube-url.ts` (순수 함수)

```ts
// 다양한 YouTube URL에서 11자리 videoId를 추출한다. 실패 시 null.
export function extractVideoId(input: string): string | null;
```

지원해야 할 형태: `https://www.youtube.com/watch?v=ID`(추가 쿼리 포함), `https://youtu.be/ID`, `https://www.youtube.com/shorts/ID`, `https://www.youtube.com/embed/ID`, `https://m.youtube.com/watch?v=ID`. videoId는 11자([A-Za-z0-9_-]) 검증.

### 2) `src/services/youtube.ts` (네트워크)

```ts
import type { VideoMetadata, TranscriptSegment } from "@/types";

// YouTube Data API v3(videos.list)로 메타데이터 수집. 실패 시 예외.
export async function fetchMetadata(videoId: string): Promise<VideoMetadata>;

// youtube-transcript로 자막 수집. 자막 없으면 NO_TRANSCRIPT 에러.
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]>;
```

구현 규칙:
- **메타데이터는 Data API 단일 경로**: `process.env.YOUTUBE_API_KEY`로 `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id={id}&key={key}` 호출 → `title`, `channel`(snippet.channelTitle), `thumbnailUrl`(가장 큰 썸네일), `publishedAt`, `durationSec`(ISO8601 duration 파싱), `viewCount`, `description`, `tags`를 채운다. `videoId`, `url`은 항상 채운다. **oEmbed 폴백을 만들지 마라** (ADR-002: 단일 경로). 키가 없거나 응답 `items`가 비면 예외.
- **자막**: `youtube-transcript` 패키지(`YoutubeTranscript.fetchTranscript`) 사용. 결과를 `TranscriptSegment[]`로 매핑.
- **에러 구분**: 라우트(step 4)가 자막 없음만 따로 422로 매핑할 수 있어야 한다. 자막이 없을 때 던지는 에러는 `code: "NO_TRANSCRIPT"`를 갖게 하라(커스텀 에러 클래스나 `code` 필드를 가진 Error 중 하나로 일관되게). 그 외 실패(메타 조회 실패, 키 없음, 네트워크 오류 등)는 별도 코드 없이 그대로 던져도 된다 — 라우트가 500(`INTERNAL`)로 처리한다.

### 3) 테스트

- `src/lib/youtube-url.test.ts` — 위 URL 형태별 table-driven 테스트 + 잘못된 입력 → null.
- **`services/youtube.ts`의 목킹 유닛테스트는 만들지 마라** (MVP 단순화: 외부 I/O는 목킹 테스트 강제 안 함). 테스트는 순수 함수(`extractVideoId`)만 대상으로 한다.

## Acceptance Criteria

```bash
npm run build
npx vitest run
```

## 검증 절차

1. 위 AC 실행.
2. 체크리스트: 네트워크 호출이 `services/`에만 있는가? 순수 파싱이 `lib/`에 있는가? 메타데이터가 Data API 단일 경로인가(oEmbed 없음)? 자막 없음 에러가 `NO_TRANSCRIPT`로 구분되는가?
3. `phases/0-mvp/index.json`의 step 2 업데이트(성공/에러/차단).

## 금지사항

- oEmbed 폴백 경로를 만들지 마라. 이유: ADR-002가 Data API 단일 경로로 고정했다. 분기는 불필요한 복잡도다.
- `services/youtube.ts`용 네트워크 목킹 테스트를 만들지 마라. 이유: MVP 단순화 방침(외부 I/O 목킹 테스트 미강제).
- 클라이언트 컴포넌트에서 이 모듈을 import하지 마라. 이유: 서버 전용 코드다(키 노출).
- 기존 테스트를 깨뜨리지 마라.
