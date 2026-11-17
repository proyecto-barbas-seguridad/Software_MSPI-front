import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { validateConfiguration, validateUpdate } from './configuration';
import type { Configuration, ConfigurationService, Update } from './configuration';
import { ConfigurationError } from './ConfigurationWorkspace';
import type { Access } from './ConfigurationWorkspace';
export default function ConfigurationEditor({ company, initial, service, scope, onAuthorization, onDirty, onPending, onCancel, onSaved, onReconciled }: { company: Company; initial: Configuration; service: ConfigurationService; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onCancel: () => void; onSaved: (latest: Configuration) => void; onReconciled: (latest: Configuration) => void } & Access) {
  const [nombre, setName] = useState(initial.nombre), [descripcion, setDescription] = useState(initial.descripcion ?? ''), [zonaHoraria, setZone] = useState(initial.zonaHoraria);
  const [pending, setPending] = useState(false), [blocked, setBlocked] = useState(false), [error, setError] = useState<ApiError>();
  const alive = useRef(false), busy = useRef(false), active = useRef<AbortController | undefined>(undefined), heading = useRef<HTMLHeadingElement>(null);
  const allowed = capabilities(company).admin; const dirty = nombre !== initial.nombre || descripcion !== (initial.descripcion ?? '') || zonaHoraria !== initial.zonaHoraria;
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; active.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  useEffect(() => { onDirty(dirty || blocked || pending); }, [dirty, blocked, pending, onDirty]);
  const current = () => alive.current && !scope?.aborted && !active.current?.signal.aborted;
  const fieldError = (field: string) => error?.fields.find(item => item.field === field)?.message;
  function problemFor(failure: unknown) { return failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado. Consulta el estado antes de reenviar.'); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || !allowed || scope?.aborted) return;
    let body: Update;
    try { body = validateUpdate({ nombre, descripcion: descripcion === (initial.descripcion ?? '') ? initial.descripcion : descripcion, zonaHoraria, revisionEsperada: initial.revision }); } catch (failure) { setError(problemFor(failure)); return; }
    if (body.zonaHoraria !== initial.zonaHoraria && !window.confirm(`Cambiar zona horaria de ${initial.zonaHoraria} a ${body.zonaHoraria}. Afecta la interpretación de fechas límite futuras; los eventos históricos conservan sus instantes absolutos. ¿Guardar el cambio?`)) return;
    busy.current = true; active.current = new AbortController(); setPending(true); onDirty(true); onPending(true); setError(undefined);
    let acknowledged = false;
    try {
      await service.save(company.empresaId, body, active.current.signal); acknowledged = true;
      if (!current()) return;
      const latest = validateConfiguration(await service.read(company.empresaId, active.current.signal));
      // No-op updates keep their revision. A later concurrent change may already be visible on this GET.
      const changed = body.nombre !== initial.nombre || body.descripcion !== initial.descripcion || body.zonaHoraria !== initial.zonaHoraria;
      if (latest.revision < initial.revision || (latest.revision === initial.revision && (changed || latest.nombre !== body.nombre || latest.descripcion !== body.descripcion || latest.zonaHoraria !== body.zonaHoraria))) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'La configuración consultada no concilia con la revisión guardada. Vuelve a consultar.');
      if (current()) { onDirty(false); onSaved(latest); }
    } catch (failure) {
      if (!current()) return; const problem = problemFor(failure);
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem); if (acknowledged || [0, 404, 409].includes(problem.status) || problem.status >= 500) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  async function reconcile() {
    if (busy.current || scope?.aborted || !allowed || !window.confirm('Se descartará el formulario y se consultará la configuración vigente antes de otra escritura. ¿Continuar?')) return;
    busy.current = true; active.current?.abort(); active.current = new AbortController(); setPending(true); onPending(true);
    try { const latest = validateConfiguration(await service.read(company.empresaId, active.current.signal)); if (current()) { onDirty(false); onReconciled(latest); } }
    catch (failure) { if (current()) { const problem = problemFor(failure); if ([401, 403].includes(problem.status)) { onDirty(false); onAuthorization(problem); } else setError(problem); } }
    finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label="Editar configuración empresarial" aria-busy={pending} onSubmit={save} onChange={() => onDirty(true)}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" tabIndex={-1} ref={heading}>Editar configuración empresarial</Typography><Typography>Revisión capturada: {initial.revision}. Cambia únicamente los datos básicos. La zona horaria interpreta fechas límite futuras; los eventos históricos conservan sus instantes absolutos.</Typography>
    {!allowed && <Alert severity="warning">Editar requiere AE en esta empresa.</Alert>}{error && <ConfigurationError error={error} />}
    {blocked && <Alert severity="warning">El estado cambió o el resultado no está confirmado. Puede haberse guardado en el servidor. Tu formulario se conserva y no se reenviará: consulta la configuración antes de otra escritura.</Alert>}
    <Box component="fieldset" disabled={pending || blocked || !allowed} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      <TextField label="Nombre" required value={nombre} slotProps={{ htmlInput: { maxLength: 200 } }} onChange={event => setName(event.target.value)} error={Boolean(fieldError('nombre'))} helperText={fieldError('nombre') || 'Hasta 200 caracteres.'} />
      <TextField label="Descripción" multiline minRows={4} value={descripcion} onChange={event => setDescription(event.target.value)} error={Boolean(fieldError('descripcion'))} helperText={fieldError('descripcion') || 'Opcional. Vaciar este campo retira la descripción; siempre se envía explícitamente.'} />
      <TextField label="Zona horaria" required value={zonaHoraria} onChange={event => setZone(event.target.value)} slotProps={{ htmlInput: { list: 'company-timezones' } }} error={Boolean(fieldError('zonaHoraria'))} helperText={fieldError('zonaHoraria') || 'Identificador IANA, por ejemplo America/Bogota. El servidor comprueba las zonas que admite.'} />
      <datalist id="company-timezones">{['America/Bogota', 'UTC', 'America/New_York', 'Europe/Madrid'].map(zone => <option key={zone} value={zone} />)}</datalist>
    </Stack></Box>
    {error?.fields.filter(item => !['nombre', 'descripcion', 'zonaHoraria'].includes(item.field)).map((item, index) => <Typography key={index} role="alert" color="error">{item.field}: {item.message}</Typography>)}
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || !allowed}>{pending ? 'Guardando o consultando…' : 'Guardar configuración'}</Button><Button onClick={onCancel}>Cancelar y volver</Button>{blocked && <Button disabled={pending || !allowed} onClick={() => { void reconcile(); }}>Descartar formulario y consultar configuración</Button>}</Stack>
  </Stack></Box>;
}
