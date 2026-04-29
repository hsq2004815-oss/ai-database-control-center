import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatCard from "../components/StatCard.jsx";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [domains, setDomains] = useState([]);
  const [backendStatus, setBackendStatus] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="page-stack">
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="hero-strip">
        <div>
          <p className="eyebrow">Knowledge Base Overview</p>
          <h2>Read-only control plane for local AI knowledge</h2>
          <p>Monitor the database root, upstream API, backend retrieval index, curated domains, and report inventory from one clean console.</p>
        </div>
        <div className={health?.upstream_api_available ? "signal good" : "signal warn"}>
          {loading ? "Checking..." : health?.upstream_api_available ? "Upstream online" : "Upstream unavailable"}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Database root" value={health?.database_root_exists ? "available" : "missing"} tone={health?.database_root_exists ? "good" : "warn"} detail={health?.database_root} />
        <StatCard label="Backend chunks" value={health?.upstream_health?.backend_chunks ?? backendStatus?.known_file_count ?? "-"} detail="retrieval-ready backend knowledge" />
        <StatCard label="References" value={health?.upstream_health?.references ?? backendStatus?.references_json_count ?? "-"} detail="curated cross-domain records" />
        <StatCard label="Reports" value={reports.length} detail="backend output reports" />
      </div>

      <section className="overview-panel">
        <div>
          <p className="eyebrow">System Overview</p>
          <h3>Backend domain inventory</h3>
        </div>
        <div className="metric-strip wide">
          <span><strong>{backendStatus?.rules_count ?? "-"}</strong>rules</span>
          <span><strong>{backendStatus?.templates_count ?? "-"}</strong>templates</span>
          <span><strong>{backendStatus?.references_json_count ?? "-"}</strong>references</span>
          <span><strong>{backendStatus?.reports_count ?? "-"}</strong>reports</span>
        </div>
      </section>

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
        {!domains.length && !loading ? <div className="empty-state">No domain status returned.</div> : null}
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
          {!reports.length && !loading ? <div className="empty-state compact">No backend reports found.</div> : null}
        </div>
      </section>
    </section>
  );
}
