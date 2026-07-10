import Anthropic from "@anthropic-ai/sdk";
import type {
  SummaryResult,
  TitleVerification,
  TranscriptSegment,
  Verdict,
  VideoMetadata,
} from "@/types";
import { buildSummaryPrompt } from "@/lib/prompt";

// 응답 content 블록들에서 텍스트만 이어붙인다.
function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

// 코드펜스로 감싸져 오면 벗겨내고, 앞뒤 잡소리가 있으면 첫 '{'~마지막 '}'만 취한다.
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  const body = fence ? fence[1].trim() : trimmed;

  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("요약 응답에서 JSON을 찾을 수 없습니다.");
  }
  return body.slice(start, end + 1);
}

function coerceVerdict(v: unknown): Verdict {
  return v === "match" || v === "partial" || v === "mismatch" ? v : "partial";
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

// 파싱된 객체가 SummaryResult 필수 필드를 갖췄는지 최소 검증 후 정규화한다.
function toSummaryResult(raw: string): SummaryResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("요약 응답 JSON 파싱에 실패했습니다.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("요약 응답이 JSON 객체가 아닙니다.");
  }
  const obj = parsed as Record<string, unknown>;

  if (
    typeof obj.tldr !== "string" ||
    typeof obj.overview !== "string" ||
    typeof obj.conclusion !== "string"
  ) {
    throw new Error("요약 응답에 필수 텍스트 필드가 없습니다.");
  }
  if (!obj.verification || typeof obj.verification !== "object") {
    throw new Error("요약 응답에 verification 필드가 없습니다.");
  }

  const ver = obj.verification as Record<string, unknown>;
  const verification: TitleVerification = {
    titleClaim: asString(ver.titleClaim),
    actualContent: asString(ver.actualContent),
    verdict: coerceVerdict(ver.verdict),
    rationale: asString(ver.rationale),
  };

  const sections = Array.isArray(obj.sections)
    ? obj.sections.map((s) => {
        const sec = (s ?? {}) as Record<string, unknown>;
        return {
          heading: asString(sec.heading),
          timestamp:
            typeof sec.timestamp === "string" ? sec.timestamp : undefined,
          content: asString(sec.content),
        };
      })
    : [];

  return {
    tldr: obj.tldr,
    conclusion: obj.conclusion,
    overview: obj.overview,
    sections,
    keyPoints: asStringArray(obj.keyPoints),
    quotes: asStringArray(obj.quotes),
    entities: asStringArray(obj.entities),
    keywords: asStringArray(obj.keywords),
    verification,
  };
}

// 자막+메타데이터를 Claude로 구조화된 SummaryResult로 변환한다.
export async function summarize(
  metadata: VideoMetadata,
  transcript: TranscriptSegment[],
): Promise<SummaryResult> {
  const client = new Anthropic(); // ANTHROPIC_API_KEY는 SDK가 env에서 읽는다.
  const { system, user } = buildSummaryPrompt(metadata, transcript);

  const message = await client.messages.create({
    model: process.env.SUMMARY_MODEL ?? "claude-sonnet-5",
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: user }],
  });

  const json = extractJson(extractText(message));
  return toSummaryResult(json);
}
