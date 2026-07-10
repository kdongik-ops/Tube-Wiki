import type { SummaryResult, VideoMetadata } from "@/types";
import { VerificationBadge } from "./VerificationBadge";

// 결과 섹션 공통 래퍼: 무채색 라벨 + 본문.
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

const bodyText = "text-[15px] leading-relaxed text-neutral-700";
const bulletList = `list-disc space-y-1 pl-5 ${bodyText}`;

// 구조화된 요약 결과를 렌더한다(원본 MD는 노출하지 않는다).
export function ResultView({
  metadata,
  result,
}: {
  metadata: VideoMetadata;
  result: SummaryResult;
}) {
  const v = result.verification;

  return (
    <div className="space-y-8">
      {/* 메타 헤더 */}
      <div className="flex gap-4">
        {metadata.thumbnailUrl && (
          // 원격 썸네일(i.ytimg.com) — next/image 원격 도메인 설정을 피해 단순 img 사용.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={metadata.thumbnailUrl}
            alt={metadata.title}
            className="w-40 shrink-0 rounded-lg border border-neutral-200 object-cover"
          />
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {metadata.title}
          </h1>
          <p className="text-sm text-neutral-500">
            {metadata.channel}
            {metadata.publishedAt && ` · ${metadata.publishedAt.slice(0, 10)}`}
            {metadata.viewCount !== undefined &&
              ` · ${metadata.viewCount.toLocaleString("en-US")}회`}
          </p>
        </div>
      </div>

      {/* 제목·썸네일 검증 — 이 앱의 차별점이므로 카드로 강조 */}
      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            제목·썸네일 검증
          </h2>
          <VerificationBadge verdict={v.verdict} />
        </div>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-neutral-500">제목이 약속·암시하는 것</dt>
            <dd className={bodyText}>{v.titleClaim}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">실제 내용</dt>
            <dd className={bodyText}>{v.actualContent}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">근거</dt>
            <dd className={bodyText}>{v.rationale}</dd>
          </div>
        </dl>
      </section>

      <Section title="TL;DR">
        <p className={bodyText}>{result.tldr}</p>
      </Section>

      <Section title="핵심 결론">
        <p className={bodyText}>{result.conclusion}</p>
      </Section>

      <Section title="전체 개요">
        <p className={`whitespace-pre-line ${bodyText}`}>{result.overview}</p>
      </Section>

      {result.sections.length > 0 && (
        <Section title="상세 내용">
          <div className="space-y-5">
            {result.sections.map((s, i) => (
              <div key={i} className="space-y-1">
                <h3 className="font-medium text-neutral-900">
                  {s.timestamp && (
                    <span className="text-neutral-400">[{s.timestamp}] </span>
                  )}
                  {s.heading}
                </h3>
                <p className={`whitespace-pre-line ${bodyText}`}>{s.content}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.keyPoints.length > 0 && (
        <Section title="핵심 포인트">
          <ul className={bulletList}>
            {result.keyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Section>
      )}

      {result.quotes.length > 0 && (
        <Section title="주요 인용·수치">
          <ul className={bulletList}>
            {result.quotes.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </Section>
      )}

      {result.entities.length > 0 && (
        <Section title="언급된 인물·제품·기업">
          <ul className={bulletList}>
            {result.entities.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Section>
      )}

      {result.keywords.length > 0 && (
        <Section title="키워드">
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((k, i) => (
              <span
                key={i}
                className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-sm text-neutral-600"
              >
                {k}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
