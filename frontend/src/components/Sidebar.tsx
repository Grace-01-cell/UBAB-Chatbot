type ChatSession = {
  id: string;
  title: string;
  preview: string;
};

type SidebarProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
};

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
      </button>

      <div className="sidebar-section-title">PREVIOUS CHATS</div>

      <div className="session-list">
        {sessions.length === 0 && (
          <div className="empty-sidebar-note">No chats yet.</div>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${session.id === activeSessionId ? "active" : ""}`}
          >
            <button
              className="session-main"
              onClick={() => onSelectSession(session.id)}
            >
              <div className="session-title">{session.title || "Untitled chat"}</div>
              <div className="session-preview">{session.preview}</div>
            </button>

            <button
              className="session-delete-btn"
              onClick={() => onDeleteSession(session.id)}
              title="Delete chat"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}