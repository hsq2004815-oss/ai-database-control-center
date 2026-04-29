import { useState } from "react";
import { api } from "../api.js";
import SearchPanel from "../components/SearchPanel.jsx";
import {
  buildSearchHandoffMarkdown,
  buildSearchResultMarkdown,
  copyToClipboard,
  downloadMarkdown,
  timestampForFile
} from "../utils/handoffExport.js";

const DOMAIN_HINTS = {
  backend: "API, JWT, RBAC, database, deployment, security",
  ui_design: "UI, dashboard, layout, SaaS, visual style",
  automation: "Playwright, CDP, modal handling, upload flows"
};

const CORE_SOURCE_TYPES = new Set(["rule", "checklist", "template", "pattern"]);
const PROJECT_SOURCE_TYPES = new Set(["github_project_analysis", "github_project_chunk"]);
const SOURCE_LABELS = {
  rule: "Core rule",
  checklist: "Checklist",
  template: "Template",
  pattern: "Pattern",
  topic: "Concept topic",
  reference: "Reference",
  github_project_analysis: "Project reference",
  github_project_chunk: "Project sample",
  file_metadata: "File metadata"
};
const SOURCE_DESCRIPTIONS = {
  rule: "Core backend guidance. Treat this as primary decision support.",
  checklist: "Operational checklist for validation, review, or release readiness.",
  template: "Reusable implementation or documentation structure.",
  pattern: "Reusable design or implementation pattern.",
  topic: "Concept overview for orientation and terminology.",
  reference: "Curated reference material for supporting context.",
  github_project_analysis: "Project reference. Useful as an example, not a core rule.",
  github_project_chunk: "Project sample. Use as supporting context only.",
  file_metadata: "File metadata result. Open the source path for deeper inspection."
};

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
  return SOURCE_LABELS[sourceType] || sourceType || "metadata";
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

function previewText(item) {
  return item.summary || item.content || "No summary available.";
}

function listValue(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function DetailField({ label, children }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{children || "none"}</strong>
    </div>
  );
}

export default function Search() {
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selectedChunkId, setSelectedChunkId] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const selectedResult = results.find((item) => item.chunk_id === selectedChunkId) || results[0] || null;

  async function runSearch(params) {
    setLoading(true);
    setSearched(true);
    setError("");
    setCopyStatus("");
    try {
      const data = await api.search(params);
      const nextResults = data.results || [];
      setMeta(data);
      setResults(nextResults);
      setSelectedChunkId(nextResults[0]?.chunk_id || "");
    } catch (err) {
      setError(err.message);
      setResults([]);
      setSelectedChunkId("");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(label, text) {
    if (!text) {
      setCopyStatus(`${label} is empty`);
      return;
    }
    try {
      await copyToClipboard(text);
      setCopyStatus(`${label} copied`);
    } catch {
      setCopyStatus(`Could not copy ${label}`);
    }
  }

  async function copySearchHandoff() {
    try {
      await copyToClipboard(buildSearchHandoffMarkdown({ meta, results }));
      setCopyStatus("Copied handoff markdown");
    } catch {
      setCopyStatus("Could not copy handoff markdown");
    }
  }

  function downloadSearchHandoff() {
    downloadMarkdown(`search-handoff-${timestampForFile()}.md`, buildSearchHandoffMarkdown({ meta, results }));
    setCopyStatus("Downloaded handoff markdown");
  }

  async function copySelectedResult(asPromptContext = false) {
    if (!selectedResult) {
      setCopyStatus("No selected result");
      return;
    }
    try {
      await copyToClipboard(buildSearchResultMarkdown(selectedResult, { asPromptContext }));
      setCopyStatus(asPromptContext ? "Copied selected result as prompt context" : "Copied selected result");
    } catch {
      setCopyStatus("Could not copy selected result");
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
      <section className="export-panel">
        <div>
          <p className="eyebrow">Agent export</p>
          <h3>Search handoff markdown</h3>
          <span>{results.length ? "Package current ranked results for Codex, opencode, or Claude Code." : "Run a search to enable handoff export."}</span>
        </div>
        <div className="export-actions">
          <button type="button" className="secondary-button compact" disabled={!results.length} onClick={copySearchHandoff}>Copy Handoff Markdown</button>
          <button type="button" className="secondary-button compact" disabled={!results.length} onClick={downloadSearchHandoff}>Download Handoff .md</button>
          <button type="button" className="secondary-button compact" disabled={!selectedResult} onClick={() => copySelectedResult(false)}>Copy Selected Result</button>
          <button type="button" className="secondary-button compact" disabled={!selectedResult} onClick={() => copySelectedResult(true)}>Copy Selected Result as Prompt Context</button>
        </div>
        {copyStatus ? <div className="copy-status">{copyStatus}</div> : null}
      </section>
      {loading ? <div className="empty-state">Searching...</div> : null}
      {searched && !loading && !error && !results.length ? <div className="empty-state">{emptyMessage(meta)}</div> : null}
      {results.length ? (
        <div className="search-results-shell">
          <div className="search-results-column">
            {results.map((item) => (
              <article
                className={`result-card selectable ${selectedResult?.chunk_id === item.chunk_id ? "active" : ""}`}
                key={item.chunk_id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedChunkId(item.chunk_id);
                  setCopyStatus("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedChunkId(item.chunk_id);
                    setCopyStatus("");
                  }
                }}
              >
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
                  <span className="badge">{selectedResult?.chunk_id === item.chunk_id ? "selected" : "view"}</span>
                </div>
                <p className="summary-preview">{previewText(item)}</p>
                <div className="path-line compact">{item.relative_path}</div>
                <div className="badge-row">
                  {listValue(item.tags).slice(0, 8).map((tag) => <span className="badge" key={tag}>{tag}</span>)}
                </div>
                {item.rank_reason ? (
                  <details className="ranking-details" onClick={(event) => event.stopPropagation()}>
                    <summary>Why this result?</summary>
                    <div className="rank-reason">{item.rank_reason}</div>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
          <aside className="detail-panel">
            {selectedResult ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Knowledge detail</p>
                    <h3>{selectedResult.title || selectedResult.chunk_id}</h3>
                    <p>{SOURCE_DESCRIPTIONS[selectedResult.source_type] || "Ranked search result from the selected knowledge domain."}</p>
                  </div>
                  <span className={sourceBadgeClass(selectedResult.source_type)}>{sourceLabel(selectedResult.source_type)}</span>
                </div>
                <div className="copy-row">
                  <button type="button" className="secondary-button compact" onClick={() => copyText("chunk_id", selectedResult.chunk_id)}>Copy chunk_id</button>
                  <button type="button" className="secondary-button compact" onClick={() => copyText("relative_path", selectedResult.relative_path)}>Copy path</button>
                  <button type="button" className="secondary-button compact" onClick={() => copyText("content", selectedResult.content || selectedResult.summary)}>Copy content</button>
                </div>
                {copyStatus ? <div className="copy-status">{copyStatus}</div> : null}
                <div className="detail-grid">
                  <DetailField label="chunk_id">{selectedResult.chunk_id}</DetailField>
                  <DetailField label="source_type">{selectedResult.source_type}</DetailField>
                  <DetailField label="priority">{selectedResult.priority}</DetailField>
                  <DetailField label="trust_level">{selectedResult.trust_level}</DetailField>
                  <DetailField label="rank_score">{Number.isFinite(selectedResult.rank_score) ? selectedResult.rank_score : ""}</DetailField>
                  <DetailField label="rank_tier">{selectedResult.rank_tier}</DetailField>
                  <DetailField label="section">{selectedResult.section}</DetailField>
                  <DetailField label="relative_path">{selectedResult.relative_path}</DetailField>
                </div>
                <section className="detail-section">
                  <h4>Summary</h4>
                  <p>{selectedResult.summary || "No summary available."}</p>
                </section>
                <section className="detail-section">
                  <h4>Full content</h4>
                  <pre>{selectedResult.content || selectedResult.summary || "No content available."}</pre>
                </section>
                <section className="detail-section">
                  <h4>Tags and keywords</h4>
                  <div className="badge-row">
                    {[...listValue(selectedResult.tags), ...listValue(selectedResult.keywords)].slice(0, 20).map((tag) => <span className="badge" key={tag}>{tag}</span>)}
                  </div>
                </section>
                <details className="ranking-details detail-ranking" open>
                  <summary>Ranking explanation</summary>
                  <div className="rank-reason">{selectedResult.rank_reason || "No ranking explanation returned."}</div>
                </details>
              </>
            ) : (
              <div className="empty-state compact">Select a result to inspect its detail.</div>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
