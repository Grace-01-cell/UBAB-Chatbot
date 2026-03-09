import type { ChatResponse } from "../api/client";
import CitationList from "./CitationList";

type Msg =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      text: string;
      answerId: string;
      citations: ChatResponse["citations"];
    };

type MessageBubbleProps = {
  message: Msg;
};

export default function MessageBubble({ message }: MessageBubbleProps) {

  function handleThumbUp() {
    alert("Thanks for the feedback 👍 (placeholder)");
  }

  function handleThumbDown() {
    alert("Feedback noted 👎 (placeholder)");
  }

  return (
    <div
      className={
        message.role === "user" ? "message-row user" : "message-row assistant"
      }
    >
      <div
        className={
          message.role === "user"
            ? "message-bubble user"
            : "message-bubble assistant"
        }
      >
        <div className="message-text">{message.text}</div>

        {message.role === "assistant" && (
          <>
            <CitationList citations={message.citations} />

            <div className="feedback-buttons">
              <button onClick={handleThumbUp} title="Good answer">👍</button>
              <button onClick={handleThumbDown} title="Bad answer">👎</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}