# Step 4: api-route

## 읽어야 할 파일

- `/CLAUDE.md` (외부 API는 라우트/서비스에서만, 서버 전용, `WIKI_OUTPUT_DIR`), `/docs/ARCHITECTURE.md` (데이터 흐름), `/docs/ADR.md` (ADR-005 저장 정책)
- `/src/types/index.ts` (`SummarizeRequest`, `SummarizeResponse`, `ApiError`, `ApiErrorCode`)
- `/src/lib/youtube-url.ts`, `/src/services/youtube.ts`, `/src/services/claude.ts`, `/src/lib/markdown.ts` (오케스트레이션 대상)

앞선 모든 step의 함수 시그니처를 확인하고 그대로 조합하라.

## 작업

요약 파이프라인을 오케스트레이션하고, 생성된 MD를 서버 폴더에 best-effort로 저장하는 API 라우트를 만든다.

### `src/app/api/summarize/route.ts`

```ts
export const runtime = "nodejs";
export async function POST(req: Request): Promise<Response>;
```

처리 순서:
1. body에서 `{ url }`(`SummarizeRequest`) 파싱. 없거나 문자열이 아니면 400 `INVALID_URL`.
2. `extractVideoId(url)` → null이면 400 `INVALID_URL`.
3. `fetchMetadata(videoId)`와 `fetchTranscript(videoId)` 수행. **자막은 필수**(실패 시 아래 매핑). 메타 조회 실패는 치명(500).
4. `summarize(metadata, transcript)` → `SummaryResult`.
5. `buildMarkdown(metadata, result)` → markdown.
6. **MD 저장(best-effort, 인라인)**: `WIKI_OUTPUT_DIR`(없으면 `./output`)에 `fs/promises`로 `mkdir`(recursive) 후 `{videoId}.md`를 쓴다. 성공하면 그 경로를 `savedPath`에 담는다. **저장 실패는 삼켜라**(요청 전체를 실패시키지 말 것) — `savedPath`를 비우고 응답은 정상 200. 저장 로직은 별도 서비스로 분리하지 말고 라우트에 인라인으로 둔다(ADR-005).
7. 200으로 `SummarizeResponse { metadata, result, markdown, savedPath? }` 반환.

에러 → HTTP 매핑(응답 body는 `ApiError` 형태, 메시지는 **한국어**). 에러 3종만:
- `INVALID_URL` → 400 ("유효한 YouTube URL이 아닙니다")
- `NO_TRANSCRIPT` → 422 ("이 영상에는 자막이 없어 요약할 수 없습니다")
- 그 외 모든 예외 → 500 `INTERNAL` ("요약 중 오류가 발생했습니다")

서비스가 던진 에러에서 `code === "NO_TRANSCRIPT"`인지 확인해 422로, 그 외에는 500으로 매핑하라. 예상치 못한 에러도 500으로 안전하게 처리하고 **스택/내부 메시지를 응답에 노출하지 마라**.

## Acceptance Criteria

```bash
npm run build
npm run lint
npx vitest run   # 기존(순수 함수) 테스트가 계속 통과하는지 확인
```

## 검증 절차

1. 위 AC 실행.
2. 체크리스트: `runtime = "nodejs"`인가(youtube-transcript/SDK가 edge에서 안 돎)? 에러 코드→상태코드 매핑이 3종(400/422/500)으로 맞는가? MD 저장이 best-effort(실패해도 200)인가? 저장 로직이 라우트에 인라인인가? 키가 클라이언트로 새지 않는가?
3. `phases/0-mvp/index.json`의 step 4 업데이트.

## 금지사항

- `runtime`을 edge로 두지 마라. 이유: `youtube-transcript`와 Node용 SDK가 edge 런타임에서 동작하지 않는다.
- MD 저장 실패로 요청 전체를 실패시키지 마라. 이유: 저장은 best-effort다(ADR-005). 실패 시 `savedPath`만 비우고 200을 반환하라.
- 저장을 위한 별도 서비스/모듈을 만들지 마라. 이유: ADR-005가 라우트 인라인으로 고정했다(MVP 단순화).
- 라우트용 목킹 유닛테스트를 만들지 마라. 이유: MVP 단순화 방침(외부 I/O 목킹 테스트 미강제).
- 에러 스택/내부 메시지를 그대로 응답에 노출하지 마라. 이유: 정보 노출. 사용자용 한국어 메시지로 변환하라.
- UI를 만들지 마라. 이유: step 5의 책임이다.
- 기존 테스트를 깨뜨리지 마라.
