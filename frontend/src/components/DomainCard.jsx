export default function DomainCard({ domain, onInspect }) {
  return (
    <article className="domain-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">{domain.domain}</p>
          <h3>{domain.display_name}</h3>
        </div>
        <span className={domain.exists ? "badge good" : "badge warn"}>{domain.status}</span>
      </div>
      <p>{domain.description}</p>
      <div className="badge-row">
        {domain.available_sources.map((source) => (
          <span className="badge" key={source}>{source}</span>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onInspect(domain.domain)}>
        View status
      </button>
    </article>
  );
}
