import { useEffect, useState } from "react";
import { api } from "../api.js";
import ReportList from "../components/ReportList.jsx";

export default function Reports() {
  const [domain, setDomain] = useState("backend");
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.reports(domain).then((data) => setReports(data.reports || [])).catch((err) => setError(err.message));
  }, [domain]);

  async function openReport(report) {
    setSelected(report.name);
    setError("");
    try {
      setContent(await api.reportContent(domain, report.name));
    } catch (err) {
      setError(err.message);
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
        <ReportList reports={reports} selected={selected} onSelect={openReport} />
        <section className="panel report-content">
          <div className="panel-title">
            <h3>{content?.name || "Report content"}</h3>
            <span>{content?.truncated ? "truncated" : "full"}</span>
          </div>
          <pre>{content?.content || "Choose a report to preview."}</pre>
        </section>
      </div>
    </section>
  );
}
