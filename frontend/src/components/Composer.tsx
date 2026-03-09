import { useState } from "react";

type ComposerProps = {
  input: string;
  language: "en" | "sw";
  loading: boolean;
  onChangeInput: (value: string) => void;
  onSend: () => void;
};

export default function Composer({
  input,
  language,
  loading,
  onChangeInput,
  onSend,
}: ComposerProps) {
  const [listening, setListening] = useState(false);

  function startVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = language === "sw" ? "sw-TZ" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onChangeInput(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }

  return (
    <footer className="composer">
      <button
        className={listening ? "composer-icon-btn listening" : "composer-icon-btn"}
        onClick={startVoiceInput}
        type="button"
        title="Voice input"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 15a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v7a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-2.07A7 7 0 0 0 19 12h-2Z"
          />
        </svg>
      </button>

      <input
        value={input}
        onChange={(e) => onChangeInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder={
          language === "sw"
            ? "Uliza chochote au tumia sauti..."
            : "Ask anything"
        }
        className="composer-input"
      />

      <button
        className="composer-small-voice-btn"
        type="button"
        title="Voice mode placeholder"
      >
        <svg width="25" height="8" viewBox="18 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3a1 1 0 0 1 1 1v16a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm5.66 3.76a1 1 0 0 1 1.41 1.42A8 8 0 0 1 20 12a8 8 0 0 1-.93 3.82a1 1 0 1 1-1.77-.94A6 6 0 0 0 18 12a6 6 0 0 0-.7-2.88a1 1 0 0 1 .36-1.36ZM6.34 6.76A1 1 0 0 1 6.7 8.12A6 6 0 0 0 6 12c0 1 .24 1.95.7 2.88a1 1 0 0 1-1.77.94A8 8 0 0 1 4 12c0-1.4.36-2.73 1-3.88a1 1 0 0 1 1.34-.36Zm14.02-3.09a1 1 0 0 1 1.41 1.42A12 12 0 0 1 23 12a12 12 0 0 1-1.23 5.91a1 1 0 1 1-1.77-.94A10 10 0 0 0 21 12a10 10 0 0 0-1-4.95a1 1 0 0 1 .36-1.38ZM3.64 3.67a1 1 0 0 1 .36 1.36A10 10 0 0 0 3 12a10 10 0 0 0 1 4.95a1 1 0 1 1-1.77.94A12 12 0 0 1 1 12c0-2.14.56-4.16 1.59-5.91a1 1 0 0 1 1.05-.42Z"
          />
        </svg>
      </button>

      <button
        onClick={onSend}
        disabled={loading}
        className="composer-send-btn"
        type="button"
        title="Send"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3.4 20.4 20.85 12 3.4 3.6 3.38 10l12.02 2-12.02 2 .02 6.4Z"
          />
        </svg>
      </button>
    </footer>
  );
}