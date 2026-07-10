import { describe, expect, it } from "vitest";
import { buildMarkdown } from "./markdown";
import type { SummaryResult, VideoMetadata } from "@/types";

const fullMetadata: VideoMetadata = {
  videoId: "dQw4w9WgXcQ",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "충격적인 AI의 미래",
  channel: "테크 채널",
  thumbnailUrl: "https://img/large.jpg",
  publishedAt: "2026-01-15T09:00:00Z",
  durationSec: 3725, // 1:02:05
  viewCount: 1234567,
  description: "설명",
  tags: ["AI", "미래"],
};

const result: SummaryResult = {
  tldr: "AI가 바꿀 미래를 다룬다.",
  conclusion: "결국 AI는 도구일 뿐이다.",
  overview: "영상 전체 흐름 개요입니다.",
  sections: [
    {
      heading: "도입부",
      timestamp: "0:30",
      content: "도입부 상세 내용입니다.",
    },
    {
      heading: "본론",
      content: "본론 상세 내용입니다.",
    },
  ],
  keyPoints: ["핵심 포인트 하나", "핵심 포인트 둘"],
  quotes: ["인용문 예시"],
  entities: ["OpenAI", "구글"],
  keywords: ["AI", "미래", "기술"],
  verification: {
    titleClaim: "충격적인 미래를 약속한다.",
    actualContent: "일반적인 전망을 다룬다.",
    verdict: "partial",
    rationale: "제목은 자극적이나 내용은 무난하다.",
  },
};

describe("buildMarkdown", () => {
  const md = buildMarkdown(fullMetadata, result);

  it("YAML front matter로 시작한다", () => {
    expect(md.startsWith("---\n")).toBe(true);
    expect(md).toContain(`title: "충격적인 AI의 미래"`);
    expect(md).toContain("verdict: partial");
  });

  it("H1 제목과 메타 표를 포함한다", () => {
    expect(md).toContain("# 충격적인 AI의 미래");
    expect(md).toContain("| 채널 | 테크 채널 |");
    expect(md).toContain("| 게시일 | 2026-01-15 |");
    expect(md).toContain("| 길이 | 1:02:05 |");
    expect(md).toContain("| 조회수 | 1,234,567회 |");
  });

  it("모든 섹션 제목을 포함한다", () => {
    for (const heading of [
      "## TL;DR",
      "## 제목·썸네일 검증",
      "## 핵심 결론",
      "## 전체 개요",
      "## 상세 내용",
      "## 핵심 포인트",
      "## 주요 인용·수치",
      "## 언급된 인물·제품·기업",
      "## 키워드",
    ]) {
      expect(md).toContain(heading);
    }
  });

  it("verdict 라벨(이모지+한국어)을 렌더한다", () => {
    expect(md).toContain("⚠️ 부분일치");
  });

  it("각 section의 heading과 content를 담는다", () => {
    expect(md).toContain("### [0:30] 도입부");
    expect(md).toContain("도입부 상세 내용입니다.");
    expect(md).toContain("### 본론");
    expect(md).toContain("본론 상세 내용입니다.");
  });

  it("keyPoints 항목을 불릿으로 담는다", () => {
    expect(md).toContain("- 핵심 포인트 하나");
    expect(md).toContain("- 핵심 포인트 둘");
  });

  it("키워드를 백틱/쉼표로 렌더한다", () => {
    expect(md).toContain("`AI`, `미래`, `기술`");
  });

  it("원본 링크 각주를 하단에 담는다", () => {
    expect(md).toContain(
      "원본 영상: [충격적인 AI의 미래](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
    );
  });

  it("선택 메타데이터가 없으면 해당 행/섹션을 생략한다", () => {
    const minimalMeta: VideoMetadata = {
      videoId: "dQw4w9WgXcQ",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "제목",
      channel: "채널",
      thumbnailUrl: "https://img/large.jpg",
    };
    const minimalResult: SummaryResult = {
      ...result,
      quotes: [],
      entities: [],
    };
    const minMd = buildMarkdown(minimalMeta, minimalResult);

    // 없는 메타 행은 빠진다
    expect(minMd).not.toContain("게시일");
    expect(minMd).not.toContain("| 길이 |");
    expect(minMd).not.toContain("조회수");
    // 빈 배열 섹션은 통째로 생략된다
    expect(minMd).not.toContain("## 주요 인용·수치");
    expect(minMd).not.toContain("## 언급된 인물·제품·기업");
  });
});
