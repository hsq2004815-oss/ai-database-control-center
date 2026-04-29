export default function ReportList({ reports, selected, onSelect }) {
  if (!reports?.length) {
    return <div className="empty-state">No reports found for this domain.</div>;
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
        </button>
      ))}
    </div>
  );
}
