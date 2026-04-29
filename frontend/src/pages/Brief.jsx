import { useState } from "react";
import { api } from "../api.js";
import BriefPanel from "../components/BriefPanel.jsx";
import {
  buildBriefHandoffMarkdown,
  copyToClipboard,
  downloadMarkdown,
  timestampForFile
} from "../utils/handoffExport.js";

export default function Brief() {
  const [task, setTask] = useState("帮我做一个 FastAPI 登录注册后端");
  const [limits, setLimits] = useState({ ui_limit: 0, backend_limit: 8, workflow_limit: 2, automation_limit: 0, assets_limit: 0 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportStatus, setExportStatus] = useState("");

  function setLimit(name, value) {
    setLimits((current) => ({ ...current, [name]: Number(value) }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setExportStatus("");
    try {
      setData(await api.brief({ task, ...limits }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyBriefHandoff({ target = "agent", includeDebug = false, label = "handoff" } = {}) {
    if (!data) {
      setExportStatus("Generate a brief before exporting");
      return;
    }
    try {
      await copyToClipboard(buildBriefHandoffMarkdown({ task, limits, data, includeDebug, target }));
      setExportStatus(`Copied ${label}`);
    } catch {
      setExportStatus(`Could not copy ${label}`);
    }
  }

  function downloadBriefHandoff() {
    if (!data) {
      setExportStatus("Generate a brief before exporting");
      return;
    }
    downloadMarkdown(`brief-handoff-${timestampForFile()}.md`, buildBriefHandoffMarkdown({ task, limits, data }));
    setExportStatus("Downloaded agent handoff");
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Agent handoff</p>
          <h2>Generate a focused database brief</h2>
        </div>
      </div>
      <form className="brief-form" onSubmit={submit}>
        <label className="prompt-field">
          <span>Task prompt</span>
        <textarea value={task} onChange={(event) => setTask(event.target.value)} rows={5} />
        </label>
        <div className="limit-grid">
          {Object.keys(limits).map((name) => (
            <label key={name}>
              <span>{name}</span>
              <input type="number" min="0" max="50" value={limits[name]} onChange={(event) => setLimit(name, event.target.value)} />
            </label>
          ))}
        </div>
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Generating" : "Generate brief"}</button>
      </form>
      <section className="export-panel">
        <div>
          <p className="eyebrow">Agent export</p>
          <h3>Brief handoff markdown</h3>
          <span>{data ? "Copy or download the current brief as an agent-ready context package." : "Generate a brief to enable agent handoff export."}</span>
        </div>
        <div className="export-actions">
          <button type="button" className="secondary-button compact" disabled={!data} onClick={() => copyBriefHandoff({ label: "agent handoff" })}>Copy Agent Handoff</button>
          <button type="button" className="secondary-button compact" disabled={!data} onClick={downloadBriefHandoff}>Download Agent Handoff .md</button>
          <button type="button" className="secondary-button compact" disabled={!data} onClick={() => copyBriefHandoff({ target: "codex", label: "prompt for Codex" })}>Copy Prompt for Codex</button>
          <button type="button" className="secondary-button compact" disabled={!data} onClick={() => copyBriefHandoff({ target: "opencode", label: "prompt for opencode" })}>Copy Prompt for opencode</button>
          <button type="button" className="secondary-button compact" disabled={!data} onClick={() => copyBriefHandoff({ includeDebug: true, label: "full debug handoff" })}>Copy Full Debug</button>
        </div>
        {exportStatus ? <div className="copy-status">{exportStatus}</div> : null}
      </section>
      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="empty-state">Calling the upstream brief endpoint...</div> : null}
      <BriefPanel data={data} limits={limits} />
    </section>
  );
}
