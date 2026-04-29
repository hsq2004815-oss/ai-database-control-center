const QUERY_FIELDS = [
  ["backend_queries", "Backend queries", "backend_limit"],
  ["workflow_queries", "Workflow queries", "workflow_limit"],
  ["ui_queries", "UI queries", "ui_limit"],
  ["automation_queries", "Automation queries", "automation_limit"],
  ["asset_queries", "Asset queries", "assets_limit"]
];

const CHUNK_FIELDS = [
  ["backend_chunks", "Backend chunks"],
  ["workflow_chunks", "Workflow chunks"],
  ["ui_chunks", "UI chunks"],
  ["automation_chunks", "Automation chunks"],
  ["asset_suggestions", "Asset suggestions"]
];

function valueFrom(data, key) {
  const value = data?.[key] ?? data?.data?.[key];
  return Array.isArray(value) ? value : [];
}

function handoffFrom(data) {
  return data?.final_handoff || data?.handoff || data?.answer || data?.context || null;
}

function itemSummary(item) {
  if (typeof item === "string") {
    return item;
  }
  return item?.summary || item?.content || item?.description || item?.text || "No summary available.";
}

function itemTitle(item) {
  if (typeof item === "string") {
    return item;
  }
  return item?.title || item?.chunk_id || item?.asset_id || item?.record_id || "Returned item";
}

function itemId(item) {
  if (typeof item === "string") {
    return item;
  }
  return item?.chunk_id || item?.asset_id || item?.record_id || item?.relative_path || itemTitle(item);
}

export default function BriefPanel({ data, limits = {} }) {
  if (!data) {
    return <div className="empty-state">Generate a brief to inspect backend queries, chunks, and the final handoff context.</div>;
  }
  const visibleQueryGroups = QUERY_FIELDS
    .map(([key, label, limitKey]) => ({ key, label, values: valueFrom(data, key), limit: limits[limitKey] ?? 1 }))
    .filter((group) => group.limit > 0 && group.values.length > 0);
  const visibleChunkGroups = CHUNK_FIELDS
    .map(([key, label]) => ({ key, label, values: valueFrom(data, key) }))
    .filter((group) => group.values.length > 0);
  const handoff = handoffFrom(data);

  return (
    <div className="brief-result-grid">
      <section className="panel">
        <div className="panel-title">
          <h3>Retrieval queries</h3>
          <span>{visibleQueryGroups.reduce((sum, group) => sum + group.values.length, 0)} shown</span>
        </div>
        {visibleQueryGroups.length ? (
          <div className="query-group-list">
            {visibleQueryGroups.map((group) => (
              <div className="query-group" key={group.key}>
                <strong>{group.label}</strong>
                <div className="badge-row">
                  {group.values.map((query, index) => <span className="badge" key={`${group.key}-${query}-${index}`}>{String(query)}</span>)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">No active query groups returned for the current limits.</div>
        )}
      </section>
      <section className="panel">
        <div className="panel-title">
          <h3>Returned chunks</h3>
          <span>{visibleChunkGroups.reduce((sum, group) => sum + group.values.length, 0)} items</span>
        </div>
        <div className="compact-list">
          {visibleChunkGroups.map((group) => (
            <div className="chunk-group" key={group.key}>
              <strong>{group.label}</strong>
              {group.values.slice(0, 6).map((item) => (
                <article className="chunk-mini-card" key={`${group.key}-${itemId(item)}`}>
                  <strong>{itemTitle(item)}</strong>
                  <span>{itemId(item)}</span>
                  <p>{itemSummary(item)}</p>
                </article>
              ))}
            </div>
          ))}
          {!visibleChunkGroups.length ? <div className="empty-state compact">No chunks returned for this brief.</div> : null}
        </div>
      </section>
      <section className="panel full-span">
        <div className="panel-title">
          <h3>Final handoff</h3>
          <span>agent-facing context</span>
        </div>
        {handoff ? (
          <div className="handoff-panel">
            <pre>{typeof handoff === "string" ? handoff : JSON.stringify(handoff, null, 2)}</pre>
          </div>
        ) : (
          <div className="empty-state compact">No final handoff field returned.</div>
        )}
      </section>
      <section className="panel full-span">
        <div className="panel-title">
          <h3>Debug output</h3>
          <span>raw upstream structure</span>
        </div>
        <details className="debug-details">
          <summary>Show raw upstream JSON</summary>
          <div className="json-panel">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </details>
      </section>
    </div>
  );
}
