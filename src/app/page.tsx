"use client";

import { useState } from "react";
import type { ApiError, SummarizeResponse } from "@/types";
import { ResultView } from "@/components/ResultView";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const loading = status === "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || loading) return;

    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const err = (await res.json()) as ApiError;
        setErrorMsg(err.error ?? "요약 중 오류가 발생했습니다");
        setStatus("error");
        return;
      }
      const data = (await res.json()) as SummarizeResponse;
      setResult(data);
      setStatus("success");
    } catch {
      setErrorMsg("요약 중 오류가 발생했습니다");
      setStatus("error");
    }
  }

  // markdown을 Blob으로 만들어 {videoId}.md로 다운로드한다.
  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${result.metadata.videoId}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* 결과가 없으면 히어로(중앙 정렬), 있으면 좌측 정렬 헤더 */}
      <div
        className={
          result ? "" : "flex min-h-[60vh] flex-col justify-center text-center"
        }
      >
        <h1 className="text-3xl font-semibold text-neutral-900">TubeWiki</h1>
        <p className="mt-2 text-[15px] text-neutral-500">
          YouTube 링크 하나로 영상 전체를 구조적으로 요약하고, 제목·썸네일이 실제
          내용과 맞는지 검증합니다.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={loading}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-left text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="shrink-0 rounded-lg bg-neutral-900 px-5 py-3 text-[15px] text-white hover:bg-neutral-800 disabled:opacity-40"
          >
            {loading ? "요약 중…" : "요약"}
          </button>
        </form>
      </div>

      {loading && (
        <p className="mt-8 text-[15px] text-neutral-500">
          자막과 메타데이터를 수집하고 요약하는 중입니다… 최대 1분 정도 걸릴 수
          있습니다.
        </p>
      )}

      {status === "error" && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-[15px] text-red-700">
          {errorMsg}
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-10 animate-fade-in space-y-8">
          <ResultView metadata={result.metadata} result={result.result} />
          <div className="space-y-1 border-t border-neutral-200 pt-6">
            <button
              onClick={handleDownload}
              className="rounded-lg bg-neutral-900 px-5 py-3 text-[15px] text-white hover:bg-neutral-800"
            >
              Markdown 다운로드
            </button>
            {result.savedPath && (
              <p className="text-sm text-neutral-500">
                저장됨: {result.savedPath}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
