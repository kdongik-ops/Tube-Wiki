# TubeWiki 로컬 실행 가이드

Claude 없이 로컬 터미널에서 앱을 실행하는 절차. **권장 방식은 프로덕션 모드(`build` → `start`)** 입니다(개발 모드의 `.next` 캐시 오류를 피할 수 있음).

## 요구사항

- Node.js 18.18 이상 (`node --version`)
- YouTube Data API v3 키, Anthropic API 키(**크레딧 잔액 필요** — 무료 티어 없음)

## 최초 1회 준비

```powershell
cd D:\Agent\harness_framework
npm install            # 이미 node_modules 있으면 생략 가능
```

프로젝트 루트에 `.env.local` 파일을 만들고 키를 넣는다:

```
ANTHROPIC_API_KEY=sk-ant-...     # 필수 (요약). console.anthropic.com에서 크레딧 충전 필요
YOUTUBE_API_KEY=AIza...          # 필수 (메타데이터)
SUMMARY_MODEL=claude-sonnet-5    # 선택 (기본값)
WIKI_OUTPUT_DIR=./output         # 선택 (요약 .md 저장 폴더, 기본 ./output)
```

> `.env.local`은 서버에서만 읽히며 클라이언트에 노출되지 않는다.

## 실행 (프로덕션 모드 — 권장)

```powershell
npm run build     # 프로덕션 빌드 (1~2분)
npm run start     # 서버 시작 → http://localhost:3000
```

- 브라우저에서 **http://localhost:3000** 접속 → YouTube URL 입력 → 요약.
- 결과 위키는 화면에 표시되고 `output/{videoId}.md`로 저장된다.
- **종료**: 터미널에서 `Ctrl + C`. 서버를 유지하려면 그 터미널 창을 닫지 않는다.

## 코드 수정 후 반영

프로덕션 서버는 미리 빌드된 결과만 서빙하므로 코드 변경 시 재빌드가 필요하다:

```powershell
# Ctrl+C 로 종료 후
npm run build
npm run start
```

`.env.local`의 키만 바꿨다면 `build` 없이 `npm run start`만 다시 하면 된다.

## (선택) 개발 모드

핫리로드가 필요할 때만:

```powershell
npm run dev
```

라우트를 여러 개 오가면 `.next` 청크 오류(500, `Cannot find module './xxx.js'`)가 날 수 있다. 그때는:

```powershell
# Ctrl+C 후
Remove-Item -Recurse -Force .next
npm run dev
```

단순 실행이 목적이면 개발 모드 대신 프로덕션 모드를 쓴다.

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| 포트 3000이 사용 중 | 다른 서버가 점유. `Get-NetTCPConnection -LocalPort 3000 -State Listen` 로 PID 확인 후 `Stop-Process -Id <pid> -Force`. 또는 자동으로 3001로 뜸 |
| 500 + `Cannot find module './xxx.js'` | 개발 모드 `.next` 오염. `Remove-Item -Recurse -Force .next` 후 재시작(프로덕션 권장) |
| "유효한 YouTube URL이 아닙니다" (400) | URL 형식 오류. `watch?v=`, `youtu.be/`, `shorts/`, `embed/` 지원 |
| "이 영상에는 자막이 없어…" (422) | 자막이 없는 영상. 자막(대사) 있는 영상 사용 |
| "요약 중 오류가 발생했습니다" (500) | 서버 로그에서 실제 원인 확인. 흔한 원인: ① Anthropic **크레딧 부족** → 충전, ② 노래/뮤직비디오 → 저작권 가사가 콘텐츠 필터에 걸림(말하기 위주 영상 사용), ③ 매우 긴 영상 → 요약이 max_tokens 초과로 잘림 |

## 명령어 요약

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버(핫리로드) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint |
| `npm run test` | 테스트(vitest) |
