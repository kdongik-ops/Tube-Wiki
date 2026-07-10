const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

// 다양한 YouTube URL에서 11자리 videoId를 추출한다. 실패 시 null.
export function extractVideoId(input: string): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let candidate: string | null = null;

  if (host === "youtu.be") {
    // https://youtu.be/ID
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com") {
    if (url.pathname === "/watch") {
      // https://www.youtube.com/watch?v=ID (추가 쿼리 포함)
      candidate = url.searchParams.get("v");
    } else {
      // https://www.youtube.com/shorts/ID, /embed/ID
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") {
        candidate = parts[1] ?? null;
      }
    }
  }

  return candidate && VIDEO_ID_RE.test(candidate) ? candidate : null;
}
