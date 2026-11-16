import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { assetTypes, uuid, validateAsset } from './inventory';
import type { Asset, InventoryService, InventoryState, NewAsset } from './inventory';

export type EditMode = 'create' | 'edit' | 'archive' | 'restore';
const titles = { create: 'Crear activo', edit: 'Editar activo', archive: 'Archivar activo', restore: 'Restaurar activo' };
const fieldStyle = { width: '100%', minHeight: 44, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
type Choice = { id: string; label: string };
export default function AssetEditor({ companyId, mode, initial, service, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  companyId: string; mode: EditMode; initial: InventoryState; service: InventoryService;
  onSaved: (asset?: Asset, searchCode?: string) => void; onCancel: () => void; onAuthorization: (error: ApiError) => void;
  onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const asset = initial.asset;
  const [error, setError] = useState<ApiError>();
  const [pending, setPending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [replaceRefs, setReplaceRefs] = useState(false);
  const [refs, setRefs] = useState({ procesoId: asset?.procesoId || '', propietarioId: asset?.propietarioId || '', custodioId: asset?.custodioId || '' });
  const controller = useRef<AbortController | undefined>(undefined);
  const submitting = useRef(false);
  const alive = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const code = useRef(asset?.codigo || '');
  useEffect(() => {
    alive.current = true; heading.current?.focus();
    return () => { alive.current = false; controller.current?.abort(); onDirty(false); onPending(false); };
  }, [onDirty, onPending]);
  const fieldError = (name: string) => error?.fields.find(field => field.field === name || field.field === 'referencias.' + name)?.message;
  const invalid = (name: string) => Boolean(fieldError(name));
  const help = (name: string) => fieldError(name) && <Typography id={'error-' + name} color="error" role="alert">{fieldError(name)}</Typography>;
  const basic = mode === 'create' || mode === 'edit';
  const showRefs = basic || (mode === 'restore' && replaceRefs);
  const selected = (name: keyof typeof refs, label?: string): Choice | undefined => refs[name] ? { id: refs[name], label: label || refs[name] } : undefined;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || blocked) return;
    const values = new FormData(event.currentTarget);
    const body: NewAsset = { codigo: String(values.get('codigo') || '').trim(), nombre: String(values.get('nombre') || '').trim(),
      descripcion: String(values.get('descripcion') || '').trim(), tipo: String(values.get('tipo')) as NewAsset['tipo'],
      procesoId: refs.procesoId, propietarioId: refs.propietarioId, custodioId: refs.custodioId || null,
      ubicacion: String(values.get('ubicacion') || '').trim() || null };
    if (basic && (!body.codigo && mode === 'create' || !body.nombre || !body.descripcion || !Object.hasOwn(assetTypes, body.tipo)
      || !uuid.test(refs.procesoId) || !uuid.test(refs.propietarioId))) {
      setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Completa los campos obligatorios y sus referencias.')); return;
    }
    code.current = asset?.codigo || body.codigo;
    const motivo = String(values.get('motivo') || '').trim();
    if (!basic && !motivo) { setError(new ApiError(400, 'MOTIVO_REQUERIDO', 'El motivo es obligatorio.')); return; }
    if ((mode === 'archive' || mode === 'restore') && !window.confirm(`¿Deseas ${mode === 'archive' ? 'archivar' : 'restaurar'} ${asset?.codigo}? Se registrará el motivo.`)) return;
    const request = controller.current = new AbortController();
    submitting.current = true; setPending(true); onDirty(true); onPending(true); setError(undefined);
    try {
      let result: Asset;
      if (mode === 'create') result = await service.create(companyId, body, request.signal);
      else if (mode === 'edit') {
        const { codigo: _, ...fields } = body;
        result = await service.edit(companyId, asset!.activoId, { ...fields, revisionEsperada: asset!.revision }, request.signal);
      } else if (mode === 'archive') result = await service.archive(companyId, asset!.activoId, { revisionEsperada: asset!.revision, motivo }, request.signal);
      else result = await service.restore(companyId, asset!.activoId, { revisionEsperada: asset!.revision, motivo,
        ...(replaceRefs ? { referencias: { ...refs, custodioId: refs.custodioId || null } } : {}) }, request.signal);
      validateAsset(result, asset?.activoId);
      if (!alive.current || request.signal.aborted) return;
      onDirty(false); onSaved(result);
    } catch (failure) {
      if (!alive.current || request.signal.aborted) return;
      const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar la respuesta.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem);
      if (problem.status === 0 || problem.status >= 500 || ['REVISION_DESACTUALIZADA', 'ESTADO_INCOMPATIBLE', 'REGISTRO_ARCHIVADO'].includes(problem.code)) setBlocked(true);
    } finally {
      submitting.current = false;
      if (alive.current) { setPending(false); onPending(false); }
    }
  }
  async function reconcile() {
    if (!asset) { onDirty(false); onSaved(undefined, code.current); return; }
    if (!window.confirm('Se descartarán los cambios del formulario y se consultará la ficha actual. ¿Continuar?')) return;
    controller.current?.abort(); const request = controller.current = new AbortController(); setPending(true);
    try {
      const latest = validateAsset(await service.asset(companyId, asset.activoId, request.signal), asset.activoId);
      if (alive.current && !request.signal.aborted) { onDirty(false); onSaved(latest); }
    } catch (failure) {
      if (!alive.current || request.signal.aborted) return;
      const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo consultar la ficha.');
      if ([401, 403].includes(problem.status)) { onDirty(false); onAuthorization(problem); } else setError(problem);
    } finally { if (alive.current) setPending(false); }
  }
  return <Box component="form" ref={form} onSubmit={submit} onChange={() => onDirty(true)} aria-label={titles[mode]} aria-busy={pending}>
    <Stack spacing={3}>
      <Typography variant="h2" tabIndex={-1} ref={heading}>{titles[mode]}</Typography>
      <Typography>{asset ? `${asset.codigo} · ${asset.nombre}` : 'El código quedará reservado en esta empresa, incluso si el activo se archiva.'}</Typography>
      {error && <Alert severity="error"><Stack spacing={1}><Typography>{error.code === 'CODIGO_ACTIVO_DUPLICADO' ? 'El código ya pertenece a un activo de esta empresa. Elige otro código.' : error.code === 'REVISION_DESACTUALIZADA' ? 'Otra persona modificó el activo. Consulta la versión actual antes de volver a editar.' : error.message}</Typography>
        {error.correlationId && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Referencia de soporte: {error.correlationId}</Typography>}</Stack></Alert>}
      {error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de volver a intentar.</Typography>}
      {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'No se confirmó el resultado de la operación. Puede haberse aplicado en el servidor. Consulta su estado antes de intentar otra escritura.' : 'El estado o la revisión cambió. Se conserva tu borrador y no se reenvía automáticamente.'}</Alert>}
      <Box component="fieldset" disabled={pending} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}><Stack spacing={2}>
        {basic && <>
          <Stack spacing={1}><Typography component="label" htmlFor="edit-code">Código {mode === 'create' ? '(obligatorio)' : '(no modificable)'}</Typography><Box component="input" id="edit-code" name="codigo" required={mode === 'create'} readOnly={mode !== 'create'} maxLength={80} defaultValue={asset?.codigo || ''} sx={fieldStyle} aria-invalid={invalid('codigo')} aria-describedby={fieldError('codigo') ? 'error-codigo' : undefined} />{help('codigo')}</Stack>
          <Stack spacing={1}><Typography component="label" htmlFor="edit-name">Nombre (obligatorio)</Typography><Box component="input" id="edit-name" name="nombre" required maxLength={250} defaultValue={asset?.nombre || ''} sx={fieldStyle} aria-invalid={invalid('nombre')} />{help('nombre')}</Stack>
          <Stack spacing={1}><Typography component="label" htmlFor="edit-description">Descripción (obligatoria)</Typography><Box component="textarea" id="edit-description" name="descripcion" required rows={4} defaultValue={asset?.descripcion || ''} sx={fieldStyle} aria-invalid={invalid('descripcion')} />{help('descripcion')}</Stack>
          <Stack spacing={1}><Typography component="label" htmlFor="edit-type">Tipo (obligatorio)</Typography><Box component="select" id="edit-type" name="tipo" required defaultValue={asset?.tipo || ''} sx={fieldStyle}><option value="">Selecciona un tipo</option>{Object.entries(assetTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Box>{help('tipo')}</Stack>
          <Stack spacing={1}><Typography component="label" htmlFor="edit-location">Ubicación</Typography><Box component="input" id="edit-location" name="ubicacion" maxLength={1000} defaultValue={asset?.ubicacion || ''} sx={fieldStyle} />{help('ubicacion')}</Stack>
        </>}
        {mode === 'restore' && <><Alert severity="info">La restauración requiere referencias activas. Puedes conservarlas para que el servidor las compruebe o seleccionar reemplazos.</Alert><Typography component="label"><Box component="input" type="checkbox" checked={replaceRefs} onChange={event => setReplaceRefs(event.target.checked)} /> Seleccionar referencias de reemplazo</Typography></>}
        {showRefs && <>
          <Typography color="text.secondary">Las nuevas referencias deben estar activas en esta empresa. Al editar puedes conservar una relación ya asignada, aunque se haya archivado.</Typography>
          <ReferencePicker companyId={companyId} service={service} kind="processes" label="Proceso" required value={selected('procesoId', initial.process?.nombre)} onChange={value => setRefs({ ...refs, procesoId: value })} onAuthorization={onAuthorization} />{help('procesoId')}
          <ReferencePicker companyId={companyId} service={service} kind="responsibles" label="Propietario" required value={selected('propietarioId', initial.owner?.nombre)} onChange={value => setRefs({ ...refs, propietarioId: value })} onAuthorization={onAuthorization} />{help('propietarioId')}
          <ReferencePicker companyId={companyId} service={service} kind="responsibles" label="Custodio" value={selected('custodioId', initial.custodian?.nombre)} onChange={value => setRefs({ ...refs, custodioId: value })} onAuthorization={onAuthorization} />{help('custodioId')}
        </>}
        {!basic && <Stack spacing={1}><Typography component="label" htmlFor="edit-reason">Motivo (obligatorio)</Typography><Box component="textarea" id="edit-reason" name="motivo" required maxLength={1000} rows={3} sx={fieldStyle} aria-invalid={invalid('motivo')} />{help('motivo')}<Typography color="text.secondary">{mode === 'archive' ? 'El archivo conserva el activo, su código y el historial. No elimina físicamente la información.' : 'La restauración no modifica las clasificaciones existentes.'}</Typography></Stack>}
      </Stack></Box>
      <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Button type="submit" variant="contained" disabled={pending || blocked}>{pending ? 'Procesando…' : titles[mode]}</Button>
        <Button disabled={pending} onClick={onCancel}>Cancelar</Button>
        {blocked && <Button disabled={pending} onClick={() => { void reconcile(); }}>{asset ? 'Descartar borrador y consultar ficha actual' : 'Volver al inventario y buscar el código'}</Button>}
      </Stack>
    </Stack>
  </Box>;
}
function ReferencePicker({ companyId, service, kind, label, required, value, onChange, onAuthorization }: {
  companyId: string; service: InventoryService; kind: 'processes' | 'responsibles'; label: string; required?: boolean;
  value?: Choice; onChange: (id: string) => void; onAuthorization: (error: ApiError) => void;
}) {
  const [page, setPage] = useState(0); const [retry, setRetry] = useState(0);
  const [options, setOptions] = useState<Choice[]>([]); const [more, setMore] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState<ApiError>();
  const names = useRef(new Map<string, string>());
  useEffect(() => {
    const controller = new AbortController(); let active = true; setLoading(true); setError(undefined); setOptions([]);
    const load = kind === 'processes' ? service.processes(companyId, page, controller.signal) : service.responsibles(companyId, page, controller.signal);
    void load.then(result => {
      if (!active) return;
      if (!result || result.pagina !== page || result.tamano !== 5 || !Array.isArray(result.elementos) || typeof result.hayMas !== 'boolean') throw new ApiError(502, 'RESPUESTA_INVALIDA', 'Selector no disponible.');
      const choices = result.elementos.map(entry => {
        const id = 'procesoId' in entry ? entry.procesoId : entry.responsableId;
        if (!uuid.test(id) || typeof entry.nombre !== 'string' || entry.estado !== 'ACTIVO') throw new ApiError(502, 'RESPUESTA_INVALIDA', 'Referencia no disponible.');
        return { id, label: entry.nombre };
      });
      choices.forEach(choice => names.current.set(choice.id, choice.label)); setOptions(choices); setMore(result.hayMas);
    }).catch(failure => {
      if (!active) return;
      const problem = failure instanceof ApiError ? failure : new ApiError(0, 'SIN_CONEXION', 'No se pudo cargar el selector.'); setError(problem);
      if ([401, 403].includes(problem.status)) onAuthorization(problem);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [companyId, service, kind, page, retry, onAuthorization]);
  const id = 'reference-' + label.toLowerCase();
  return <Stack spacing={1}><Typography component="label" htmlFor={id}>{label}{required ? ' (obligatorio)' : ''}</Typography>
    <Box component="select" id={id} required={required} value={value?.id || ''} onChange={event => onChange(event.target.value)} sx={fieldStyle} aria-describedby={id + '-hint'}>
      <option value="">{required ? 'Selecciona una referencia' : 'Sin custodio'}</option>
      {value && !options.some(option => option.id === value.id) && <option value={value.id}>{names.current.get(value.id) || value.label} · Selección conservada</option>}
      {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
    </Box>
    <Typography id={id + '-hint'} variant="body2" color="text.secondary">Página {page + 1} de referencias activas. La selección se conserva al paginar.</Typography>
    {loading && <Typography role="status">Consultando {label.toLowerCase()}…</Typography>}
    {error && <Alert severity="warning">{error.message}<Button onClick={() => setRetry(retry + 1)}>Reintentar {label.toLowerCase()}</Button></Alert>}
    {!loading && !error && !options.length && <Typography>No hay referencias activas en esta página.</Typography>}
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button disabled={loading || page === 0} onClick={() => setPage(page - 1)} aria-label={`Anterior en ${label.toLowerCase()}`}>Anterior</Button><Button disabled={loading || Boolean(error) || !more} onClick={() => setPage(page + 1)} aria-label={`Siguiente en ${label.toLowerCase()}`}>Siguiente</Button><Button disabled={loading} onClick={() => setRetry(retry + 1)}>Actualizar {label.toLowerCase()}</Button></Stack>
  </Stack>;
}
