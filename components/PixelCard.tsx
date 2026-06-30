'use client';

export function PixelCard({ children, title, action }: { children: React.ReactNode, title?: string, action?: React.ReactNode }) {
  return (
    <div className="panel">
      {(title || action) && (
        <div className="panel-head">
          <span className="panel-title">{title}</span>
          {action && <div className="ph-right">{action}</div>}
        </div>
      )}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}
