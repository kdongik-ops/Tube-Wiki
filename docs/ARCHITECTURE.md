# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── page.tsx              # 메인 페이지 (URL 입력 + 결과 표시)
│   ├── layout.tsx            # 루트 레이아웃
│   └── api/
│       └── summarize/
│           └── route.ts      # POST: URL → 요약 결과 오케스트레이션
├── components/               # UI 컴포넌트 (입력폼, 결과, 검증 배지 등)
├── types/                    # TypeScript 타입 정의 (도메인 모델)
├── lib/                      # 순수 유틸 (URL 파싱, MD 빌더, 프롬프트 빌더)
└── services/                 # 외부 API 래퍼 (youtube, claude)
```

## 패턴
- Server Components 기본. 인터랙션이 필요한 곳(입력폼, 결과 상태)만 Client Component(`"use client"`).
- 외부 API 호출은 서버 전용: `services/`(순수 래퍼) + `app/api/summarize/route.ts`(오케스트레이션).
- `services/`는 네트워크 I/O만, `lib/`는 순수 함수(테스트 용이)로 분리한다.

## 데이터 흐름
```
사용자 URL 입력
  → Client Component (page.tsx)
  → POST /api/summarize
      → lib/youtube-url.ts        : URL에서 videoId 추출/검증
      → services/youtube.ts       : 메타데이터(YouTube Data API v3) + youtube-transcript 자막
      → lib/prompt.ts             : 요약/검증 프롬프트 조립
      → services/claude.ts        : Anthropic 호출 → 구조적 결과(SummaryResult)
      → lib/markdown.ts           : 결과 → 위키용 MD 문자열
      → WIKI_OUTPUT_DIR/{videoId}.md 저장 (best-effort, 실패해도 응답은 성공)
  → JSON 응답 { metadata, result, markdown, savedPath? }
  → Client: 요약/검증 렌더링 + MD 다운로드
```

## 상태 관리
- 서버 상태 없음(무저장, 원샷). 요청마다 stateless 처리.
- 클라이언트 상태는 `useState`로 관리: idle / loading / success / error 4단계 + 결과 데이터.
- 전역 상태 라이브러리 도입하지 않는다 (MVP 범위 초과).
