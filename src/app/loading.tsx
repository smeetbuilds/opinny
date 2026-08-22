export default function Loading() {
  return (
    <div className="loading-shell" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading page…</span>
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
