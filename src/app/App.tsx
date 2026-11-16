import { useState } from 'react';
import { AccessWorkspace } from '../features/access/AccessWorkspace';
import { WorkspaceStore } from '../features/access/workspace';
import { WorkspaceShell } from '../shared/layout/WorkspaceShell';
import { Providers } from './Providers';
import type { createStyleCache } from './Providers';

export function App({ cache, store: providedStore }: { cache: ReturnType<typeof createStyleCache>; store?: WorkspaceStore }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [store] = useState(() => providedStore || new WorkspaceStore());
  return <Providers mode={mode} cache={cache}>
    <WorkspaceShell mode={mode} onToggleMode={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      <AccessWorkspace store={store} />
    </WorkspaceShell>
  </Providers>;
}
