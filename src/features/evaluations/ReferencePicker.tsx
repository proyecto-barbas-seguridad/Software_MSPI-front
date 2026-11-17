import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { ApiError } from '../../shared/api/client';
import { validatePage, uuid } from './evaluations';
import type { EvaluationService } from './evaluations';
type Choice = { id: string; label: string };
const fields = { width: '100%', minHeight: 44, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };

export function ReferencePicker({ name, company, service, scope, onAuthorization, onChange }: { name: 'responsableId' | 'versionCatalogoId' | 'versionMetodologiaId'; company: string; service: EvaluationService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void; onChange: (id: string) => void }) {
  const [page, setPage] = useState(0); const [attempt, setAttempt] = useState(0); const [options, setOptions] = useState<Choice[]>([]); const [selected, setSelected] = useState<Choice>();
  const [more, setMore] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState<ApiError>();
  const label = name === 'responsableId' ? 'Responsable' : name === 'versionCatalogoId' ? 'Versión de catálogo' : 'Versión de metodología';
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setOptions([]); setError(undefined); setMore(false);
    // Result handlers check the route scope even when a transport ignores cancellation.
    void (async () => {
      let choices: Choice[];
      if (name === 'responsableId') { const result = validatePage(await service.responsibles(company, page, controller.signal), page); choices = result.elementos.map(item => ({ id: item.membresiaId, label: item.nombreVisible })); if (!controller.signal.aborted && !scope?.aborted) setMore(result.hayMas); }
      else if (name === 'versionCatalogoId') {
        const result = validatePage(await service.catalogs(company, page, controller.signal), page);
        choices = result.elementos.filter(item => item.disponibleNuevos).map(item => ({ id: item.versionId, label: `${item.nombre} · ${item.codigo} · ${item.version}` }));
        if (!controller.signal.aborted && !scope?.aborted) setMore(result.hayMas);
      } else {
        const result = validatePage(await service.methods(company, page, controller.signal), page);
        choices = result.elementos.filter(item => item.disponibleNuevos && item.identificador === 'EVALUACION_CONTROLES_V1').map(item => ({ id: item.versionId, label: `${item.nombre} · ${item.codigo} · ${item.version}` }));
        if (!controller.signal.aborted && !scope?.aborted) setMore(result.hayMas);
      }
      if (choices.some(item => !uuid.test(item.id) || typeof item.label !== 'string' || !item.label.trim())) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'Referencias no válidas.');
      if (!controller.signal.aborted && !scope?.aborted) setOptions(choices);
    })().catch(failure => { if (controller.signal.aborted || scope?.aborted) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudieron consultar las referencias.'); setError(problem); if ([401, 403].includes(problem.status)) onAuthorization(problem); })
      .finally(() => { if (!controller.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => controller.abort();
  }, [name, company, service, page, attempt, scope, onAuthorization]);
  return <Stack spacing={1} aria-busy={loading}><Typography component="label" htmlFor={'reference-' + name}>{label} *</Typography>
    <Box component="select" id={'reference-' + name} value={selected?.id || ''} required disabled={loading || Boolean(error)} onChange={event => { const choice = options.find(item => item.id === event.target.value) || (selected?.id === event.target.value ? selected : undefined); setSelected(choice); onChange(choice?.id || ''); }} sx={fields}>
      <option value="">Seleccionar…</option>{selected && !options.some(item => item.id === selected.id) && <option value={selected.id}>{selected.label}</option>}{options.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </Box>{loading && <Typography role="status">Consultando {label.toLowerCase()}…</Typography>}{error && <Alert severity="error">{error.message}</Alert>}
    {!loading && !error && !options.length && <Typography>No hay opciones compatibles en esta página.</Typography>}
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}><Button disabled={loading || page === 0} aria-label={'Anterior en ' + label} onClick={() => setPage(page - 1)}>Anterior</Button><Typography sx={{ alignSelf: 'center' }}>Página {page + 1}</Typography><Button disabled={loading || !more} aria-label={'Siguiente en ' + label} onClick={() => setPage(page + 1)}>Siguiente</Button><Button disabled={loading} aria-label={'Actualizar ' + label} onClick={() => setAttempt(attempt + 1)}>Actualizar</Button></Stack>
  </Stack>;
}
