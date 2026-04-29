import Sidebar from "./Sidebar.jsx";

export default function Layout({ activePage, onNavigate, children }) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local knowledge operations for AI agents</p>
            <h1>AI Database Control Center</h1>
          </div>
          <div className="status-pill">
            <span className="pulse" />
            read-only gateway
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
