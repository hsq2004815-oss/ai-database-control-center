const nav = [
  { id: "dashboard", label: "Dashboard", icon: "01" },
  { id: "domains", label: "Domains", icon: "02" },
  { id: "search", label: "Search", icon: "03" },
  { id: "backend", label: "Backend", icon: "04" },
  { id: "reports", label: "Reports", icon: "05" },
  { id: "brief", label: "Brief", icon: "06" }
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">AI</div>
        <div>
          <strong>AI DB Console</strong>
          <span>Personal AI Knowledge Console</span>
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
