import { useEffect, useState } from "react";
import { api } from "../api.js";
import DomainCard from "../components/DomainCard.jsx";

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.domains();
        const items = data.domains || [];
        setDomains(items);
        const pairs = await Promise.all(items.map(async (item) => {
          try {
            return [item.domain, await api.domainStatus(item.domain)];
          } catch {
            return [item.domain, null];
          }
        }));
        setStatusMap(Object.fromEntries(pairs));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function inspect(domain) {
    setError("");
    try {
      setStatus(await api.domainStatus(domain));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-stack">
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="section-heading">
        <div>
          <p className="eyebrow">Domain map</p>
          <h2>Allowed knowledge domains</h2>
        </div>
        <span className="results-meta">{loading ? "Loading domains..." : `${domains.length} domains`}</span>
      </div>
      <div className="domain-grid">
        {domains.map((domain) => {
          const metrics = domain.domain === "backend" && statusMap.backend ? [
            { label: "rules", value: statusMap.backend.rules_count },
            { label: "templates", value: statusMap.backend.templates_count },
            { label: "reports", value: statusMap.backend.reports_count }
          ] : statusMap[domain.domain] ? [
            { label: "files", value: statusMap[domain.domain].known_file_count }
          ] : null;
          return <DomainCard key={domain.domain} domain={domain} metrics={metrics} onInspect={inspect} />;
        })}
        {!domains.length && !loading ? <div className="empty-state">No allowed domains returned.</div> : null}
      </div>
      <section className="panel">
        <div className="panel-title">
          <h3>Selected status</h3>
          <span>{status?.domain || "none"}</span>
        </div>
        <div className="json-panel small">
          <pre>{status ? JSON.stringify(status, null, 2) : "Select a domain to inspect status."}</pre>
        </div>
      </section>
    </section>
  );
}
