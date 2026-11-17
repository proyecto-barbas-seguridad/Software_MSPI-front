import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { uuid, validatePage, validateRisk } from './risks';
import type { NewRisk, Reference, Risk, RiskService } from './risks';
export type RiskMode = 'create' | 'edit' | 'analyze';
const titles = { create: 'Crear riesgo', edit: 'Editar riesgo', analyze: 'Iniciar análisis' };
const fields = { width: '100%', minHeight: 44, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
export default function RiskEditor({ companyId, risk, mode, service, scope, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  companyId: string; risk?: Risk; mode: RiskMode; service: RiskService; scope?: AbortSignal; onSaved: (created?: Risk, inspectCode?: string) => void; onCancel: () => void;
  onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const [asset, setAsset] = useState(risk?.detalle.activoPrincipalId || ''); const [responsible, setResponsible] = useState(risk?.detalle.responsableId || '');
  const busy = useRef(false); const alive = useRef(false); const request = useRef<AbortController | undefined>(undefined); const heading = useRef<HTMLHeadingElement>(null); const code = useRef(risk?.codigo || '');
  const locked = mode === 'edit' && (risk?.estado === 'EN_TRATAMIENTO' || risk?.estado === 'EN_SEGUIMIENTO');
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !request.current?.signal.aborted && !scope?.aborted;
  const fieldError = (name: string) => error?.fields.find(field => field.field === name || field.field === 'detalle.' + name)?.message;
  const help = (name: string) => fieldError(name) && <Typography id={'risk-error-' + name} role="alert" color="error">{fieldError(name)}</Typography>;
  const field = (name: string, label: string, value: string, required: boolean, multiline = false, maxLength?: number) => <Stack spacing={1}><Typography component="label" htmlFor={'risk-edit-' + name}>{label}{required ? ' *' : ''}</Typography>
    {multiline ? <Box component="textarea" id={'risk-edit-' + name} name={name} defaultValue={value} rows={4} required={required} maxLength={maxLength} aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? 'risk-error-' + name : undefined} sx={fields} />
      : <Box component="input" id={'risk-edit-' + name} name={name} defaultValue={value} required={required} maxLength={maxLength} aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? 'risk-error-' + name : undefined} sx={fields} />}{help(name)}</Stack>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || scope?.aborted) return;
    if (mode !== 'create' && (!risk || risk.estado === 'CERRADO' || (mode === 'analyze' && risk.estado !== 'IDENTIFICADO'))) return;
    const values = new FormData(event.currentTarget); const value = (name: string) => String(values.get(name) || '').trim();
    const treatment = value('tratamientoPropuesto');
    const detalle: NewRisk['detalle'] = locked ? { ...risk!.detalle, responsableId: responsible } : { activoPrincipalId: asset, responsableId: responsible, amenaza: value('amenaza'), vulnerabilidad: value('vulnerabilidad'), descripcion: value('descripcion'), tratamientoPropuesto: treatment ? treatment as NewRisk['detalle']['tratamientoPropuesto'] : null };
    const codigo = risk?.codigo || value('codigo'); code.current = codigo;
    const changed = risk && (detalle.activoPrincipalId !== risk.detalle.activoPrincipalId || detalle.amenaza !== risk.detalle.amenaza || detalle.vulnerabilidad !== risk.detalle.vulnerabilidad || detalle.descripcion !== risk.detalle.descripcion);
    const motivo = value('motivo');
    if (mode !== 'analyze' && (!codigo || codigo.length > 80 || !uuid.test(detalle.activoPrincipalId) || !uuid.test(detalle.responsableId) || !detalle.amenaza || detalle.amenaza.length > 1000 || !detalle.vulnerabilidad || detalle.vulnerabilidad.length > 1000 || !detalle.descripcion || (detalle.tratamientoPropuesto != null && !['REDUCIR', 'COMPARTIR', 'ACEPTAR', 'EVITAR'].includes(detalle.tratamientoPropuesto)))) {
      setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Completa los campos obligatorios y selecciona las referencias de esta empresa.')); return;
    }
    if (mode === 'edit' && (motivo.length > 2000 || (changed && risk?.inherenteVigenteId && !motivo))) { setError(new ApiError(400, 'MOTIVO_RIESGO_INVALIDO', 'Justifica el cambio de contexto ya valorado, con un motivo de hasta 2000 caracteres.')); return; }
    if (mode === 'analyze' && !window.confirm(`¿Iniciar el análisis de ${risk!.codigo}? Se registrará el cambio de estado.`)) return;
    const controller = request.current = new AbortController(); busy.current = true; setPending(true); setError(undefined); onDirty(true); onPending(true);
    try {
      const result = validateRisk(mode === 'create' ? await service.create(companyId, { codigo, detalle }, controller.signal)
        : mode === 'edit' ? await service.edit(companyId, risk!.riesgoId, { revisionEsperada: risk!.revision, detalle, motivo: motivo || null }, controller.signal)
          : await service.analyze(companyId, risk!.riesgoId, risk!.revision, controller.signal), risk?.riesgoId);
      if (result.codigo !== codigo || (mode === 'create' ? result.estado !== 'IDENTIFICADO' || result.inherenteVigenteId !== null || result.nivelInherente !== null
        : result.revision !== risk!.revision + 1 || result.estado !== (mode === 'analyze' ? 'EN_ANALISIS' : risk!.estado))) throw new Error('Invalid risk write response');
      if (current()) { onDirty(false); onSaved(mode === 'create' ? result : undefined); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado de la operación.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem);
      const correctable = mode !== 'analyze' && ['CODIGO_RIESGO_DUPLICADO', 'ACTIVO_PRINCIPAL_NO_DISPONIBLE', 'RESPONSABLE_NO_DISPONIBLE'].includes(problem.code);
      if (problem.status === 0 || problem.status >= 500 || problem.status === 404 || (problem.status === 409 && !correctable)) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={titles[mode]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{titles[mode]}</Typography><Typography>{risk ? `${risk.codigo} · Revisión ${risk.revision}` : 'El código identifica el riesgo dentro de la empresa. * Campo obligatorio.'}</Typography>
    {locked && <Alert severity="info">En tratamiento o seguimiento solo puedes cambiar el responsable. El contexto y el tratamiento se conservan.</Alert>}
    {mode === 'analyze' && <Typography>El riesgo pasará de identificado a en análisis. El servidor comprobará el estado, la revisión y que su responsable de negocio siga activo. No crea ni confirma una valoración.</Typography>}
    {error && <Alert severity="error">{error.message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}</Alert>}{error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de reintentar.</Typography>}
    {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'El resultado no se confirmó y puede haberse aplicado. No se reenviará automáticamente. Consulta el estado antes de otra escritura.' : 'El recurso, estado o revisión cambió. Se conserva el formulario sin sobrescribir ni reenviar automáticamente.'}{mode === 'create' && ' Encontrar el mismo código no demuestra que esta solicitud haya creado el registro.'}</Alert>}
    {mode !== 'analyze' && <Box component="fieldset" disabled={pending || blocked} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      {mode === 'create' ? field('codigo', 'Código', '', true, false, 80) : <Typography>Código: {risk!.codigo} · No editable</Typography>}
      <Box component="fieldset" disabled={locked} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
        <RiskReference company={companyId} kind="assets" service={service} initial={risk?.detalle.activoPrincipalId} scope={scope} onAuthorization={onAuthorization} disabled={locked} onChange={setAsset} />{help('activoPrincipalId')}
        {field('amenaza', 'Amenaza', risk?.detalle.amenaza || '', true, true, 1000)}{field('vulnerabilidad', 'Vulnerabilidad', risk?.detalle.vulnerabilidad || '', true, true, 1000)}{field('descripcion', 'Descripción', risk?.detalle.descripcion || '', true, true)}
        <Stack spacing={1}><Typography component="label" htmlFor="risk-edit-treatment">Tratamiento propuesto</Typography><Box component="select" id="risk-edit-treatment" name="tratamientoPropuesto" defaultValue={risk?.detalle.tratamientoPropuesto || ''} sx={fields}><option value="">Pendiente</option><option value="REDUCIR">Reducir</option><option value="COMPARTIR">Compartir</option><option value="ACEPTAR">Aceptar</option><option value="EVITAR">Evitar</option></Box>{help('tratamientoPropuesto')}<Typography color="text.secondary">Proponer aceptar no equivale a una aceptación aprobada. No se aplican descuentos automáticos.</Typography></Stack>
      </Stack></Box>
      <RiskReference company={companyId} kind="responsibles" service={service} initial={risk?.detalle.responsableId} scope={scope} onAuthorization={onAuthorization} onChange={setResponsible} />{help('responsableId')}
      {mode === 'edit' && <>{field('motivo', 'Motivo del cambio de contexto', '', false, true, 2000)}<Typography color="text.secondary">Obligatorio si cambias activo, amenaza, vulnerabilidad o descripción y existe una valoración inherente registrada. El servidor conservará antecedentes y marcará revisión cuando corresponda.</Typography></>}
    </Stack></Box>}
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked}>{pending ? 'Procesando…' : titles[mode]}</Button><Button onClick={onCancel}>Cancelar y volver</Button>
      {blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará el estado actual. ¿Continuar?')) { onDirty(false); onSaved(undefined, mode === 'create' ? code.current : undefined); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}
function RiskReference({ company, kind, initial, service, scope, onAuthorization, onChange, disabled = false }: { company: string; kind: 'assets' | 'responsibles'; initial?: string; service: RiskService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void; onChange: (id: string) => void; disabled?: boolean }) {
  const [page, setPage] = useState(0); const [search, setSearch] = useState(''); const [attempt, setAttempt] = useState(0); const [data, setData] = useState<Reference[]>([]); const [selected, setSelected] = useState<Reference | undefined>(initial ? { id: initial, label: 'Referencia actual · ' + initial } : undefined);
  const [more, setMore] = useState(false); const [loading, setLoading] = useState(!disabled); const [error, setError] = useState<ApiError>(); const filter = useRef<HTMLInputElement>(null);
  const label = kind === 'assets' ? 'Activo principal' : 'Responsable de negocio'; const input = 'risk-reference-' + kind;
  useEffect(() => {
    if (disabled || scope?.aborted) return;
    const request = new AbortController(); setLoading(true); setError(undefined); setData([]); setMore(false);
    const load = kind === 'assets' ? service.assets(company, page, search, request.signal) : service.responsibles(company, page, request.signal);
    void load.then(result => { validatePage(result, page, item => { if (!uuid.test(item.id) || typeof item.label !== 'string' || !item.label.trim()) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'Referencia no válida.'); }); if (!request.signal.aborted && !scope?.aborted) { setData(result.elementos); setMore(result.hayMas); setSelected(prior => prior ? result.elementos.find(item => item.id === prior.id) || prior : prior); } })
      .catch(failure => { if (request.signal.aborted || scope?.aborted) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo consultar el selector.'); setError(problem); if ([401, 403].includes(problem.status)) onAuthorization(problem); })
      .finally(() => { if (!request.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => request.abort();
  }, [company, kind, page, search, attempt, service, scope, onAuthorization, disabled]);
  return <Stack spacing={1} aria-busy={loading}><Typography component="label" htmlFor={input}>{label} *</Typography>
    {kind === 'assets' && !disabled && <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Box component="input" ref={filter} aria-label="Buscar activo por código o nombre" maxLength={200} sx={fields} /><Button disabled={loading} onClick={() => { setSearch(filter.current?.value.trim() || ''); setPage(0); setAttempt(value => value + 1); }}>Buscar activos</Button></Stack>}
    <Box component="select" id={input} required value={selected?.id || ''} disabled={disabled || loading || Boolean(error)} sx={fields} onChange={event => { const value = data.find(item => item.id === event.target.value) || (selected?.id === event.target.value ? selected : undefined); setSelected(value); onChange(value?.id || ''); }}>
      <option value="">Seleccionar…</option>{selected && !data.some(item => item.id === selected.id) && <option value={selected.id}>{selected.label} · Selección conservada</option>}{data.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </Box>{initial && <Typography variant="body2">La referencia actual se conserva aunque no aparezca entre las opciones activas; el backend valida cualquier sustitución.</Typography>}
    {loading && <Typography role="status">Consultando {label.toLowerCase()}…</Typography>}{error && <Alert severity="error">{error.message}</Alert>}{!disabled && !loading && !error && !data.length && <Typography>No hay referencias activas en esta página.</Typography>}
    {!disabled && <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}><Button disabled={loading || page === 0} aria-label={'Anterior en ' + label} onClick={() => setPage(page - 1)}>Anterior</Button><Typography sx={{ alignSelf: 'center' }}>Página {page + 1}</Typography><Button disabled={loading || !more} aria-label={'Siguiente en ' + label} onClick={() => setPage(page + 1)}>Siguiente</Button><Button disabled={loading} aria-label={'Actualizar ' + label} onClick={() => setAttempt(value => value + 1)}>Actualizar</Button></Stack>}
  </Stack>;
}
