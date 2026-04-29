import { useState } from "react";
import { api } from "../api.js";
import BriefPanel from "../components/BriefPanel.jsx";

export default function Brief() {
  const [task, setTask] = useState("帮我做一个 FastAPI 登录注册后端");
  const [limits, setLimits] = useState({ ui_limit: 0, backend_limit: 8, workflow_limit: 2, automation_limit: 0, assets_limit: 0 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setLimit(name, value) {
    setLimits((current) => ({ ...current, [name]: Number(value) }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setData(await api.brief({ task, ...limits }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="empty-state">Calling the upstream brief endpoint...</div> : null}
      <BriefPanel data={data} limits={limits} />
    </section>
  );
}
