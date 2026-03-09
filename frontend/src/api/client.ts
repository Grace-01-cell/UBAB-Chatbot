const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export type Citation = {
  id: string;
  doc_name: string;
  page: number;
  chunk_index: number;
  label: string;
  snippet: string;
  file_url: string;
};

export type ChatResponse = {
  answer_id: string;
  answer: string;
  citations: Citation[];
  language: "en" | "sw";
};

export async function chat(
  message: string,
  language: "en" | "sw" = "en",
  k = 5
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language, k }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat failed: ${res.status} ${text}`);
  }

  return res.json();
}

export function getFileUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}