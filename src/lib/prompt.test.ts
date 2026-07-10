import { describe, expect, it } from "vitest";
import { buildSummaryPrompt } from "./prompt";
import type { VideoMetadata, TranscriptSegment } from "@/types";

const metadata: VideoMetadata = {
  videoId: "dQw4w9WgXcQ",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "테스트 영상 제목",
  channel: "테스트 채널",
  thumbnailUrl: "https://img/large.jpg",
  durationSec: 125,
};

const transcript: TranscriptSegment[] = [
  { text: "첫 번째 자막입니다.", offset: 0, duration: 3 },
  { text: "두 번째 자막입니다.", offset: 3, duration: 4 },
];

describe("buildSummaryPrompt", () => {
  const { system, user } = buildSummaryPrompt(metadata, transcript);
  const combined = `${system}\n${user}`;

  it("모든 출력을 한국어로 강제한다", () => {
    expect(combined).toContain("한국어");
  });

  it("JSON만 출력하도록 지시한다", () => {
    expect(combined).toContain("JSON");
  });

  it("제목·내용 검증(verification)을 요구한다", () => {
    expect(system).toContain("verification");
    expect(system).toContain("titleClaim");
    expect(system).toContain("mismatch");
  });

  it("과잉 압축을 금지한다", () => {
    expect(system).toContain("과잉 압축");
  });

  it("user 프롬프트에 메타데이터와 자막을 담는다", () => {
    expect(user).toContain(metadata.title);
    expect(user).toContain(metadata.channel);
    expect(user).toContain("첫 번째 자막입니다.");
  });
});
