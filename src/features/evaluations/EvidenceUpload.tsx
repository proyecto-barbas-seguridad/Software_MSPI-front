import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { validateEvidence } from './evaluations';
import type { Answer, Evaluation, EvaluationService, Evidence } from './evaluations';

export const MAX_EVIDENCE_BYTES = 10_000_000;
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
const typeFor = (name: string) => /\.pdf$/i.test(name) ? 'application/pdf' : /\.png$/i.test(name) ? 'image/png' : /\.jpe?g$/i.test(name) ? 'image/jpeg' : undefined;
export function fileProblem(file?: File) {
  if (!file) return 'Selecciona un archivo.';
  if (!file.name.trim() || file.name.length > 255 || /[\\/\p{Cc}\p{Cf}]/u.test(file.name) || !typeFor(file.name)) return 'Elige un PDF, PNG o JPEG con nombre válido de hasta 255 caracteres, sin rutas ni caracteres de control.';
  if (!file.size) return 'El archivo está vacío. Selecciona otro archivo.';
  if (file.size > MAX_EVIDENCE_BYTES) return 'El archivo supera 10 MB (10 000 000 bytes). Selecciona uno más pequeño.';
  return undefined;
}
export default function EvidenceUpload({ companyId, evaluation, answer, service, scope, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  companyId: string; evaluation: Evaluation; answer: Answer; service: EvaluationService; scope?: AbortSignal;
  onSaved: (evidence?: Evidence) => void; onCancel: () => void; onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const [file, setFile] = useState<File>(); const [rejected, setRejected] = useState<File>(); const [error, setError] = useState<ApiError>();
  const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !request.current?.signal.aborted && !scope?.aborted;
  const fieldError = (name: string) => error?.fields.find(field => field.field === name)?.message;
  const localError = file ? fileProblem(file) : undefined;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || scope?.aborted || (file && file === rejected)) return;
    if (evaluation.estado !== 'BORRADOR' || answer.revisionEvaluacion !== evaluation.revision) return;
    const validation = fileProblem(file); const description = String(new FormData(event.currentTarget).get('descripcion') || '').trim();
    if (validation || description.length > 1000) { setError(new ApiError(400, 'DATOS_INCOMPLETOS', validation || 'La descripción admite hasta 1000 caracteres.')); return; }
    const selected = file!; const controller = request.current = new AbortController(); busy.current = true; setPending(true); setError(undefined); onDirty(true); onPending(true);
    try {
      const result = await service.upload(companyId, evaluation.evaluacionId, answer.respuestaId, { archivo: selected, revisionEsperada: answer.revisionEvaluacion, ...(description ? { descripcion: description } : {}) }, controller.signal);
      validateEvidence({ elementos: [result.evidencia], pagina: 0, tamano: 5, hayMas: false }, 0);
      if (result.revisionEvaluacion !== answer.revisionEvaluacion + 1 || result.evidencia.nombreOriginal !== selected.name || result.evidencia.tamanoBytes !== selected.size
        || result.evidencia.tipoDetectado !== typeFor(selected.name) || result.evidencia.descripcion !== (description || null) || result.evidencia.estadoInspeccion !== 'LIMPIA') throw new Error('Invalid upload response');
      if (current()) { onDirty(false); onSaved(result.evidencia); }
    } catch (failure) {
      if (!current()) return;
      const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado de la carga.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem);
      const refused = problem.status === 503 && ['CUOTA_EVIDENCIAS_NO_CONFIGURADA', 'INSPECCION_EVIDENCIAS_NO_DISPONIBLE'].includes(problem.code);
      if (problem.status === 0 || (problem.status >= 500 && !refused) || problem.status === 404 || (problem.status === 409 && problem.code !== 'CUOTA_EVIDENCIAS_AGOTADA')) setBlocked(true);
      if (problem.code === 'EVIDENCIA_BLOQUEADA' || problem.status === 413) setRejected(selected);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  const message = error?.code === 'EVIDENCIA_BLOQUEADA' ? 'El servidor rechazó el archivo en la inspección de seguridad. Selecciona otro archivo.'
    : error?.code === 'CUOTA_EVIDENCIAS_AGOTADA' ? 'La empresa no tiene cuota suficiente para este archivo. Elige uno más pequeño o solicita revisar la cuota.'
      : error?.code === 'CUOTA_EVIDENCIAS_NO_CONFIGURADA' ? 'La empresa necesita una cuota de evidencias configurada antes de adjuntar archivos.'
        : error?.code === 'INSPECCION_EVIDENCIAS_NO_DISPONIBLE' ? 'La inspección no está disponible. No se publicó el adjunto; puedes reintentar explícitamente más tarde.'
          : error?.code === 'REVISION_DESACTUALIZADA' ? 'La evaluación cambió. Consulta su revisión actual antes de otra carga.' : error?.message;
  return <Box component="form" aria-label="Adjuntar evidencia" onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" tabIndex={-1} ref={heading}>Adjuntar evidencia</Typography><Typography>{evaluation.nombre} · {answer.codigo} · {answer.titulo} · Revisión {answer.revisionEvaluacion}</Typography>
    <Typography>Un PDF, PNG o JPEG por carga, de hasta 10 MB (10 000 000 bytes). El servidor valida contenido, inspección, permisos y cuota antes de publicar. La carga incrementa la revisión de la evaluación y no cambia la calificación ni selecciona el archivo automáticamente para revisión o cierre.</Typography>
    {error && <Alert severity="error">{message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}</Alert>}
    {error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de reintentar.</Typography>}
    {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'El resultado no se confirmó. El archivo puede haberse guardado; no se reenviará automáticamente. Consulta las evidencias y la revisión antes de otra carga. Coincidir en nombre o tamaño no demuestra que sea la misma solicitud.' : 'El recurso, estado o revisión cambió. Se conserva tu selección y no se reenviará automáticamente.'}</Alert>}
    {file === rejected && file && <Alert severity="warning">Selecciona otro archivo antes de volver a cargar.</Alert>}
    {pending && <Typography role="status">Cargando archivo y esperando la validación del servidor… Salir no garantiza cancelar la operación.</Typography>}
    <Box component="fieldset" disabled={pending || blocked} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      <Typography component="label" htmlFor="evidence-file">Archivo *</Typography><Box component="input" id="evidence-file" name="archivo" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" aria-invalid={Boolean(localError || fieldError('archivo'))} aria-describedby="evidence-file-help" sx={fields} onChange={event => { setFile(event.target.files?.[0]); setError(undefined); setRejected(undefined); }} />
      <Typography id="evidence-file-help" color={localError || fieldError('archivo') ? 'error' : 'text.secondary'}>{localError || fieldError('archivo') || 'El formato indicado por el navegador no acredita el contenido del archivo.'}</Typography>
      {file && <Typography>Selección: {file.name} · {file.size} bytes</Typography>}
      <Typography component="label" htmlFor="evidence-description">Descripción (opcional)</Typography><Box component="textarea" id="evidence-description" name="descripcion" rows={4} maxLength={1000} aria-invalid={Boolean(fieldError('descripcion'))} aria-describedby="evidence-description-help" sx={fields} />
      <Typography id="evidence-description-help" color={fieldError('descripcion') ? 'error' : 'text.secondary'}>{fieldError('descripcion') || 'Hasta 1000 caracteres. El archivo queda asociado a esta respuesta.'}</Typography>
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || Boolean(localError) || Boolean(file && file === rejected)}>{pending ? 'Cargando…' : 'Cargar evidencia'}</Button><Button onClick={onCancel}>Cancelar y volver</Button>
      {blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultarán la evaluación y sus evidencias. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}
