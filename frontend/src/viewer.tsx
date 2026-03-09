import { useMemo } from "react";
import { getFileUrl } from "./api/client";

export default function Viewer() {
  const params = new URLSearchParams(window.location.search);

  const file = params.get("file") || "";
  const page = params.get("page") || "1";
  const index = Number(params.get("index") || 0);

  const sourcesParam = params.get("sources") || "[]";
  const sources = JSON.parse(decodeURIComponent(sourcesParam));

  const source = sources[index];

  const fullUrl = useMemo(() => {
    if (!source) return "";
    return `${getFileUrl(source.file_url)}#page=${source.page}&zoom=page-width`;
  }, [source]);

  function goToSource(i: number) {
    const s = sources[i];
    const url = `/viewer?file=${encodeURIComponent(
      s.file_url
    )}&page=${s.page}&index=${i}&sources=${encodeURIComponent(
      JSON.stringify(sources)
    )}`;

    window.location.href = url;
  }

  function goBackToChat() {
  window.location.href = "/";
}

  if (!source) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, Arial, sans-serif",
        }}
      >
        <div>
          <h2>No source selected</h2>
          <p>The viewer did not receive a valid source.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          fontFamily: "Inter, system-ui, Arial, sans-serif",
        }}
      >
        <button
          onClick={goBackToChat}
          style={{
            border: "none",
            background: "#f1f5f9",
            padding: "10px 14px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Back to Chat
        </button>

        <div style={{ fontWeight: 700, fontSize: 18 }}>📄 SOP Viewer</div>

        <div style={{ color: "#64748b", fontSize: 14 }}>Page {source.page}</div>
      </div>

      <div
        style={{
          padding: 10,
          display: "flex",
          justifyContent: "center",
          gap: 10,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <button
          disabled={index === 0}
          onClick={() => goToSource(index - 1)}
          style={{
            border: "none",
            background: index === 0 ? "#e2e8f0" : "#2563eb",
            color: index === 0 ? "#94a3b8" : "#ffffff",
            padding: "10px 14px",
            borderRadius: 10,
            cursor: index === 0 ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          ◀ Previous Source
        </button>

        <button
          disabled={index === sources.length - 1}
          onClick={() => goToSource(index + 1)}
          style={{
            border: "none",
            background:
              index === sources.length - 1 ? "#e2e8f0" : "#2563eb",
            color: index === sources.length - 1 ? "#94a3b8" : "#ffffff",
            padding: "10px 14px",
            borderRadius: 10,
            cursor:
              index === sources.length - 1 ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          Next Source ▶
        </button>
      </div>

      <div style={{ flex: 1, width: "100%", height: "100%" }}>
        <iframe
          src={fullUrl}
          title="PDF Viewer"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            background: "#fff",
          }}
        />
      </div>
    </div>
  );
}