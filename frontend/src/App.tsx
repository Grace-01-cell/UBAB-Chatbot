import { useMemo, useState } from "react";
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
};

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  function createNewChat() {
    const id = crypto.randomUUID();

    const newSession: ChatSession = {
      id,
      title: language === "sw" ? "Mazungumzo mapya" : "New Chat",
      preview: language === "sw" ? "Anza kuuliza..." : "Start asking...",
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    setInput("");
    setError(null);
  }

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    let sessionId = activeSessionId;

    if (!sessionId) {
      const id = crypto.randomUUID();
      const newSession: ChatSession = {
        id,
        title: trimmed.slice(0, 30),
        preview: trimmed,
        messages: [],
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
                  ? trimmed.slice(0, 30)
                  : session.title,
              preview: trimmed,
              messages: [...session.messages, userMessage],
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
                preview: res.answer.slice(0, 60),
                messages: [...session.messages, assistantMessage],
              }
            : session
        )
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        sessions={sessions.map(({ id, title, preview }) => ({
          id,
          title,
          preview,
        }))}
        activeSessionId={activeSessionId}
        onNewChat={createNewChat}
        onSelectSession={setActiveSessionId}
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