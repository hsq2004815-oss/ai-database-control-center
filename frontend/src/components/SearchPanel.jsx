import { useState } from "react";

export default function SearchPanel({ onSearch, loading }) {
  const [q, setQ] = useState("JWT RBAC");
  const [domain, setDomain] = useState("backend");
  const [limit, setLimit] = useState(5);

  function submit(event) {
    event.preventDefault();
    onSearch({ domain, q, limit });
  }

  return (
    <form className="command-panel" onSubmit={submit}>
      <label className="search-field">
        <span>Query</span>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search backend rules, chunks, reports..." />
      </label>
      <label>
        <span>Domain</span>
        <select value={domain} onChange={(event) => setDomain(event.target.value)}>
          <option value="backend">backend</option>
          <option value="all">all</option>
          <option value="ui_design">ui_design</option>
          <option value="ui_assets">ui_assets</option>
          <option value="agent_workflow">agent_workflow</option>
          <option value="automation">automation</option>
        </select>
      </label>
      <label>
        <span>Limit</span>
        <input className="limit-input" type="number" min="1" max="50" value={limit} onChange={(event) => setLimit(Number(event.target.value))} />
      </label>
      <button className="primary-button" disabled={loading} type="submit">{loading ? "Searching..." : "Search"}</button>
    </form>
  );
}
