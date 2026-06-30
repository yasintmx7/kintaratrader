'use client';

export function LoadingSkeleton() {
  return (
    <div className="metrics-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="mcard">
          <div className="skel" style={{ width: '55%', height: 10, marginBottom: 8 }} />
          <div className="skel" style={{ width: '80%', height: 22, marginBottom: 6 }} />
          <div className="skel" style={{ width: '40%', height: 10 }} />
        </div>
      ))}
    </div>
  );
}
