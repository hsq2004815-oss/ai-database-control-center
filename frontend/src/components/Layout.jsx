import Sidebar from "./Sidebar.jsx";

export default function Layout({ activePage, onNavigate, children }) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Read-only database console</p>
            <h1>Personal AI Database Control Center</h1>
          </div>
          <div className="status-pill">
            <span className="pulse" />
            local API gateway
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
