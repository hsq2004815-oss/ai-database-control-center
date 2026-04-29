import { useState } from "react";
import { api } from "../api.js";
import SearchPanel from "../components/SearchPanel.jsx";

export default function Search() {
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(params) {
    setLoading(true);
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
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="results-meta">{meta ? `${meta.source} · ${results.length} results · ${meta.query}` : "No search executed yet."}</div>
      <div className="results-list">
        {results.map((item) => (
          <article className="result-card" key={item.chunk_id}>
            <div className="card-heading">
              <div>
                <p className="eyebrow">{item.source_type} · {item.section}</p>
                <h3>{item.title || item.chunk_id}</h3>
              </div>
              <span className="badge">{item.priority || "metadata"}</span>
            </div>
            <p>{item.summary || item.content || "No summary available."}</p>
            <div className="path-line">{item.relative_path}</div>
            <div className="badge-row">
              <span className="badge muted">{item.chunk_id}</span>
              {(item.tags || []).slice(0, 8).map((tag) => <span className="badge" key={tag}>{tag}</span>)}
              {item.trust_level ? <span className="badge">{item.trust_level}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
