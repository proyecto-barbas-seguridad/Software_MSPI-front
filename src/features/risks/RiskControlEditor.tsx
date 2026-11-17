import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import ControlPanel, { ControlError, ControlPager, useControlRead } from '../controls/ControlPanel';
import { controlLabels, validateControl, validatePage } from '../controls/controls';
import type { ControlService } from '../controls/controls';
import { validators } from './risks';
import type { NewControlLink, Risk, RiskService } from './risks';
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
export default function RiskControlEditor({ company, zone, risk, service, controls, scope, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  company: string; zone: string; risk: Risk; service: RiskService; controls: ControlService; scope?: AbortSignal;
  onSaved: () => void; onCancel: () => void; onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const [page, setPage] = useState(0); const [selected, setSelected] = useState<{ id: string; label: string }>();
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const load = useCallback(async (signal: AbortSignal) => validatePage(await controls.list(company, page, signal), page, item => validateControl(item)), [controls, company, page]);
  const state = useControlRead(load, { scope, onAuthorization });
  const heading = useRef<HTMLHeadingElement>(null); const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !request.current?.signal.aborted && !scope?.aborted;
  const fieldError = (name: string) => error?.fields.find(field => field.field === name)?.message;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || scope?.aborted || risk.estado === 'CERRADO') return;
    const values = new FormData(event.currentTarget); const effect = String(values.get('efectoEsperado') || ''); const reason = String(values.get('justificacion') || '').trim();
    if (!selected || !['PROBABILIDAD', 'IMPACTO', 'AMBOS'].includes(effect) || !reason) { setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Selecciona una implementación, el efecto esperado y una justificación.')); return; }
    const controller = request.current = new AbortController(); busy.current = true; setPending(true); setError(undefined); onDirty(true); onPending(true);
    try {
      const body: NewControlLink = { revisionEsperada: risk.revision, implementacionId: selected.id, efectoEsperado: effect as NewControlLink['efectoEsperado'], justificacion: reason };
      const result = await service.link(company, risk.riesgoId, body, controller.signal); validators.links(result, risk.riesgoId);
      if (result.revisionRiesgo !== risk.revision + 1 || result.implementacionId !== selected.id || result.efectoEsperado !== effect || result.justificacion !== reason) throw new Error('Invalid control link response');
      if (current()) { onDirty(false); onSaved(); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el vínculo guardado.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem);
      if (problem.status === 0 || problem.status >= 500 || problem.status === 404 || (problem.status === 409 && problem.code !== 'IMPLEMENTACION_NO_DISPONIBLE')) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label="Vincular implementación de control" onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>Vincular implementación de control</Typography><Typography>{risk.codigo} · Revisión {risk.revision}</Typography>
    <Typography>Elige una implementación de esta empresa, indica el efecto esperado y justifica el vínculo. Puede estar propuesta o en implementación: vincular no acredita aplicación o eficacia, no selecciona verificaciones para una valoración residual y no reduce el riesgo automáticamente.</Typography>
    {error && <Alert severity="error">{error.message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}</Alert>}{error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de reintentar.</Typography>}
    {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'El resultado no se confirmó y puede haberse guardado. No se reenviará automáticamente; consulta los vínculos antes de otra escritura.' : 'El vínculo ya existe o el estado/revisión cambió. Consulta la ficha y los vínculos antes de continuar.'}</Alert>}
    <Box component="fieldset" disabled={pending || blocked} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      {state.loading && <Typography role="status">Consultando implementaciones de la empresa…</Typography>}{state.error && <ControlError error={state.error} />}
      <Typography component="label" htmlFor="link-control">Implementación de control *</Typography><Box component="select" id="link-control" value={selected?.id || ''} required disabled={state.loading || Boolean(state.error)} aria-invalid={Boolean(fieldError('implementacionId'))} sx={fields} onChange={event => {
        const item = state.data?.elementos.find(item => item.implementacionId === event.target.value); setSelected(item ? { id: item.implementacionId, label: item.versionActual.detalle.nombre } : selected?.id === event.target.value ? selected : undefined);
      }}><option value="">Seleccionar…</option>{selected && !state.data?.elementos.some(item => item.implementacionId === selected.id) && <option value={selected.id}>{selected.label} · Selección conservada</option>}{state.data?.elementos.map(item => <option key={item.implementacionId} value={item.implementacionId}>{item.versionActual.detalle.nombre} · {controlLabels[item.estado]} · {controlLabels[item.resultadoVigente]}</option>)}</Box>
      {fieldError('implementacionId') && <Typography role="alert" color="error">{fieldError('implementacionId')}</Typography>}
      {!state.loading && state.data && !state.data.elementos.length && <Typography>No hay implementaciones en esta página.</Typography>}
      {state.data && <ControlPager page={page} more={state.data.hayMas} label="implementaciones" load={setPage} />}<Button disabled={state.loading} onClick={state.retry}>Actualizar implementaciones</Button>
      {selected && <SelectedPreview key={selected.id} company={company} controlId={selected.id} service={controls} zone={zone} scope={scope} onAuthorization={onAuthorization} />}
      <Typography component="label" htmlFor="link-effect">Efecto esperado *</Typography><Box component="select" id="link-effect" name="efectoEsperado" required defaultValue="" aria-invalid={Boolean(fieldError('efectoEsperado'))} sx={fields}><option value="">Seleccionar…</option><option value="PROBABILIDAD">Probabilidad</option><option value="IMPACTO">Impacto</option><option value="AMBOS">Probabilidad e impacto</option></Box>{fieldError('efectoEsperado') && <Typography role="alert" color="error">{fieldError('efectoEsperado')}</Typography>}
      <Typography component="label" htmlFor="link-reason">Justificación *</Typography><Box component="textarea" id="link-reason" name="justificacion" required rows={4} aria-invalid={Boolean(fieldError('justificacion'))} sx={fields} />{fieldError('justificacion') && <Typography role="alert" color="error">{fieldError('justificacion')}</Typography>}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked}>{pending ? 'Vinculando…' : 'Guardar vínculo'}</Button><Button onClick={onCancel}>Cancelar y volver</Button>
      {blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultarán la ficha y sus vínculos. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}
function SelectedPreview(props: Parameters<typeof ControlPanel>[0]) {
  const [open, setOpen] = useState(false);
  return <Box component="details" onToggle={event => setOpen(event.currentTarget.open)}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Consultar implementación seleccionada</Typography>{open && <ControlPanel {...props} />}</Box>;
}
