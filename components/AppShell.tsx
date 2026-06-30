'use client';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      {children}
    </div>
  );
}
