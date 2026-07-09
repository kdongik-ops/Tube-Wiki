# Architecture Decision Records

## 철학
MVP 속도 최우선. 외부 의존성과 인프라를 최소화한다. 작동하는 최소 구현을 선택하되, 이 앱의 두 가지 차별점 — (1) 과잉 압축하지 않는 요약, (2) 제목/썸네일 vs 내용 검증 — 의 품질은 타협하지 않는다.

---

### ADR-001: Next.js 15 App Router
**결정**: Next.js 15 App Router + TypeScript(strict) + Tailwind로 웹앱을 만든다.
**이유**: 페이지와 서버 API 라우트를 한 코드베이스에서 다룰 수 있어 외부 API 키를 서버에 숨기기 쉽다. 배포가 단순하다.
**트레이드오프**: 러닝 커브. 순수 정적 사이트보다 무겁다.

### ADR-002: 자막은 youtube-transcript, 메타데이터는 YouTube Data API v3(필수)
**결정**: 대본은 `youtube-transcript` 패키지로 자막을 가져온다(키 불필요). 메타데이터는 YouTube Data API v3(`videos.list`, part=snippet,contentDetails,statistics)로 제목·채널·썸네일에 더해 게시일·길이·조회수·설명·태그까지 수집한다. `YOUTUBE_API_KEY`는 필수이며, 없으면 명확한 설정 에러로 안내한다. oEmbed는 사용하지 않는다(단일 경로).
**이유**: MD가 LLM 위키 소스로 쓰이므로 정보 밀도가 최우선 가치다. Data API를 단일 경로로 고정하면 코드도 단순하고(분기 없음) 풍부한 메타데이터가 항상 보장된다.
**트레이드오프**: 사용자가 Google Cloud에서 YouTube Data API v3를 켜고 키를 발급해야 한다. 키 없이는 동작하지 않는다. 일일 쿼터(기본 10,000 units) 제한이 있으나 videos.list는 호출당 1 unit이라 사실상 충분. 자막이 아예 없는 영상은 처리 불가(음성 인식 폴백은 MVP 제외).

### ADR-003: 요약 LLM은 Claude API, 서버에서만 호출
**결정**: 요약·검증은 Anthropic Claude API(`@anthropic-ai/sdk`)로 처리한다. 기본 모델은 `claude-sonnet-5`, 환경변수 `SUMMARY_MODEL`로 오버라이드한다. 호출은 서버(`services/claude.ts` + api route)에서만 한다.
**이유**: 긴 자막의 구조적 요약과 뉘앙스 있는 제목-내용 검증에 품질이 좋고, 비용/속도 균형이 맞다. 키를 클라이언트에 노출하지 않는다.
**트레이드오프**: API 비용 발생. 네트워크·모델 응답에 의존.

### ADR-004: MVP는 무저장(원샷)
**결정**: 요약 결과를 저장하지 않는다. 입력 → 요약 표시 → MD 다운로드로 끝낸다. DB를 두지 않는다.
**이유**: 범위를 최소화해 빠르게 작동하는 제품에 도달한다. 결과물(MD)은 사용자가 파일로 소유한다.
**트레이드오프**: 과거 요약 재열람/검색 불가. 히스토리는 후속 과제로 남긴다.

### ADR-005: 생성된 MD를 서버 파일로도 저장(best-effort)
**결정**: 무저장(원샷) 원칙은 유지하되, 생성된 위키 MD를 `WIKI_OUTPUT_DIR`(기본 `./output`)에 `{videoId}.md`로 저장한다. 저장은 **best-effort** — 실패해도 요청은 성공 처리하고 응답의 `savedPath`만 비운다. API 라우트에 인라인(`fs/promises`, `mkdir -p`)으로 처리하며 별도 서비스로 분리하지 않는다.
**이유**: 사용자가 결과를 다운로드로 소유하는 것에 더해, 로컬 위키 폴더에 자동 축적되면 LLM 위키 소스로 바로 쓰기 편하다. DB 없이 파일시스템만 쓰므로 인프라 부담이 없다.
**트레이드오프**: 읽기전용 FS(일부 서버리스) 환경에선 저장이 실패할 수 있으나 best-effort라 앱은 계속 동작한다. 파일명은 `{videoId}.md` 고정이라 같은 영상 재요약 시 덮어쓴다(슬러그/충돌 관리 안 함 — MVP 단순화).
