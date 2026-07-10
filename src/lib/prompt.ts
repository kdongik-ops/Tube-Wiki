import type { VideoMetadata, TranscriptSegment } from "@/types";

// 자막이 매우 길어 토큰 한도를 넘길 수 있으므로 안전하게 잘라낼 상한(문자 수).
const MAX_TRANSCRIPT_CHARS = 100_000;

// 초 → "H:MM:SS" 또는 "M:SS" 표기.
function formatTimestamp(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const SYSTEM = `당신은 YouTube 영상의 자막과 메타데이터를 분석하여, LLM 지식 위키의 소스로 쓸 정보 밀도 높은 한국어 요약을 생성하는 전문 분석가입니다.

다음 규칙을 반드시 지키세요.

1. 언어: 영상의 원어와 무관하게 모든 출력 텍스트는 반드시 한국어로 작성합니다.
2. 과잉 압축 금지: 전체 흐름을 파악할 수 있도록 각 섹션(sections)을 충분히 상세하게 작성합니다. 한 줄 요약으로 끝내지 말고 근거·전개·세부 내용을 담으세요.
3. 제목·썸네일 검증(verification): 제목이 약속하거나 암시하는 바(titleClaim)와 영상이 실제로 다루는 내용(actualContent)을 비교해 판정(verdict)과 근거(rationale)를 채웁니다. verdict는 "match"(일치) / "partial"(부분일치) / "mismatch"(불일치·낚시) 중 하나여야 하며, 낚시(제목과 내용 불일치)를 명확히 드러내세요.
4. 결론 정렬: conclusion은 제목·썸네일이 기대하게 만든 질문에 대해 영상이 실제로 내놓은 답으로 채웁니다.
5. 정보 밀도: 인용·수치(quotes), 인물·제품·기업(entities), 키워드(keywords)를 최대한 보존합니다.
6. 출력 형식: 오직 아래 스키마를 따르는 JSON 객체 하나만 출력합니다. 코드펜스(\`\`\`)·설명·머리말·꼬리말을 절대 붙이지 마세요.

JSON 스키마:
{
  "tldr": string,               // 한 줄 요약
  "conclusion": string,         // 영상이 실제로 도달한 핵심 결론
  "overview": string,           // 전체 흐름 개요
  "sections": [                 // 섹션별 상세(과잉 압축 금지)
    { "heading": string, "timestamp"?: string, "content": string }
  ],
  "keyPoints": string[],        // 핵심 포인트
  "quotes": string[],           // 주요 인용/수치
  "entities": string[],         // 언급된 인물/제품/기업/링크
  "keywords": string[],         // 키워드/태그
  "verification": {
    "titleClaim": string,
    "actualContent": string,
    "verdict": "match" | "partial" | "mismatch",
    "rationale": string
  }
}`;

// 요약+검증을 지시하는 프롬프트(system, user)를 조립한다. 순수 함수.
export function buildSummaryPrompt(
  metadata: VideoMetadata,
  transcript: TranscriptSegment[],
): { system: string; user: string } {
  const lines = transcript.map(
    (seg) => `[${formatTimestamp(seg.offset)}] ${seg.text}`,
  );
  let transcriptText = lines.join("\n");
  let truncated = false;
  if (transcriptText.length > MAX_TRANSCRIPT_CHARS) {
    transcriptText = transcriptText.slice(0, MAX_TRANSCRIPT_CHARS);
    truncated = true;
  }

  const metaLines = [
    `- 제목: ${metadata.title}`,
    `- 채널: ${metadata.channel}`,
  ];
  if (metadata.durationSec !== undefined) {
    metaLines.push(`- 길이: ${formatTimestamp(metadata.durationSec)}`);
  }
  if (metadata.publishedAt) {
    metaLines.push(`- 게시일: ${metadata.publishedAt}`);
  }
  if (metadata.description) {
    metaLines.push(`- 설명: ${metadata.description}`);
  }
  if (metadata.tags && metadata.tags.length > 0) {
    metaLines.push(`- 태그: ${metadata.tags.join(", ")}`);
  }

  const truncationNote = truncated
    ? "\n\n※ 주의: 자막이 매우 길어 뒷부분이 잘렸습니다. 요약이 영상 후반부를 놓쳤을 수 있음을 감안하세요.\n"
    : "";

  const user = `아래 YouTube 영상을 스키마에 맞춰 요약·검증하세요. 반드시 JSON만 출력합니다.

[영상 메타데이터]
${metaLines.join("\n")}

[자막]
${transcriptText}${truncationNote}`;

  return { system: SYSTEM, user };
}
