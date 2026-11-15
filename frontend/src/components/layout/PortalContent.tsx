import type { ReactNode } from 'react';

export function PortalContent({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl p-6">{children}</div>;
}
