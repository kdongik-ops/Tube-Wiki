# Step 3: summarize

## 읽어야 할 파일

- `/CLAUDE.md` (모델 기본값 `claude-sonnet-5`, `SUMMARY_MODEL` 오버라이드, 서버 전용 규칙), `/docs/PRD.md` (요약 품질 요구), `/docs/ADR.md` (ADR-003)
- `/src/types/index.ts` (`SummaryResult`, `TitleVerification`, `SummarySection`, `VideoMetadata`, `TranscriptSegment`)
- `/src/services/youtube.ts` (앞 step에서 만든 자막/메타 형태)

**참고**: Anthropic SDK 사용법·모델 ID·메시지 API가 불확실하면 `claude-api` 스킬 문서를 참조하라. 모델 기본값은 `claude-sonnet-5`.

## 작업

자막을 구조화된 `SummaryResult`로 바꾸고, 그 결과를 위키용 Markdown 문자열로 렌더링하는 요약 파이프라인을 만든다. 세 파일: **프롬프트 조립(순수)·MD 렌더(순수)는 `lib/`, LLM 호출은 `services/`**.

### 1) `src/lib/prompt.ts` (순수 함수)

```ts
import type { VideoMetadata, TranscriptSegment } from "@/types";

// 요약+검증을 지시하는 프롬프트(system, user)를 조립한다.
export function buildSummaryPrompt(
  metadata: VideoMetadata,
  transcript: TranscriptSegment[],
): { system: string; user: string };
```

프롬프트가 반드시 강제할 것:
- **과잉 압축 금지**: 전체 흐름을 파악할 수 있도록 섹션별로 충분히 상세하게. 단순 한 줄 요약으로 끝내지 말 것.
- **제목/썸네일 vs 실제 내용 검증**: `verification`에 제목이 약속·암시하는 바(`titleClaim`), 실제 내용(`actualContent`), 판정(`verdict`: match/partial/mismatch), 근거(`rationale`)를 채울 것. 낚시(제목과 내용 불일치)를 명확히 드러낼 것.
- **결론 정렬**: `conclusion`은 제목/썸네일이 기대하게 만든 질문에 영상이 실제로 내놓은 답으로 채울 것.
- **정보 밀도**: LLM 위키 소스로 쓰이므로 인용/수치(`quotes`), 인물·제품·기업(`entities`), 키워드(`keywords`)를 최대한 보존.
- **언어**: 영상 언어와 무관하게 **모든 출력은 한국어**.
- **출력 형식**: 오직 `SummaryResult` 스키마의 **JSON만** 출력(코드펜스·설명 금지). 필드: tldr, conclusion, overview, sections[{heading, timestamp?, content}], keyPoints[], quotes[], entities[], keywords[], verification{titleClaim, actualContent, verdict, rationale}.
- 자막이 매우 길어 토큰 한도를 넘길 수 있으면 안전하게 잘라내되, 잘렸음을 프롬프트에 명시(요약이 후반부를 놓쳤다는 힌트).

### 2) `src/services/claude.ts` (네트워크)

```ts
import type { SummaryResult, VideoMetadata, TranscriptSegment } from "@/types";

export async function summarize(
  metadata: VideoMetadata,
  transcript: TranscriptSegment[],
): Promise<SummaryResult>;
```

구현 규칙:
- `@anthropic-ai/sdk`로 `messages.create` 호출. 모델은 `process.env.SUMMARY_MODEL ?? "claude-sonnet-5"`. `max_tokens`는 넉넉히(예: 4096 이상).
- `buildSummaryPrompt`로 프롬프트를 만들어 `system` + `user` 메시지로 전달.
- 응답 텍스트에서 JSON을 **방어적으로 파싱**한다(코드펜스로 감싸져 오면 벗겨내고 파싱). 파싱 실패 시 명확한 에러를 던진다(라우트가 500으로 처리).
- 파싱된 객체가 `SummaryResult` 필수 필드를 갖췄는지 최소 검증. `verdict`가 유니온(match/partial/mismatch) 밖이면 `partial`로 보정.
- `ANTHROPIC_API_KEY`는 SDK가 env에서 읽는다. 코드에 하드코딩하지 마라.

### 3) `src/lib/markdown.ts` (순수 함수)

```ts
import type { SummaryResult, VideoMetadata } from "@/types";

export function buildMarkdown(
  metadata: VideoMetadata,
  result: SummaryResult,
): string;
```

구조화된 결과를 **정보 밀도 높은 위키용 Markdown**으로 결정론적으로 렌더한다(LLM 호출 없음). 문서 구조(이 순서, 누락 없이):
1. **YAML front matter** — `title`, `channel`, `url`, `videoId`, `published`(있으면), `duration`(있으면), `views`(있으면), `verdict`, `keywords`(태그 리스트). LLM 위키가 파싱하기 좋게.
2. `# {제목}` — H1.
3. **메타 정보 표** — 채널 / URL / 게시일 / 길이 / 조회수(있는 것만 행으로).
4. **TL;DR** — `tldr`.
5. **제목·썸네일 검증** — `verdict`를 이모지+한국어 라벨(match=✅ 일치 / partial=⚠️ 부분일치 / mismatch=❌ 불일치(낚시))로. `titleClaim`, `actualContent`, `rationale`을 소제목/불릿으로.
6. **핵심 결론** — `conclusion`.
7. **전체 개요** — `overview`.
8. **상세 내용** — `sections`를 각각 `### {timestamp 있으면 앞에 표기} {heading}` + `content`로. 과하게 압축하지 말고 content를 그대로 충실히.
9. **핵심 포인트** — `keyPoints` 불릿.
10. **주요 인용·수치** — `quotes` 불릿(비어있으면 섹션 생략 가능).
11. **언급된 인물·제품·기업** — `entities` 불릿(비어있으면 생략 가능).
12. **키워드** — `keywords`를 백틱/쉼표로.
13. 문서 하단에 원본 링크 각주.

규칙: 선택적 메타데이터(`publishedAt` 등)가 없으면 해당 행/필드를 조용히 생략(빈 값 출력 금지). 순수 Markdown 텍스트만 반환(HTML 금지).

### 4) 테스트 (순수 함수만)

- `src/lib/prompt.test.ts` — 프롬프트에 핵심 지시(한국어 강제, JSON only, verification 요구, 과잉압축 금지)가 포함됐는지 문자열 검증.
- `src/lib/markdown.test.ts` — 대표 `SummaryResult`+`VideoMetadata` 픽스처를 넣고, 반환 MD에 front matter·모든 섹션 제목·verdict 라벨·각 section의 heading/content·keyPoints 항목이 포함되는지, 선택 메타가 없을 때 해당 행이 빠지는지 검증.
- **`services/claude.ts`용 SDK 목킹 테스트는 만들지 마라** (MVP 단순화: 외부 I/O 목킹 테스트 미강제).

## Acceptance Criteria

```bash
npm run build
npx vitest run
```

## 검증 절차

1. 위 AC 실행.
2. 체크리스트: 모델 기본값이 `claude-sonnet-5`이고 env 오버라이드 가능한가? 프롬프트가 한국어·JSON-only·검증을 강제하는가? `buildMarkdown`이 순수 함수(네트워크/LLM 없음)이고 13개 구성요소를 갖추는가? 테스트가 두 순수 함수만 대상으로 하는가?
3. `phases/0-mvp/index.json`의 step 3 업데이트.

## 금지사항

- 실제 Anthropic API를 테스트에서 호출하거나, SDK 목킹 테스트를 만들지 마라. 이유: 비용·불안정 + MVP 단순화 방침.
- API 키를 코드/테스트에 하드코딩하지 마라. 이유: 보안. SDK가 env에서 읽게 하라.
- `buildMarkdown`에서 정보를 임의로 요약·삭제하지 마라. 이유: MD는 정보 밀도가 핵심이다. `SummaryResult`를 충실히 옮겨라.
- 파일 저장(fs 쓰기)을 여기서 하지 마라. 이유: 산출물 저장은 step 4(라우트)의 책임이다.
- 기존 테스트를 깨뜨리지 마라.
