# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (기술 스택, 아키텍처 규칙, 환경변수, 명령어)
- `/docs/ARCHITECTURE.md` (디렉토리 구조)
- `/docs/ADR.md` (기술 결정)
- `/.env.example` (필요한 환경변수 목록)

## 작업

Next.js 15 프로젝트를 **수동으로 스캐폴드**한다. 리포지토리 루트에 이미 `CLAUDE.md`, `docs/`, `scripts/`, `phases/`, `.gitignore`, `.env.local`, `.env.example`이 존재하므로 `create-next-app`은 `.gitignore` 충돌로 실패한다. 따라서 `create-next-app`을 쓰지 말고 아래 파일들을 직접 작성한 뒤 `npm install` 하라.

생성/구성할 것:

1. `package.json`
   - `scripts`: `dev`(next dev), `build`(next build), `start`(next start), `lint`(next lint), `test`(vitest run)
   - dependencies: `next@^15`, `react@^19`, `react-dom@^19`, `@anthropic-ai/sdk`, `youtube-transcript`
   - devDependencies: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `eslint-config-next`, `vitest`
2. `tsconfig.json` — strict mode, `paths`에 `"@/*": ["./src/*"]` 별칭, `jsx: "preserve"`, moduleResolution `bundler`.
3. `next.config.mjs` — 최소 설정.
4. `postcss.config.mjs`, `tailwind.config.ts` — `content`에 `./src/**/*.{ts,tsx}` 포함.
5. `src/app/globals.css` — Tailwind 지시어(`@tailwind base; @tailwind components; @tailwind utilities;`).
6. `src/app/layout.tsx` — `globals.css` import, 한국어 `<html lang="ko">`, 기본 메타데이터(title "TubeWiki").
7. `src/app/page.tsx` — 임시 플레이스홀더(예: "TubeWiki" 제목). 실제 UI는 step 5에서 만든다.
8. `.eslintrc.json` — `extends: "next/core-web-vitals"`.
9. `vitest.config.ts` — `test.environment: "node"`, `resolve.alias`에 `@` → `./src` 별칭(services/lib 테스트가 `@/...` import를 해석하도록).
10. 빈 레이어 디렉토리 확보: `src/components/`, `src/types/`, `src/lib/`, `src/services/` (각각 `.gitkeep` 또는 이후 step에서 파일 생성).
11. `src/lib/sanity.test.ts` — vitest가 동작함을 증명하는 사소한 테스트 1개(예: `expect(1 + 1).toBe(2)`).

그 후 `npm install`을 실행해 의존성을 설치하라.

## Acceptance Criteria

```bash
npm run build      # Next.js 프로덕션 빌드 성공, 타입 에러 없음
npm run lint       # ESLint 통과
npx vitest run     # sanity 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `src/` 하위에 `app/`, `components/`, `types/`, `lib/`, `services/`가 존재하는가?
   - `tsconfig.json`이 strict mode이고 `@/*` 별칭이 있는가?
   - 비밀 키를 코드에 하드코딩하지 않았는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(생성된 설정 파일/디렉토리 명시)"`
   - 3회 시도 실패 → `"status": "error"`, `"error_message"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason"` 후 중단

## 금지사항

- `create-next-app`을 실행하지 마라. 이유: 기존 `.gitignore` 등과 충돌해 실패하고, `-p` 비대화형 세션에서 프롬프트로 멈춘다.
- 실제 UI/비즈니스 로직을 만들지 마라. 이유: 이 step은 스캐폴드만 담당한다(page.tsx는 플레이스홀더).
- `.env.local`을 수정하거나 커밋하지 마라. 이유: 사용자의 실제 키가 담기는 파일이고 gitignore 대상이다.
- 기존 테스트를 깨뜨리지 마라.
