'use client';

type Props = {
  icon?: string;
  title: string;
  body?: string;
  note?: string;
  children?: React.ReactNode;
};

export function EmptyState({ icon = '📭', title, body, note, children }: Props) {
  return (
    <div className="empty-wrap">
      <div className="empty-ico">{icon}</div>
      <div className="empty-title">{title}</div>
      {body  && <p className="empty-body">{body}</p>}
      {note  && <div className="empty-note">{note}</div>}
      {children}
    </div>
  );
}
