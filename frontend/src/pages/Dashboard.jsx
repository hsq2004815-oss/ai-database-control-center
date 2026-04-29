import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatCard from "../components/StatCard.jsx";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [domains, setDomains] = useState([]);
  const [backendStatus, setBackendStatus] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [healthData, domainData, backendData, reportData] = await Promise.all([
          api.health(),
          api.domains(),
          api.domainStatus("backend"),
          api.reports("backend")
        ]);
        setHealth(healthData);
        setDomains(domainData.domains || []);
        setBackendStatus(backendData);
        setReports(reportData.reports || []);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  return (
    <section className="page-stack">
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="hero-strip">
        <div>
          <p className="eyebrow">System overview</p>
          <h2>Knowledge database operations surface</h2>
          <p>Read-only gateway over the local API, backend SQLite index, curated reports, and domain metadata.</p>
        </div>
        <div className={health?.upstream_api_available ? "signal good" : "signal warn"}>
          {health?.upstream_api_available ? "Upstream online" : "Upstream unknown"}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Database root" value={health?.database_root_exists ? "available" : "missing"} tone={health?.database_root_exists ? "good" : "warn"} detail={health?.database_root} />
        <StatCard label="Backend chunks" value={health?.upstream_health?.backend_chunks ?? backendStatus?.known_file_count ?? "-"} detail="retrieval-ready backend knowledge" />
        <StatCard label="References" value={health?.upstream_health?.references ?? backendStatus?.references_json_count ?? "-"} detail="curated reference records" />
        <StatCard label="Reports" value={reports.length} detail="backend output reports" />
      </div>

      <div className="domain-status-grid">
        {domains.map((domain) => (
          <section className="status-row" key={domain.domain}>
            <span className={domain.exists ? "dot good" : "dot warn"} />
            <div>
              <strong>{domain.display_name}</strong>
              <p>{domain.description}</p>
            </div>
            <span className="badge">{domain.available_operations.join(" / ")}</span>
          </section>
        ))}
      </div>

      <section className="panel">
        <div className="panel-title">
          <h3>Recent reports</h3>
          <span>{reports.length} files</span>
        </div>
        <div className="compact-list">
          {reports.slice(0, 5).map((report) => (
            <div key={report.name}>
              <strong>{report.title}</strong>
              <span>{report.relative_path}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
