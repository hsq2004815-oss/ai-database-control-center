export default function StatCard({ label, value, tone = "neutral", detail }) {
  return (
    <section className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </section>
  );
}
