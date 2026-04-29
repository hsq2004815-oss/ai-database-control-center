export default function ReportList({ reports, selected, onSelect }) {
  if (!reports?.length) {
    return <div className="empty-state">No reports available for this domain yet.</div>;
  }
  return (
    <div className="report-list">
      {reports.map((report) => (
        <button
          type="button"
          key={report.name}
          className={selected === report.name ? "report-item active" : "report-item"}
          onClick={() => onSelect(report)}
        >
          <strong>{report.title || report.name}</strong>
          <span>{report.relative_path}</span>
          <small>{report.phase} · {Math.ceil(report.size / 1024)} KB</small>
        </button>
      ))}
    </div>
  );
}
