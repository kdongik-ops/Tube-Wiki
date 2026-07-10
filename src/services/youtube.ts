import type { VideoMetadata, TranscriptSegment } from "@/types";
import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
} from "youtube-transcript";

// 자막 없음 전용 에러. 라우트(step 4)가 code로 422를 구분한다.
export class NoTranscriptError extends Error {
  readonly code = "NO_TRANSCRIPT";
  constructor(message = "이 영상에는 자막이 없어 요약할 수 없습니다.") {
    super(message);
    this.name = "NoTranscriptError";
  }
}

interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

interface YouTubeVideoItem {
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    description?: string;
    tags?: string[];
    thumbnails?: Record<string, YouTubeThumbnail>;
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
}

// 썸네일 맵에서 가장 큰(너비 기준) 것을 고른다.
function pickLargestThumbnail(
  thumbnails?: Record<string, YouTubeThumbnail>,
): string {
  const list = thumbnails ? Object.values(thumbnails) : [];
  if (list.length === 0) return "";
  const largest = list.reduce((best, cur) =>
    (cur.width ?? 0) > (best.width ?? 0) ? cur : best,
  );
  return largest.url ?? "";
}

// ISO8601 duration(PT1H2M3S)을 초로 변환. 파싱 실패 시 undefined.
function parseIsoDuration(iso?: string): number | undefined {
  if (!iso) return undefined;
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return undefined;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}

// YouTube Data API v3(videos.list)로 메타데이터 수집. 실패 시 예외.
export async function fetchMetadata(videoId: string): Promise<VideoMetadata> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY가 설정되지 않았습니다.");
  }

  const endpoint =
    "https://www.googleapis.com/youtube/v3/videos" +
    `?part=snippet,contentDetails,statistics&id=${videoId}&key=${key}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`YouTube Data API 요청 실패: ${res.status}`);
  }

  const data = (await res.json()) as YouTubeVideosResponse;
  const item = data.items?.[0];
  if (!item) {
    throw new Error(`영상을 찾을 수 없습니다: ${videoId}`);
  }

  const snippet = item.snippet;
  const viewCountRaw = item.statistics?.viewCount;

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: snippet?.title ?? "",
    channel: snippet?.channelTitle ?? "",
    thumbnailUrl: pickLargestThumbnail(snippet?.thumbnails),
    publishedAt: snippet?.publishedAt,
    durationSec: parseIsoDuration(item.contentDetails?.duration),
    viewCount: viewCountRaw !== undefined ? Number(viewCountRaw) : undefined,
    description: snippet?.description,
    tags: snippet?.tags,
  };
}

// youtube-transcript로 자막 수집. 자막 없으면 NO_TRANSCRIPT 에러.
export async function fetchTranscript(
  videoId: string,
): Promise<TranscriptSegment[]> {
  let segments;
  try {
    segments = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err) {
    if (
      err instanceof YoutubeTranscriptDisabledError ||
      err instanceof YoutubeTranscriptNotAvailableError ||
      err instanceof YoutubeTranscriptNotAvailableLanguageError
    ) {
      throw new NoTranscriptError();
    }
    throw err;
  }

  if (segments.length === 0) {
    throw new NoTranscriptError();
  }

  return segments.map((s) => ({
    text: s.text,
    offset: s.offset,
    duration: s.duration,
  }));
}
