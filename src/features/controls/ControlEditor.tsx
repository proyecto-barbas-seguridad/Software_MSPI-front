import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { ControlError, ControlPager, useControlRead } from './ControlPanel';
import { controlLabels, uuid, validateControl, validatePage } from './controls';
import type { Choice, Control, ControlService, NewControl, Page } from './controls';
export type ControlMode = 'create' | 'start' | 'change';
const titles = { create: 'Crear implementación', start: 'Iniciar implementación', change: 'Registrar cambio de implementación' };
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
export default function ControlEditor({ company, control, mode, service, scope, onAuthorization, onDirty, onPending, onCancel, onSaved }: {
  company: Company; control?: Control; mode: ControlMode; service: ControlService; scope?: AbortSignal;
  onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onCancel: () => void; onSaved: (created?: Control) => void;
}) {
  const initial = mode === 'change' ? control?.versionActual.detalle : undefined;
  const [catalog, setCatalog] = useState(''); const [element, setElement] = useState(''); const [responsible, setResponsible] = useState(initial?.responsableId || '');
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !scope?.aborted && !request.current?.signal.aborted;
  const permitted = capabilities(company).write && (mode === 'create' || (control && control.estado === (mode === 'start' ? 'PROPUESTO' : 'IMPLEMENTADO')));
  const catalogs = useCallback((page: number, signal: AbortSignal) => service.catalogs(company.empresaId, page, signal), [company.empresaId, service]);
  const elements = useCallback((page: number, signal: AbortSignal) => service.elements(company.empresaId, catalog, page, signal), [company.empresaId, catalog, service]);
  const responsibles = useCallback((page: number, signal: AbortSignal) => service.responsibles(company.empresaId, page, signal), [company.empresaId, service]);
  const errorFor = (name: string) => error?.fields.find(field => field.field === name || field.field === 'detalle.' + name)?.message;
  const field = (name: 'nombre' | 'descripcion' | 'alcance' | 'trabajo' | 'motivo', label: string, value = '', max?: number) => <Stack spacing={1}><Typography component="label" htmlFor={'control-' + name}>{label} *</Typography><Box component="textarea" id={'control-' + name} name={name} defaultValue={value} required rows={name === 'nombre' ? 2 : 4} maxLength={max} aria-invalid={Boolean(errorFor(name))} aria-describedby={errorFor(name) ? 'control-error-' + name : undefined} sx={fields} />{errorFor(name) && <Typography role="alert" color="error" id={'control-error-' + name}>{errorFor(name)}</Typography>}</Stack>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || scope?.aborted || !permitted) return;
    const values = new FormData(event.currentTarget); const text = (name: string) => String(values.get(name) || '').trim();
    const detalle: NewControl['detalle'] = { nombre: text('nombre'), descripcion: text('descripcion'), alcance: text('alcance'), trabajo: text('trabajo'), responsableId: responsible, tipo: (text('tipo') || null) as NewControl['detalle']['tipo'], modo: (text('modo') || null) as NewControl['detalle']['modo'] };
    const reason = text('motivo');
    if (mode !== 'start' && (!detalle.nombre || detalle.nombre.length > 250 || !detalle.descripcion || !detalle.alcance || !detalle.trabajo || !uuid.test(responsible) || (detalle.tipo !== null && !['PREVENTIVO', 'DETECTIVO', 'CORRECTIVO'].includes(detalle.tipo!)) || (detalle.modo !== null && !['MANUAL', 'AUTOMATICO'].includes(detalle.modo!)) || (mode === 'create' && (!uuid.test(catalog) || !uuid.test(element))))) { setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Completa los datos obligatorios y selecciona las referencias empresariales.')); return; }
    if (mode === 'change' && (!reason || reason.length > 2000)) { setError(new ApiError(400, 'MOTIVO_INVALIDO', 'Justifica el cambio con un motivo de hasta 2000 caracteres.')); return; }
    if (mode !== 'create' && !window.confirm(titles[mode] + '. ' + (mode === 'change' ? 'Se conservará la versión anterior y la nueva quedará en implementación, sin verificar. ' : 'Este avance no acredita aplicación ni efectividad. ') + '¿Confirmar?')) return;
    busy.current = true; request.current = new AbortController(); setPending(true); onPending(true); onDirty(true); setError(undefined);
    try {
      const result = validateControl(mode === 'create' ? await service.create(company.empresaId, { versionCatalogoId: catalog, elementoId: element, detalle }, request.current.signal) : mode === 'start' ? await service.start(company.empresaId, control!.implementacionId, control!.revision, request.current.signal) : await service.change(company.empresaId, control!.implementacionId, { revisionEsperada: control!.revision, detalle, motivo: reason }, request.current.signal), mode === 'create' ? undefined : control!.implementacionId);
      const version = result.versionActual;
      if (result.estado !== (mode === 'create' ? 'PROPUESTO' : 'EN_IMPLEMENTACION') || result.revision !== (mode === 'create' ? 0 : control!.revision + 1) || result.versionCatalogoId !== (mode === 'create' ? catalog : control!.versionCatalogoId) || result.elementoId !== (mode === 'create' ? element : control!.elementoId) || result.resultadoVigente !== 'SIN_VERIFICAR' || result.ultimaVerificacionId !== null || result.causaSinVigencia !== null || version.aplicacion !== null) throw new Error('Invalid control mutation');
      if (mode === 'start' ? version.versionId !== control!.versionActual.versionId || version.numero !== control!.versionActual.numero || Object.entries(control!.versionActual.detalle).some(([key, value]) => (version.detalle[key as keyof typeof detalle] ?? null) !== (value ?? null)) : Object.entries(detalle).some(([key, value]) => (version.detalle[key as keyof typeof detalle] ?? null) !== value) || version.numero !== (mode === 'create' ? 1 : control!.versionActual.numero + 1) || version.motivoCambio !== (mode === 'create' ? null : reason) || (mode === 'change' && version.versionId === control!.versionActual.versionId)) throw new Error('Invalid control version');
      if (current()) { onDirty(false); onSaved(mode === 'create' ? result : undefined); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado de la implementación.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem); const correctable = ['CONTROL_CATALOGO_NO_DISPONIBLE', 'RESPONSABLE_NO_DISPONIBLE'].includes(problem.code);
      if ([0, 404].includes(problem.status) || problem.status >= 500 || (problem.status === 409 && !correctable)) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={titles[mode]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{titles[mode]}</Typography>{control && <Typography>{control.versionActual.detalle.nombre} · Versión {control.versionActual.numero} · Revisión {control.revision}</Typography>}
    <Typography>{mode === 'create' ? 'Selecciona un control de un catálogo disponible. La implementación empresarial tendrá descripción y responsable propios; no altera la respuesta de una evaluación ni reduce el riesgo automáticamente.' : mode === 'start' ? 'Iniciar el trabajo conserva la versión propuesta y la deja en implementación. La aplicación y su verificación requieren pasos posteriores.' : 'El cambio crea una nueva versión y conserva aplicación y verificaciones anteriores como antecedentes. La implementación vuelve a trabajo pendiente y su resultado actual queda sin verificar; las valoraciones de riesgos dependientes pueden requerir revisión.'}</Typography>
    {!permitted && <Alert severity="warning">El estado o tus roles no permiten esta operación.</Alert>}{error && <ControlError error={error} />}
    {error?.fields.filter(item => !['nombre', 'descripcion', 'alcance', 'trabajo', 'motivo'].some(name => item.field === name || item.field === 'detalle.' + name)).map((item, index) => <Typography role="alert" key={index} color="error">{item.field}: {item.message}</Typography>)}
    {blocked && <Alert severity="warning">El estado cambió o la operación puede haberse guardado. No se reenviará automáticamente. Conserva el formulario hasta decidir consultar el servidor.{mode === 'create' && ' Encontrar una implementación con el mismo nombre no demuestra que la haya creado esta solicitud.'}</Alert>}
    {mode !== 'start' && <Box component="fieldset" disabled={pending || blocked || !permitted} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      {mode === 'create' ? <><ControlChoice label="Versión de catálogo" load={catalogs} scope={scope} onAuthorization={onAuthorization} onChange={value => { setCatalog(value); setElement(''); }} />{catalog && <ControlChoice key={catalog} label="Control del catálogo" load={elements} scope={scope} onAuthorization={onAuthorization} onChange={setElement} />}</> : <Typography>Referencia de catálogo conservada: {control?.versionCatalogoId} · Elemento: {control?.elementoId}</Typography>}
      {field('nombre', 'Nombre', initial?.nombre, 250)}{field('descripcion', 'Descripción', initial?.descripcion)}{field('alcance', 'Alcance', initial?.alcance)}{field('trabajo', 'Trabajo a ejecutar', initial?.trabajo)}
      <ControlChoice label="Responsable de negocio" load={responsibles} initial={initial?.responsableId} scope={scope} onAuthorization={onAuthorization} onChange={setResponsible} />
      {(['tipo', 'modo'] as const).map(name => <Stack spacing={1} key={name}><Typography component="label" htmlFor={'control-' + name}>{name === 'tipo' ? 'Tipo de control' : 'Modo de operación'}</Typography><Box component="select" id={'control-' + name} name={name} defaultValue={initial?.[name] || ''} sx={fields}><option value="">Pendiente</option>{(name === 'tipo' ? ['PREVENTIVO', 'DETECTIVO', 'CORRECTIVO'] : ['MANUAL', 'AUTOMATICO']).map(value => <option key={value} value={value}>{controlLabels[value]}</option>)}</Box></Stack>)}
      {mode === 'change' && field('motivo', 'Motivo del cambio', '', 2000)}
    </Stack></Box>}
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || !permitted}>{pending ? 'Guardando…' : titles[mode]}</Button><Button onClick={onCancel}>Cancelar y volver</Button>{blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará el servidor antes de otra escritura. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}</Stack>
  </Stack></Box>;
}
function ControlChoice({ label, load, initial, scope, onAuthorization, onChange }: { label: string; load: (page: number, signal: AbortSignal) => Promise<Page<Choice>>; initial?: string; scope?: AbortSignal; onAuthorization: (error: ApiError) => void; onChange: (id: string) => void }) {
  const [page, setPage] = useState(0); const [selected, setSelected] = useState<Choice | undefined>(initial ? { id: initial, label: 'Referencia actual · ' + initial } : undefined);
  const read = useCallback(async (signal: AbortSignal) => validatePage(await load(page, signal), page, item => { if (!item || !uuid.test(item.id) || typeof item.label !== 'string' || !item.label.trim()) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudieron validar las referencias.'); }), [load, page]);
  const state = useControlRead(read, { scope, onAuthorization });
  const input = 'control-choice-' + label.replaceAll(' ', '-');
  return <Stack spacing={1} aria-busy={state.loading}><Typography component="label" htmlFor={input}>{label} *</Typography><Box component="select" id={input} required value={selected?.id || ''} disabled={state.loading || Boolean(state.error)} sx={fields} onChange={event => { const choice = state.data?.elementos.find(item => item.id === event.target.value) || (event.target.value === selected?.id ? selected : undefined); setSelected(choice); onChange(choice?.id || ''); }}><option value="">Seleccionar…</option>{selected && !state.data?.elementos.some(item => item.id === selected.id) && <option value={selected.id}>{selected.label} · Selección conservada</option>}{state.data?.elementos.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Box>
    {state.loading && <Typography role="status">Consultando {label.toLowerCase()}…</Typography>}{state.error && <ControlError error={state.error} />}{state.data && !state.data.elementos.length && <Typography>No hay opciones en esta página de {label.toLowerCase()}.</Typography>}{initial && <Typography>La referencia guardada se conserva; el servidor comprueba que el responsable siga activo.</Typography>}
    {state.data && <ControlPager page={page} more={state.data.hayMas} label={label} load={setPage} />}<Button disabled={state.loading} onClick={state.retry}>Actualizar {label.toLowerCase()}</Button>
  </Stack>;
}
