export default function DomainCard({ domain, metrics, onInspect }) {
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
      {metrics ? (
        <div className="metric-strip">
          {metrics.map((metric) => (
            <span key={metric.label}>
              <strong>{metric.value}</strong>
              {metric.label}
            </span>
          ))}
        </div>
      ) : null}
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
