import { useEffect, useMemo, useState } from "react";
import { chat } from "./api/client";
import type { ChatResponse } from "./api/client";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ChatWindow from "./components/ChatWindow";
import Composer from "./components/Composer";
import "./App.css";

type Msg =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      text: string;
      answerId: string;
      citations: ChatResponse["citations"];
    };

type ChatSession = {
  id: string;
  title: string;
  preview: string;
  messages: Msg[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "sop_chat_sessions_v1";
const ACTIVE_SESSION_KEY = "sop_active_session_id_v1";
const MAX_SAVED_SESSIONS = 15;

function buildSessionTitle(text: string, language: "en" | "sw"): string {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return language === "sw" ? "Mazungumzo mapya" : "New Chat";
  }

  const lower = cleaned.toLowerCase();

  const patterns = [
    { match: /(waste management|healthcare waste|health care waste|hcwm)/i, title: "Waste management guidelines" },
    { match: /(standard treatment guidelines|stg|nemlit|essential medicines)/i, title: "Treatment guidelines" },
    { match: /(infection prevention|ipc|infection control)/i, title: "Infection prevention" },
    { match: /(recycling|reuse|minimization|minimisation)/i, title: "Waste minimization" },
    { match: /(hiv|aids)/i, title: "HIV and AIDS guidance" },
  ];

  for (const p of patterns) {
    if (p.match.test(cleaned)) return p.title;
  }

  const stopWords = new Set([
    "what", "are", "the", "is", "how", "to", "for", "of", "and", "in", "on",
    "a", "an", "about", "with", "can", "you", "tell", "me", "please"
  ]);

  const words = lower
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !stopWords.has(w));

  const short = words.slice(0, 4).join(" ").trim();

  if (short) {
    return short.charAt(0).toUpperCase() + short.slice(1);
  }

  return cleaned.slice(0, 40);
}

function buildPreview(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 70 ? `${cleaned.slice(0, 70)}…` : cleaned;
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => loadActiveSessionId());
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  useEffect(() => {
    try {
      const trimmed = [...sessions]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_SAVED_SESSIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore storage write failures
    }
  }, [sessions]);

  useEffect(() => {
    try {
      if (activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch {
      // ignore storage write failures
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      const newest = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveSessionId(newest.id);
      return;
    }

    if (activeSessionId && !sessions.some((s) => s.id === activeSessionId)) {
      const newest = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveSessionId(newest ? newest.id : null);
    }
  }, [sessions, activeSessionId]);

  function createNewChat() {
    const id = crypto.randomUUID();
    const now = Date.now();

    const newSession: ChatSession = {
      id,
      title: language === "sw" ? "Mazungumzo mapya" : "New Chat",
      preview: language === "sw" ? "Anza kuuliza..." : "Start asking...",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    setInput("");
    setError(null);
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));

    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      const newest = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveSessionId(newest ? newest.id : null);
    }
  }

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    let sessionId = activeSessionId;
    const now = Date.now();

    if (!sessionId) {
      const id = crypto.randomUUID();
      const newSession: ChatSession = {
        id,
        title: buildSessionTitle(trimmed, language),
        preview: buildPreview(trimmed),
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(id);
      sessionId = id;
    }

    setError(null);
    setLoading(true);

    const userMessage: Msg = {
      role: "user",
      text: trimmed,
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title:
                session.messages.length === 0
                  ? buildSessionTitle(trimmed, language)
                  : session.title,
              preview: buildPreview(trimmed),
              messages: [...session.messages, userMessage],
              updatedAt: Date.now(),
            }
          : session
      )
    );

    setInput("");

    try {
      const res = await chat(trimmed, language, 5);

      const assistantMessage: Msg = {
        role: "assistant",
        text: res.answer,
        answerId: res.answer_id,
        citations: res.citations,
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                preview: buildSessionTitle(trimmed, language),
                messages: [...session.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : session
        )
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const orderedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="app-shell">
      <Sidebar
        sessions={orderedSessions.map(({ id, title, preview }) => ({
          id,
          title,
          preview,
        }))}
        activeSessionId={activeSessionId}
        onNewChat={createNewChat}
        onSelectSession={setActiveSessionId}
        onDeleteSession={deleteSession}
      />

      <main className="main-panel">
        <TopBar language={language} onChangeLanguage={setLanguage} />

        <ChatWindow
          messages={activeSession?.messages || []}
          language={language}
          loading={loading}
          error={error}
        />

        <Composer
          input={input}
          language={language}
          loading={loading}
          onChangeInput={setInput}
          onSend={onSend}
        />
      </main>
    </div>
  );
}