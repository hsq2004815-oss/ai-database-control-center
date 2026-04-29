export default function BriefPanel({ data }) {
  if (!data) {
    return <div className="empty-state">Generate a brief to inspect upstream retrieval output.</div>;
  }
  return (
    <div className="json-panel">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
