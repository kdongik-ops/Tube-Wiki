import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type {
  ApiError,
  ApiErrorCode,
  SummarizeRequest,
  SummarizeResponse,
} from "@/types";
import { extractVideoId } from "@/lib/youtube-url";
import { fetchMetadata, fetchTranscript } from "@/services/youtube";
import { summarize } from "@/services/claude";
import { buildMarkdown } from "@/lib/markdown";

// youtube-transcript / Anthropic SDK가 edge에서 동작하지 않으므로 Node 런타임 고정.
export const runtime = "nodejs";

const ERROR_MESSAGE: Record<ApiErrorCode, string> = {
  INVALID_URL: "유효한 YouTube URL이 아닙니다",
  NO_TRANSCRIPT: "이 영상에는 자막이 없어 요약할 수 없습니다",
  INTERNAL: "요약 중 오류가 발생했습니다",
};

const ERROR_STATUS: Record<ApiErrorCode, number> = {
  INVALID_URL: 400,
  NO_TRANSCRIPT: 422,
  INTERNAL: 500,
};

// 내부 메시지/스택을 노출하지 않고 사용자용 한국어 ApiError로 응답한다.
function errorResponse(code: ApiErrorCode): Response {
  const body: ApiError = { error: ERROR_MESSAGE[code], code };
  return Response.json(body, { status: ERROR_STATUS[code] });
}

// 서비스가 던진 에러가 자막 없음(NO_TRANSCRIPT)인지 code로 판별한다.
function isNoTranscript(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "NO_TRANSCRIPT"
  );
}

export async function POST(req: Request): Promise<Response> {
  // 1. body에서 { url } 파싱.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_URL");
  }
  const url = (body as Partial<SummarizeRequest> | null)?.url;
  if (typeof url !== "string") {
    return errorResponse("INVALID_URL");
  }

  // 2. videoId 추출/검증.
  const videoId = extractVideoId(url);
  if (!videoId) {
    return errorResponse("INVALID_URL");
  }

  try {
    // 3. 메타데이터 + 자막(필수) 수집.
    const [metadata, transcript] = await Promise.all([
      fetchMetadata(videoId),
      fetchTranscript(videoId),
    ]);

    // 4. 요약.
    const result = await summarize(metadata, transcript);

    // 5. 위키용 Markdown 렌더.
    const markdown = buildMarkdown(metadata, result);

    // 6. MD 저장(best-effort, 인라인 — 실패해도 삼키고 200).
    let savedPath: string | undefined;
    try {
      const outputDir = process.env.WIKI_OUTPUT_DIR ?? "./output";
      await mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, `${videoId}.md`);
      await writeFile(filePath, markdown, "utf8");
      savedPath = filePath;
    } catch {
      // 저장 실패는 무시한다(ADR-005). savedPath는 비운 채 응답은 정상.
    }

    // 7. 200 SummarizeResponse.
    const payload: SummarizeResponse = { metadata, result, markdown, savedPath };
    return Response.json(payload, { status: 200 });
  } catch (err) {
    if (isNoTranscript(err)) {
      return errorResponse("NO_TRANSCRIPT");
    }
    return errorResponse("INTERNAL");
  }
}
