const nav = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "domains", label: "Domains", icon: "◇" },
  { id: "search", label: "Search", icon: "⌕" },
  { id: "backend", label: "Backend", icon: "≡" },
  { id: "reports", label: "Reports", icon: "▤" },
  { id: "brief", label: "Brief", icon: "✧" }
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">AI</div>
        <div>
          <strong>DB Control</strong>
          <span>Knowledge Ops</span>
        </div>
      </div>
      <nav>
        {nav.map((item) => (
          <button
            key={item.id}
            className={activePage === item.id ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate(item.id)}
            type="button"
            title={item.label}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <span>Source</span>
        <strong>E:\DataBase</strong>
      </div>
    </aside>
  );
}
