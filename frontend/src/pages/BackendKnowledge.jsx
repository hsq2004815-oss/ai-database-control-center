import { useEffect, useState } from "react";
import { api } from "../api.js";

const types = ["rules", "topics", "patterns", "checklists", "templates", "references", "reports"];

export default function BackendKnowledge() {
  const [type, setType] = useState("rules");
  const [files, setFiles] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedFile = files.find((file) => file.relative_path === selectedPath) || files[0] || null;

  useEffect(() => {
    setError("");
    setLoading(true);
    setSelectedPath("");
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
        <div className="backend-file-shell">
          <div className="file-table">
            {loading ? <div className="empty-state compact">Loading backend knowledge files...</div> : null}
            {!loading && !files.length ? <div className="empty-state compact">No files found for this type.</div> : null}
            {files.map((file) => (
              <button
                className={`file-row selectable ${selectedFile?.relative_path === file.relative_path ? "active" : ""}`}
                key={file.relative_path}
                type="button"
                onClick={() => setSelectedPath(file.relative_path)}
              >
                <strong>{file.title || file.name}</strong>
                <span>{file.relative_path}</span>
                <small>{type} · {Math.ceil(file.size / 1024)} KB · {file.modified_at}</small>
              </button>
            ))}
          </div>
          {!loading && selectedFile ? (
            <aside className="file-detail-panel">
              <p className="eyebrow">Selected file</p>
              <h3>{selectedFile.title || selectedFile.name}</h3>
              <div className="detail-grid">
                <div className="detail-field">
                  <span>type</span>
                  <strong>{type}</strong>
                </div>
                <div className="detail-field">
                  <span>size</span>
                  <strong>{Math.ceil(selectedFile.size / 1024)} KB</strong>
                </div>
                <div className="detail-field">
                  <span>updated_at</span>
                  <strong>{selectedFile.modified_at}</strong>
                </div>
                <div className="detail-field">
                  <span>relative_path</span>
                  <strong>{selectedFile.relative_path}</strong>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </section>
  );
}
