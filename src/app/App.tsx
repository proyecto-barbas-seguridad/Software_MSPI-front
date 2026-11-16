import { useState, useSyncExternalStore } from 'react';
import { AccessWorkspace } from '../features/access/AccessWorkspace';
import { capabilities, WorkspaceStore } from '../features/access/workspace';
import { WorkspaceShell } from '../shared/layout/WorkspaceShell';
import { Providers } from './Providers';
import type { createStyleCache } from './Providers';

export function App({ cache, store: providedStore }: { cache: ReturnType<typeof createStyleCache>; store?: WorkspaceStore }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [store] = useState(() => providedStore || new WorkspaceStore());
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const panelHref = state.company && capabilities(state.company).read ? '/interfaz/#/empresas/' + state.company.empresaId : undefined;
  return <Providers mode={mode} cache={cache}>
    <WorkspaceShell mode={mode} onToggleMode={() => setMode(mode === 'light' ? 'dark' : 'light')} panelHref={panelHref}>
      <AccessWorkspace store={store} />
    </WorkspaceShell>
  </Providers>;
}
