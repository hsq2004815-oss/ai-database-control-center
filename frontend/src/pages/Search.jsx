import { useState } from "react";
import { api } from "../api.js";
import SearchPanel from "../components/SearchPanel.jsx";

const DOMAIN_HINTS = {
  backend: "API, JWT, RBAC, database, deployment, security",
  ui_design: "UI, dashboard, layout, SaaS, visual style",
  automation: "Playwright, CDP, modal handling, upload flows"
};

const CORE_SOURCE_TYPES = new Set(["rule", "checklist", "template", "pattern"]);
const PROJECT_SOURCE_TYPES = new Set(["github_project_analysis", "github_project_chunk"]);

function sourceBadgeClass(sourceType) {
  if (CORE_SOURCE_TYPES.has(sourceType)) {
    return "badge source-badge core";
  }
  if (PROJECT_SOURCE_TYPES.has(sourceType)) {
    return "badge source-badge project";
  }
  return "badge source-badge";
}

function sourceLabel(sourceType) {
  if (PROJECT_SOURCE_TYPES.has(sourceType)) {
    return "Project reference";
  }
  return sourceType || "metadata";
}

function emptyMessage(meta) {
  if (!meta) {
    return "No matching results. Try a broader query or switch domain.";
  }
  if (meta.domain !== "backend" && /\b(jwt|rbac)\b/i.test(meta.query || "")) {
    return "JWT/RBAC usually belongs to the backend domain. This domain may be working correctly even when it returns no matches for backend-specific terms.";
  }
  const hint = DOMAIN_HINTS[meta.domain];
  return hint ? `No matches in ${meta.domain}. This domain is best for: ${hint}.` : "No matching results. Try a broader query or switch domain.";
}

export default function Search() {
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(params) {
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const data = await api.search(params);
      setMeta(data);
      setResults(data.results || []);
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
          <p className="eyebrow">Retrieval</p>
          <h2>Search database knowledge</h2>
        </div>
      </div>
      <SearchPanel onSearch={runSearch} loading={loading} />
      <section className="usage-hint-panel">
        <div>
          <strong>backend</strong>
          <span>API, JWT, RBAC, database, deployment, security</span>
        </div>
        <div>
          <strong>ui_design</strong>
          <span>UI, dashboard, layout, SaaS, visual style</span>
        </div>
        <div>
          <strong>automation</strong>
          <span>Playwright, CDP, modal handling, upload flows</span>
        </div>
      </section>
      <div className="ranking-note">
        Results are ranked with rules, checklists, templates and patterns prioritized over project analysis.
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="results-meta">
        {loading ? "Searching the selected knowledge source..." : meta ? `${meta.source} · ${results.length} results · ${meta.query}` : "Run a search to inspect chunks and file metadata."}
      </div>
      <div className="results-list">
        {loading ? <div className="empty-state">Searching...</div> : null}
        {searched && !loading && !error && !results.length ? <div className="empty-state">{emptyMessage(meta)}</div> : null}
        {results.map((item) => (
          <article className="result-card" key={item.chunk_id}>
            <div className="card-heading">
              <div>
                <div className="result-meta-grid">
                  <span className={sourceBadgeClass(item.source_type)}>{sourceLabel(item.source_type)}</span>
                  {item.priority ? <span className="badge muted">priority: {item.priority}</span> : null}
                  {item.trust_level ? <span className="badge muted">trust: {item.trust_level}</span> : null}
                  {Number.isFinite(item.rank_score) ? <span className="badge muted">rank: {item.rank_score}</span> : null}
                </div>
                <p className="eyebrow">{item.rank_tier || "ranked result"}{item.section ? ` · ${item.section}` : ""}</p>
                <h3>{item.title || item.chunk_id}</h3>
              </div>
              <span className="badge">{item.priority || "metadata"}</span>
            </div>
            <p>{item.summary || item.content || "No summary available."}</p>
            {item.rank_reason ? <div className="rank-reason">{item.rank_reason}</div> : null}
            <div className="path-line">{item.relative_path}</div>
            <div className="badge-row">
              <span className="badge muted">{item.chunk_id}</span>
              {(item.tags || []).slice(0, 8).map((tag) => <span className="badge" key={tag}>{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
