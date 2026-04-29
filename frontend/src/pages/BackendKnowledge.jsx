import { useEffect, useState } from "react";
import { api } from "../api.js";

const types = ["rules", "topics", "patterns", "checklists", "templates", "references", "reports"];

export default function BackendKnowledge() {
  const [type, setType] = useState("rules");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setLoading(true);
    api.backendFiles(type)
      .then((data) => setFiles(data.files || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Backend knowledge</p>
          <h2>Rules, templates, reports, and references</h2>
        </div>
        <div className="segmented">
          {types.map((item) => (
            <button key={item} type="button" className={type === item ? "active" : ""} onClick={() => setType(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <section className="panel">
        <div className="panel-title">
          <h3>{type}</h3>
          <span>{loading ? "loading" : `${files.length} files`}</span>
        </div>
        <div className="file-table">
          {loading ? <div className="empty-state compact">Loading backend knowledge files...</div> : null}
          {!loading && !files.length ? <div className="empty-state compact">No files found for this type.</div> : null}
          {files.map((file) => (
            <div className="file-row" key={file.relative_path}>
              <strong>{file.title || file.name}</strong>
              <span>{file.relative_path}</span>
              <small>{Math.ceil(file.size / 1024)} KB · {file.modified_at}</small>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
