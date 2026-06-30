'use client';

type Color = 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'default';

export type MetricCardProps = {
  label: string;
  value: string;
  sub?: string;
  usd?: string;
  note?: string;
  color?: Color;
  loading?: boolean;
  tiny?: boolean;
};

export function MetricCard({
  label, value, sub, usd, note, color = 'default', loading = false, tiny = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className={`mcard ${tiny ? 'mcard-tiny' : ''}`}>
        <div className="skel" style={{ width: '55%', height: 10 }} />
        <div className="skel" style={{ marginTop: 10, width: '80%', height: tiny ? 18 : 22 }} />
        <div className="skel" style={{ marginTop: 6, width: '40%', height: 10 }} />
      </div>
    );
  }

  return (
    <div className={`mcard mcard-${color} ${tiny ? 'mcard-tiny' : ''}`}>
      <div className="mcard-label">{label}</div>
      <div className="mcard-value">{value}</div>
      {usd   && <div className="mcard-usd">{usd}</div>}
      {sub   && <div className="mcard-sub">{sub}</div>}
      {note  && <div className="mcard-note">{note}</div>}
    </div>
  );
}
