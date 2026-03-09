import { useEffect, useRef } from "react";
import type { ChatResponse } from "../api/client";
import MessageBubble from "./MessageBubble";

type Msg =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      text: string;
      answerId: string;
      citations: ChatResponse["citations"];
    };

type ChatWindowProps = {
  messages: Msg[];
  language: "en" | "sw";
  loading: boolean;
  error: string | null;
};

export default function ChatWindow({
  messages,
  language,
  loading,
  error,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <section className="chat-area">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h2>
            {language === "sw"
              ? "Karibu! Ninawezaje kukusaidia leo?"
              : "Welcome! How can I help you today?"}
          </h2>
          <p>
            {language === "sw"
              ? "Anza mazungumzo mapya kwa kuandika ujumbe hapa chini."
              : "Start a new conversation by typing a message below."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-area">
      <div className="messages">
        {messages.map((message, idx) => (
          <MessageBubble key={idx} message={message} />
        ))}

        {loading && (
  <div className="message-row assistant">
    <div className="message-bubble assistant typing">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  </div>
)}

        <div ref={bottomRef} />
      </div>
    </section>
  );
}