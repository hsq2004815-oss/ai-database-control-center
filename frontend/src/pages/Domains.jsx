import { useEffect, useState } from "react";
import { api } from "../api.js";
import DomainCard from "../components/DomainCard.jsx";

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.domains().then((data) => setDomains(data.domains || [])).catch((err) => setError(err.message));
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
      </div>
      <div className="domain-grid">
        {domains.map((domain) => <DomainCard key={domain.domain} domain={domain} onInspect={inspect} />)}
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
