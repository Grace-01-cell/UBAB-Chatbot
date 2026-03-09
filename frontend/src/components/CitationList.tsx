import type { Citation } from "../api/client";

type CitationListProps = {
  citations: Citation[];
};

export default function CitationList({ citations }: CitationListProps) {
  if (!citations.length) return null;

  return (
    <div className="citation-block">
      <div className="citation-title">Sources</div>
      <ul className="citation-list">
        {citations.map((c, i) => (
          <li key={i}>
            <a
              href={`/viewer?file=${encodeURIComponent(
                c.file_url
              )}&page=${c.page}&index=${i}&sources=${encodeURIComponent(
                JSON.stringify(citations)
              )}`}
              className="citation-link"
              title={c.snippet}
            >
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}