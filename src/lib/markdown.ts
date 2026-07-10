import type { SummaryResult, VideoMetadata, Verdict } from "@/types";

// verdict → 이모지 + 한국어 라벨.
const VERDICT_LABEL: Record<Verdict, string> = {
  match: "✅ 일치",
  partial: "⚠️ 부분일치",
  mismatch: "❌ 불일치(낚시)",
};

// 초 → "H:MM:SS" 또는 "M:SS".
function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// YAML 이중따옴표 스칼라. JSON.stringify가 곧 유효한 YAML 이중따옴표 표기.
function yaml(value: string): string {
  return JSON.stringify(value);
}

function buildFrontMatter(
  metadata: VideoMetadata,
  result: SummaryResult,
): string {
  const lines = [
    "---",
    `title: ${yaml(metadata.title)}`,
    `channel: ${yaml(metadata.channel)}`,
    `url: ${yaml(metadata.url)}`,
    `videoId: ${yaml(metadata.videoId)}`,
  ];
  if (metadata.publishedAt) {
    lines.push(`published: ${yaml(metadata.publishedAt)}`);
  }
  if (metadata.durationSec !== undefined) {
    lines.push(`duration: ${yaml(formatDuration(metadata.durationSec))}`);
  }
  if (metadata.viewCount !== undefined) {
    lines.push(`views: ${metadata.viewCount}`);
  }
  lines.push(`verdict: ${result.verification.verdict}`);
  if (result.keywords.length > 0) {
    lines.push("keywords:");
    for (const kw of result.keywords) {
      lines.push(`  - ${yaml(kw)}`);
    }
  } else {
    lines.push("keywords: []");
  }
  lines.push("---");
  return lines.join("\n");
}

function buildMetaTable(metadata: VideoMetadata): string {
  const rows = [
    ["채널", metadata.channel],
    ["URL", metadata.url],
  ];
  if (metadata.publishedAt) {
    rows.push(["게시일", metadata.publishedAt.slice(0, 10)]);
  }
  if (metadata.durationSec !== undefined) {
    rows.push(["길이", formatDuration(metadata.durationSec)]);
  }
  if (metadata.viewCount !== undefined) {
    rows.push(["조회수", `${metadata.viewCount.toLocaleString("en-US")}회`]);
  }
  return [
    "| 항목 | 값 |",
    "| --- | --- |",
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
  ].join("\n");
}

// 구조화된 결과를 정보 밀도 높은 위키용 Markdown으로 결정론적으로 렌더한다(LLM 호출 없음).
export function buildMarkdown(
  metadata: VideoMetadata,
  result: SummaryResult,
): string {
  const { verification: v } = result;
  const blocks: string[] = [];

  // 1. YAML front matter
  blocks.push(buildFrontMatter(metadata, result));

  // 2. H1 제목
  blocks.push(`# ${metadata.title}`);

  // 3. 메타 정보 표
  blocks.push(buildMetaTable(metadata));

  // 4. TL;DR
  blocks.push(`## TL;DR\n\n${result.tldr}`);

  // 5. 제목·썸네일 검증
  blocks.push(
    [
      "## 제목·썸네일 검증",
      "",
      `**판정:** ${VERDICT_LABEL[v.verdict]}`,
      "",
      "**제목이 약속·암시하는 것**",
      "",
      v.titleClaim,
      "",
      "**실제 내용**",
      "",
      v.actualContent,
      "",
      "**근거**",
      "",
      v.rationale,
    ].join("\n"),
  );

  // 6. 핵심 결론
  blocks.push(`## 핵심 결론\n\n${result.conclusion}`);

  // 7. 전체 개요
  blocks.push(`## 전체 개요\n\n${result.overview}`);

  // 8. 상세 내용
  const detail = ["## 상세 내용"];
  for (const s of result.sections) {
    const prefix = s.timestamp ? `[${s.timestamp}] ` : "";
    detail.push("", `### ${prefix}${s.heading}`, "", s.content);
  }
  blocks.push(detail.join("\n"));

  // 9. 핵심 포인트
  blocks.push(
    ["## 핵심 포인트", "", ...result.keyPoints.map((p) => `- ${p}`)].join("\n"),
  );

  // 10. 주요 인용·수치 (비어있으면 생략)
  if (result.quotes.length > 0) {
    blocks.push(
      ["## 주요 인용·수치", "", ...result.quotes.map((q) => `- ${q}`)].join(
        "\n",
      ),
    );
  }

  // 11. 언급된 인물·제품·기업 (비어있으면 생략)
  if (result.entities.length > 0) {
    blocks.push(
      [
        "## 언급된 인물·제품·기업",
        "",
        ...result.entities.map((e) => `- ${e}`),
      ].join("\n"),
    );
  }

  // 12. 키워드 (비어있으면 생략)
  if (result.keywords.length > 0) {
    const kws = result.keywords.map((k) => `\`${k}\``).join(", ");
    blocks.push(`## 키워드\n\n${kws}`);
  }

  // 13. 원본 링크 각주
  blocks.push(`---\n\n원본 영상: [${metadata.title}](${metadata.url})`);

  return blocks.join("\n\n") + "\n";
}
