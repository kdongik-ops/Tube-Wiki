# 프로젝트: TubeWiki — YouTube 요약 위키 생성기

## 기술 스택
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`) — 요약 LLM
- `youtube-transcript` — 자막 수집 / YouTube Data API v3 — 메타데이터(제목·채널·썸네일·게시일·조회수·설명·태그·길이)
- Vitest — 테스트 러너

## 아키텍처 규칙
- CRITICAL: 외부 API 호출(YouTube, Anthropic)은 반드시 `src/app/api/` 라우트 핸들러 또는 `src/services/`에서만 처리한다. 클라이언트 컴포넌트에서 직접 호출하지 마라.
- CRITICAL: `ANTHROPIC_API_KEY` 등 비밀 키는 서버에서만 접근한다. `NEXT_PUBLIC_` 접두사로 클라이언트에 노출하지 마라.
- 환경변수: `ANTHROPIC_API_KEY`(필수), `YOUTUBE_API_KEY`(필수 — YouTube Data API v3로 게시일·조회수·설명·태그·길이 등 풍부한 메타데이터 수집), `SUMMARY_MODEL`(선택, 기본 `claude-sonnet-5`), `WIKI_OUTPUT_DIR`(선택, 기본 `./output` — 생성된 MD를 저장하는 폴더). 값은 `.env.local`에서 읽는다.
- 컴포넌트는 `src/components/`, 타입은 `src/types/`, 외부 API 래퍼는 `src/services/`, 순수 유틸/헬퍼는 `src/lib/`에 분리한다.
- 요약 LLM 모델은 `claude-sonnet-5`를 기본으로 하고 환경변수(`SUMMARY_MODEL`)로 오버라이드 가능하게 한다.

## 개발 프로세스
- 핵심 순수 함수(URL 파싱, 프롬프트 조립, Markdown 빌드 등)는 테스트를 먼저/함께 작성한다. 외부 I/O(서비스·API 라우트)는 목킹 유닛테스트를 강제하지 않는다 (MVP 단순화).
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)

## 명령어
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # 테스트 (vitest, 1회 실행: vitest run)
