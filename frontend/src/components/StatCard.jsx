export default function StatCard({ label, value, tone = "neutral", detail }) {
  return (
    <section className={`stat-card ${tone}`}>
      <div className="stat-card-header">
        <span>{label}</span>
        <i />
      </div>
      <strong>{value ?? "-"}</strong>
      {detail ? <p>{detail}</p> : null}
    </section>
  );
}
