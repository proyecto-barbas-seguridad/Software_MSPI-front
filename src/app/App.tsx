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
    <WorkspaceShell mode={mode} onToggleMode={() => setMode(mode === 'light' ? 'dark' : 'light')} panelHref={panelHref} section={state.section} actionsHref={state.company && capabilities(state.company).actions ? '/interfaz/#/empresas/' + state.company.empresaId + '/acciones' : undefined} actionsLabel={state.company && capabilities(state.company).read ? 'Acciones' : 'Mis acciones'}>
      <AccessWorkspace store={store} />
    </WorkspaceShell>
  </Providers>;
}
