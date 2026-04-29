import { useEffect, useState } from "react";
import { api } from "../api.js";
import ReportList from "../components/ReportList.jsx";

export default function Reports() {
  const [domain, setDomain] = useState("backend");
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setLoading(true);
    setSelected(null);
    setContent(null);
    api.reports(domain)
      .then((data) => setReports(data.reports || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [domain]);

  async function openReport(report) {
    setSelected(report.name);
    setContentLoading(true);
    setError("");
    try {
      setContent(await api.reportContent(domain, report.name));
    } catch (err) {
      setError(err.message);
    } finally {
      setContentLoading(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Read generated domain reports</h2>
        </div>
        <select value={domain} onChange={(event) => setDomain(event.target.value)}>
          <option value="backend">backend</option>
          <option value="ui_design">ui_design</option>
          <option value="ui_assets">ui_assets</option>
          <option value="agent_workflow">agent_workflow</option>
          <option value="automation">automation</option>
        </select>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="split-view">
        {loading ? <div className="empty-state">Loading reports...</div> : <ReportList reports={reports} selected={selected} onSelect={openReport} />}
        <section className="panel report-content">
          <div className="panel-title">
            <h3>{content?.name || "Report content"}</h3>
            <span>{content ? (content.truncated ? "truncated" : "full") : domain}</span>
          </div>
          <pre>{contentLoading ? "Loading report content..." : content?.content || (reports.length ? "Choose a report to preview." : "No reports available for this domain yet.")}</pre>
        </section>
      </div>
    </section>
  );
}
