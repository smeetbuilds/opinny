export default function Loading() {
  return (
    <div className="loading-shell" aria-label="Loading page">
      <div className="loading-topbar" />
      <div className="loading-container">
        <div className="skeleton skeleton-kicker" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-copy" />
        <div className="loading-grid">
          {Array.from({ length: 6 }).map((_, index) => <div className="skeleton loading-card" key={index} />)}
        </div>
      </div>
    </div>
  );
}
