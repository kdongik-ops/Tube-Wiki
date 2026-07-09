# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다. 마케팅 페이지가 아니라 매일 쓰는 유틸리티.
2. 콘텐츠가 주인공. 긴 요약 텍스트가 편하게 읽히도록 여백과 가독성 우선.
3. 검증 결과(일치/부분일치/불일치)는 한눈에. 색과 라벨로 즉시 판단 가능하게.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

## 색상 (라이트 테마)
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | #fafafa (neutral-50) |
| 카드 | #ffffff |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | text-neutral-900 |
| 본문 | text-neutral-700 |
| 보조 | text-neutral-500 |
| 비활성 | text-neutral-400 |

### 데이터/시맨틱 색상 — 제목·내용 검증 결과에만 사용
| 용도 | 값 |
|------|------|
| 일치 | #16a34a (green-600) |
| 부분일치 | #d97706 (amber-600) |
| 불일치(낚시) | #dc2626 (red-600) |
| 중립/기본 | #525252 (neutral-600) |

## 컴포넌트
### 카드
```
rounded-lg border border-neutral-200 bg-white p-6
```

### 버튼
```
Primary: rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40
Text:    text-neutral-500 hover:text-neutral-900
```

### 입력 필드
```
rounded-lg border border-neutral-300 bg-white px-4 py-3 focus:border-neutral-900 focus:outline-none
```

### 검증 배지
```
초록/주황/빨강 텍스트 + 좌측 색 dot. 배경 채우기는 옅게(예: bg-green-50)까지만. 글로우/그라데이션 금지.
```

## 레이아웃
- 전체 너비: max-w-3xl (긴 텍스트 가독성 우선)
- 정렬: 좌측 정렬 기본. 중앙 정렬은 히어로 입력 영역(빈 상태)만 허용.
- 간격: gap-3~4, 섹션 간 space-y-6~8

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 | text-3xl font-semibold text-neutral-900 |
| 섹션 제목 | text-sm font-medium text-neutral-500 uppercase tracking-wide |
| 본문 | text-[15px] text-neutral-700 leading-relaxed |

## 애니메이션
- fade-in (0.3s) — 결과가 나타날 때만
- 로딩 인디케이터(단순 스피너 또는 진행 텍스트)
- 그 외 모든 애니메이션 금지

## 아이콘
- SVG 인라인, strokeWidth 1.5
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다
