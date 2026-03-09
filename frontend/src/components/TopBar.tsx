type TopBarProps = {
  language: "en" | "sw";
  onChangeLanguage: (language: "en" | "sw") => void;
};

export default function TopBar({ language, onChangeLanguage }: TopBarProps) {
  return (
    <header className="topbar">
      <h1 className="topbar-title">SOPs Chatbot</h1>

      <div className="language-toggle">
        <button
          className={language === "en" ? "lang-btn active" : "lang-btn"}
          onClick={() => onChangeLanguage("en")}
        >
          English
        </button>

        <button
          className={language === "sw" ? "lang-btn active" : "lang-btn"}
          onClick={() => onChangeLanguage("sw")}
        >
          Kiswahili
        </button>
      </div>
    </header>
  );
}