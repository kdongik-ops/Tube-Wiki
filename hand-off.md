# TubeWiki — 세션 인수인계 (hand-off)

> 이 파일만 읽고 다음 세션에서 바로 이어서 진행할 수 있도록 작성했다.
> 작성: 2026-07-07 · 갱신: 2026-07-09. 프로젝트: **TubeWiki** (YouTube 요약 → 위키 MD 생성 MVP).
> 전체 상세 플랜: `C:\Users\KIM_DONGIK\.claude\plans\idempotent-stirring-aho.md` (참고용, 로컬 경로).

## 현재 상태 한 줄 요약 (2026-07-09)

기획·문서·phases(6-step) 준비 **완료**, `main`에 커밋(`347f2a9`). **남은 것은 실행뿐** — 다음 세션은 아래 §3 "실행"부터 진행하면 된다: `python scripts/execute.py 0-mvp`.

---

## 0. 이 앱이 뭔가

유튜브 링크를 넣으면 → 영상 내용을 **과하게 압축하지 않고** 요약하고, **제목/썸네일이 실제 내용과 일치하는지(낚시 여부)** 검증하며, **LLM 위키 소스로 쓸 정보 밀도 높은 Markdown**을 생성해 폴더에 저장 + 다운로드하는 웹앱. **작은 MVP, over-engineering 금지.**

이 프로젝트는 **Harness 프레임워크**를 사용한다 (`harness` 스킬 / `.claude/commands/harness.md`). 워크플로우: A.탐색 → B.논의 → C.step설계 → D.파일생성(`phases/`) → E.실행(`scripts/execute.py`). `execute.py`가 `CLAUDE.md`+`docs/*.md`를 가드레일로 주입하며 `phases/0-mvp/stepN.md`를 개별 Claude 세션으로 순차 실행해 코드를 생성한다.

---

## 1. 확정된 결정 (사용자와 논의 완료)

| 항목 | 결정 |
|------|------|
| 스택 | Next.js 15 (App Router) + TypeScript strict + Tailwind + Vitest |
| 자막 | `youtube-transcript` (키 불필요). **captions-only** — 자막(자동생성 포함) 있는 영상만. 없으면 안내 후 종료 |
| caption-less | **지원 안 함** (Whisper/Gemini 폴백 모두 제외). MVP 단순화 |
| 메타데이터 | **YouTube Data API v3 (필수)** — 제목·채널·썸네일 + 게시일·길이·조회수·설명·태그. oEmbed 폴백 없음(단일 경로) |
| 요약 LLM | **Claude `claude-sonnet-5`**, 서버에서만 호출 (`@anthropic-ai/sdk`) |
| 저장 | 원샷·무저장(DB 없음). MD는 `WIKI_OUTPUT_DIR`(기본 `./output`)에 **`{videoId}.md`** best-effort 저장 + 브라우저 다운로드 |
| 출력 언어 | **항상 한국어** (영상 언어 무관) |
| 화면 | **렌더된 요약만 표시, 원본 MD 텍스트는 화면에 안 보임** (MD는 다운로드/폴더 저장 아티팩트) |
| 디자인 | 라이트 테마, 무채색 + 검증결과에만 시맨틱 색(초록/주황/빨강), AI 슬롭 안티패턴 금지 |
| 에러 | 3종만: URL오류→400 / 자막없음→422 / 그외→500 |
| 환경변수 | `ANTHROPIC_API_KEY`·`YOUTUBE_API_KEY`(필수), `SUMMARY_MODEL`·`WIKI_OUTPUT_DIR`(선택) |

**안 만드는 것**: 앱 내 히스토리/DB, 로그인, caption-less 폴백, 다국어, 복잡한 에러 분기, 파일명 슬러그/충돌관리, 과도한 컴포넌트/헬퍼 분리, 서비스·라우트 목킹 유닛테스트.
**유지(요구사항)**: 낚시 검증, 과잉압축 없는 상세 요약, 정보밀도 MD(인용·엔티티·키워드), 풍부한 메타데이터, 렌더된 요약 화면.

---

## 2. 현재 파일 상태 (2026-07-09: 모두 최신, `main` 커밋 `347f2a9`)

**기획 산출물 — 모두 최신·커밋 완료:**
- `CLAUDE.md` — 메타데이터 Data API v3, `WIKI_OUTPUT_DIR` 추가, TDD 규칙 완화(핵심 순수 함수 우선, 외부 I/O 목킹 테스트 미강제).
- `docs/PRD.md`, `docs/UI_GUIDE.md` — OK.
- `docs/ARCHITECTURE.md` — 데이터 흐름에 `WIKI_OUTPUT_DIR` 저장 단계 + 응답 `savedPath` 반영.
- `docs/ADR.md` — ADR-001~005 (002=Data API 필수, 005=산출물 best-effort 저장).
- `.env.example` — `WIKI_OUTPUT_DIR` 포함.
- `.gitignore` — `.env*`·`/output/` 무시.
- `phases/0-mvp/` — **6-step 재작성 완료**: `index.json` + `step0.md`~`step5.md`. (구식 `step6.md` 삭제됨)

**커밋 금지:**
- `.env.local` — 사용자 실제 키(ANTHROPIC/YOUTUBE) 입력 완료. gitignore 대상.

---

## 3. 다음 세션에서 할 일 → **실행 (E단계)**

준비(§2)는 끝났다. 남은 것은 실행뿐이다.

```bash
python scripts/execute.py 0-mvp        # Windows: python (python3 아니어도 됨)
python scripts/execute.py 0-mvp --push # 완료 후 push까지
```

- `feat-0-mvp` 브랜치 생성 → step 0~5 순차 생성, 다수 커밋. step당 최대 30분·3회 자동 재시도.
- **빌드에는 앱용 API 키 불필요** — execute.py는 로그인된 `claude` CLI로 코드를 생성한다. `.env.local` 키는 완성 앱을 실제로 돌려 요약할 때만 필요.
- `claude` CLI가 PATH에 있어야 하고, 실행 전 working tree가 clean해야 브랜치 checkout이 깨끗하다.
- **에러/차단 복구**: `phases/0-mvp/index.json`에서 해당 step `status`를 `pending`으로 되돌리고 `error_message`/`blocked_reason`을 삭제한 뒤 재실행.

실행이 끝나면: `feat-0-mvp`에서 `npm run dev`로 실제 URL을 넣어 요약→MD 다운로드 흐름을 한 번 확인(이때 `.env.local` 키 필요), 이상 없으면 `main`에 병합.

### phases 6-step 구성 (참고)

| # | step | 산출물 |
|---|------|--------|
| 0 | project-setup | Next.js 15(src/) **수동** 스캐폴드(+Tailwind/Vitest/deps: `@anthropic-ai/sdk`,`youtube-transcript`). `create-next-app` 금지(기존 파일 충돌). sanity 테스트 1개 |
| 1 | core-types | `src/types/index.ts` 도메인 계약 (아래 §4) |
| 2 | youtube-service | `lib/youtube-url.ts`(`extractVideoId`, 순수) + `services/youtube.ts`(Data API 메타 + 자막). 테스트: **URL 파싱만** |
| 3 | summarize | `lib/prompt.ts`(한국어·JSON-only·과잉압축 금지·낚시검증) + `services/claude.ts`(Claude→`SummaryResult` 방어 파싱) + `lib/markdown.ts`(→위키 MD). 테스트: 프롬프트 핵심지시 + MD 빌드 |
| 4 | api-route | `app/api/summarize/route.ts`(`runtime="nodejs"`): 오케스트레이션 + `WIKI_OUTPUT_DIR`(기본 `./output`)에 `{videoId}.md` **best-effort** 저장(`savedPath` 반환, 라우트 인라인). 에러 3종 매핑 |
| 5 | ui | `app/page.tsx` + `VerificationBadge` + `ResultView`(렌더된 요약, **원본 MD 미표시**, 다운로드 버튼 + "저장됨: 경로"). 로딩/에러 인라인. `UI_GUIDE.md` 준수, AI 슬롭 금지 |

---

## 4. 핵심 타입 계약 (`src/types/index.ts`) — 필드/유니온 값 변경 금지

```ts
export interface VideoMetadata {
  videoId: string; url: string; title: string; channel: string; thumbnailUrl: string;
  channelUrl?: string; publishedAt?: string; durationSec?: number; viewCount?: number;
  description?: string; tags?: string[];
}
export interface TranscriptSegment { text: string; offset: number; duration: number; }
export type Verdict = "match" | "partial" | "mismatch";
export interface TitleVerification { titleClaim: string; actualContent: string; verdict: Verdict; rationale: string; }
export interface SummarySection { heading: string; timestamp?: string; content: string; }
export interface SummaryResult {
  tldr: string; conclusion: string; overview: string; sections: SummarySection[];
  keyPoints: string[]; quotes: string[]; entities: string[]; keywords: string[];
  verification: TitleVerification;
}
export interface SummarizeRequest { url: string; }
export interface SummarizeResponse { metadata: VideoMetadata; result: SummaryResult; markdown: string; savedPath?: string; }
export type ApiErrorCode = "INVALID_URL" | "NO_TRANSCRIPT" | "INTERNAL";  // 에러 3종
export interface ApiError { error: string; code: ApiErrorCode; }
```

데이터 흐름: `URL → extractVideoId → fetchMetadata + fetchTranscript → buildSummaryPrompt → summarize(Claude) → buildMarkdown → output/{videoId}.md 저장(best-effort) → { metadata, result, markdown, savedPath } → UI 렌더 + 다운로드`.

---

## 5. UX 흐름 / 결과 화면

빈 상태(중앙 URL 입력+요약 버튼) → 로딩(자막 수집→요약 중) → 결과 화면:
- 메타 헤더(썸네일·제목·채널·게시일·조회수)
- **제목·썸네일 검증 배지 + 상세**(verdict별 색: match=초록, partial=주황, mismatch=빨강) ← 이 앱의 차별점, 가장 강조
- TL;DR → 핵심 결론 → 전체 개요 → 섹션별 상세 → 핵심 포인트/인용/엔티티/키워드
- "MD 다운로드" 버튼 + "저장됨: ./output/{videoId}.md"
- 에러 시 한국어 메시지 카드

원본 MD 텍스트는 화면에 표시하지 않는다. markdown 렌더 라이브러리 도입 안 함(구조화 JSON을 직접 렌더).

---

## 6. 메모

- **2026-07-09 세션**: phases를 6-step으로 재작성(구식 `step6.md` 삭제), docs 최신화(ADR-005·`WIKI_OUTPUT_DIR`·에러 3종·oEmbed 제거), `main` 커밋 `347f2a9`. 준비 완료 후 **execute.py는 사용자가 직접 실행**하기로 함(이번 세션은 실행 안 함).
- 6-step은 사용자와 합의: 기존 7-step에서 `summarize-service`+`markdown-builder`를 step 3 `summarize`로 병합.
- `youtube-transcript`/`@anthropic-ai/sdk`는 Node 런타임 필요 → api route는 `runtime="nodejs"` (edge 금지).
- 플랜을 한 번 **Ultraplan(Claude Code on the web)** 으로 보냈으나, 최종적으로 "이전 계획대로" 진행 → 로컬 이 hand-off 기준.
- **다음 세션은 §3 실행부터** 진행하면 된다.
