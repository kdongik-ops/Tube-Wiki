# Step 5: ui

## 읽어야 할 파일

- `/docs/UI_GUIDE.md` (색상·컴포넌트·타이포·안티패턴 — **반드시 준수**), `/docs/PRD.md` (사용성 목표)
- `/src/types/index.ts` (`SummarizeResponse`, `SummaryResult`, `Verdict`, `ApiError`)
- `/src/app/api/summarize/route.ts` (호출할 API 계약), `/src/app/page.tsx`, `/src/app/globals.css`

## 작업

사용자 화면을 완성한다. 유튜브 링크를 붙여넣으면 요약을 **렌더링해서** 보여주고 MD를 다운로드하게 한다. 컴포넌트는 최소로(2개)만 분리하고 나머지(폼·로딩·에러)는 페이지에 인라인으로 둔다.

### 컴포넌트 (`src/components/`)
- `VerificationBadge` — `Verdict`별 색/라벨: match=초록(#16a34a) "✅ 일치", partial=주황(#d97706) "⚠️ 부분일치", mismatch=빨강(#dc2626) "❌ 불일치(낚시)". 좌측 색 dot + 옅은 배경까지만(글로우/그라데이션 금지).
- `ResultView` — 결과 전체를 렌더한다: 메타 헤더(썸네일·제목·채널·게시일·조회수) → `VerificationBadge` + 검증 상세(titleClaim/actualContent/rationale) → TL;DR → 핵심 결론 → 전체 개요 → 섹션별 상세 → 핵심포인트 → 인용 → 엔티티 → 키워드. **이 앱의 차별점인 검증 배지·상세를 가장 강조**한다.

### 페이지 (`src/app/page.tsx`, client component)
- 상태: `idle | loading | success | error` + 결과/에러 데이터를 `useState`로 관리. **URL 입력폼·로딩 표시·에러 카드는 별도 컴포넌트로 빼지 말고 이 페이지에 인라인**으로 둔다.
- 빈 상태: 중앙 정렬된 URL 입력 + "요약" 버튼(로딩 중 비활성화).
- 제출 시 `POST /api/summarize`. 성공 → `ResultView`로 `SummarizeResponse` 렌더. 실패 → `ApiError.error`(한국어)를 카드로 표시.
- **다운로드 + 저장 경로 안내**: `markdown`을 `Blob`으로 만들어 `{videoId}.md`로 저장(`URL.createObjectURL` + `a[download]`). 응답에 `savedPath`가 있으면 "저장됨: {savedPath}"를 보조 텍스트로 함께 표시한다.

### 스타일 (UI_GUIDE 준수)
- 라이트 테마: 페이지 `#fafafa`, 카드 `bg-white border border-neutral-200 rounded-lg`.
- 검증 결과에만 시맨틱 색. 그 외 무채색(neutral). Primary 버튼 `bg-neutral-900 text-white`.
- 레이아웃 `max-w-3xl`, 좌측 정렬(빈 상태 히어로 입력만 중앙 허용).
- 결과 나타날 때 fade-in(0.3s)만. 그 외 애니메이션 금지.

## Acceptance Criteria

```bash
npm run build      # 빌드 성공
npm run lint       # 통과
npx vitest run     # 기존 테스트 계속 통과
```

## 검증 절차

1. 위 AC 실행.
2. UI_GUIDE 체크리스트: 라이트 테마인가? 검증 배지 색이 verdict와 맞는가? AI 슬롭 안티패턴을 하나도 안 썼는가? `max-w-3xl` 좌측 정렬인가? **원본 MD 텍스트가 화면에 노출되지 않는가**(렌더된 요약만)?
3. (가능하면) `npm run dev`로 실제 URL을 넣어 요약→MD 다운로드 흐름을 한 번 확인. 단, `.env.local`에 키가 없으면 실제 호출은 실패할 수 있으므로 그 경우 빌드/린트 통과로 갈음하고 `completed` 처리하되 summary에 "런타임 확인은 키 필요"를 남긴다.
4. `phases/0-mvp/index.json`의 step 5 업데이트.

## 금지사항

- 원본 MD 텍스트를 화면에 표시하지 마라(`<pre>` 미리보기 금지). 이유: MD는 다운로드/폴더 저장용 아티팩트이고, 화면에는 렌더된 요약만 보여준다.
- 클라이언트에서 유튜브/Anthropic을 직접 호출하지 마라. 이유: 키 노출·CORS. 반드시 `/api/summarize`를 거쳐라.
- UI_GUIDE의 AI 슬롭 안티패턴(backdrop-blur, gradient-text, 보라/인디고, 네온 글로우, 배경 gradient orb, 균일 rounded-2xl 남발)을 쓰지 마라. 이유: 명시적 금지 사항이다.
- 새 API 라우트나 서비스 로직을 만들지 마라. 이유: 이 step은 표현 계층만 담당한다.
- 폼/로딩/에러를 각각 별도 컴포넌트로 과분리하지 마라. 이유: MVP 단순화(컴포넌트는 VerificationBadge·ResultView 2개까지).
- 기존 테스트를 깨뜨리지 마라.
