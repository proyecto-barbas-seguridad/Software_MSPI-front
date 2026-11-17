import { Alert, Box, Button, Chip, Link, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { FormEvent, ReactNode } from 'react';
import type { AccessState } from '../access/workspace';
import { accessMessage } from '../access/workspace';
import { date, labels, number, timestamp } from './panel';
import type { PanelQuery, Results } from './panel';

const sectionStates = {
  evaluaciones: ['BORRADOR', 'EN_REVISION', 'CERRADA'],
  riesgos: ['IDENTIFICADO', 'EN_ANALISIS', 'EN_TRATAMIENTO', 'EN_SEGUIMIENTO', 'CERRADO'],
  acciones: ['PENDIENTE', 'EN_EJECUCION', 'EN_REVISION', 'COMPLETADA', 'CANCELADA'],
};
const fieldStyle = { width: '100%', minHeight: 44, px: 1.5, border: 1, borderColor: 'divider', borderRadius: 1,
  bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
function ScrollTable({ label, children }: { label: string; children: ReactNode }) {
  return <Box role="region" aria-label={label} tabIndex={0} sx={{ overflowX: 'auto', maxWidth: '100%' }}>{children}</Box>;
}
function CountList({ values, codes }: { values: Record<string, number>; codes: string[] }) {
  return <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 1 }}>
    {codes.map(code => <Box key={code} sx={{ display: 'contents' }}><Typography component="dt" color="text.secondary">{labels[code]}</Typography>
      <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>{number.format(values[code] ?? 0)}</Typography></Box>)}
  </Box>;
}
export function CompanyDashboard({ state, onLoad }: { state: AccessState; onLoad: (query: PanelQuery) => void }) {
  const query = state.panelQuery || {};
  const panel = state.panel;
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const desde = String(values.get('desde') || ''); const hasta = String(values.get('hasta') || '');
    const end = event.currentTarget.elements.namedItem('hasta') as HTMLInputElement;
    end.setCustomValidity(desde && hasta && desde > hasta ? 'La fecha final debe ser igual o posterior a la inicial.' : '');
    if (!event.currentTarget.reportValidity()) return;
    onLoad({ ...query, pagina: 0, desde: desde || undefined, hasta: hasta || undefined,
      baseRiesgo: values.get('base') === 'INHERENTE' ? 'INHERENTE' : 'RESIDUAL' });
  }
  return <Stack component="section" aria-labelledby="panel-title" spacing={3} aria-busy={Boolean(state.panelLoading)}>
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography id="panel-title" variant="h2">Panel de resultados</Typography>
      <Button disabled={state.panelLoading} onClick={() => onLoad(query)}>Actualizar panel</Button>
    </Stack>
    <Box component="form" aria-label="Filtros del panel" onSubmit={filter} onInput={event => { (event.currentTarget.elements.namedItem('hasta') as HTMLInputElement).setCustomValidity(''); }} key={JSON.stringify([query.desde, query.hasta, query.baseRiesgo])}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 2, alignItems: 'end' }}>
        <Stack spacing={1}><Typography component="label" htmlFor="panel-desde">Desde</Typography><Box component="input" id="panel-desde" name="desde" type="date" defaultValue={query.desde || ''} sx={fieldStyle} /></Stack>
        <Stack spacing={1}><Typography component="label" htmlFor="panel-hasta">Hasta</Typography><Box component="input" id="panel-hasta" name="hasta" type="date" defaultValue={query.hasta || ''} onChange={event => event.currentTarget.setCustomValidity('')} sx={fieldStyle} /></Stack>
        <Stack spacing={1}><Typography component="label" htmlFor="panel-base">Base de riesgo</Typography>
          <Box component="select" id="panel-base" name="base" defaultValue={query.baseRiesgo || 'RESIDUAL'} sx={fieldStyle}><option value="RESIDUAL">Residual</option><option value="INHERENTE">Inherente</option></Box></Stack>
        <Stack direction="row" sx={{ gap: 1 }}><Button type="submit" variant="contained" disabled={state.panelLoading}>Aplicar</Button><Button disabled={state.panelLoading} onClick={event => { event.currentTarget.form?.reset(); onLoad({ detalle: query.detalle }); }}>Limpiar</Button></Stack>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Periodo inclusivo: fecha de evaluación, creación del riesgo en la zona de la empresa y fecha límite de la acción. Cada sección conserva su propio alcance.</Typography>
    </Box>
    {state.panelLoading && <Typography role="status">Consultando resultados de esta empresa…</Typography>}
    {state.panelError && <Alert severity="error">{accessMessage(state.panelError)} {state.panelError.correlationId && `Referencia de soporte: ${state.panelError.correlationId}`}</Alert>}
    {panel && <>
      <Typography variant="body2" color="text.secondary">Corte del panel: {timestamp(panel.generadoEn, panel.zonaHoraria)} · {panel.zonaHoraria} · Base {panel.filtros.baseRiesgo === 'RESIDUAL' ? 'residual' : 'inherente'}{panel.filtros.desde || panel.filtros.hasta ? ` · ${panel.filtros.desde ? date(panel.filtros.desde) : 'Sin inicio'} a ${panel.filtros.hasta ? date(panel.filtros.hasta) : 'Sin fin'}` : ' · Todo el periodo'}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>
        {(['evaluaciones', 'riesgos', 'acciones'] as const).map(section => <Paper key={section} component="section" sx={{ p: 2 }} aria-label={`Resumen de ${section}`}>
          <Stack spacing={2}><Typography variant="h2">{section[0].toUpperCase() + section.slice(1)}</Typography>
            <Typography variant="h1" component="p">{number.format(panel[section].total)}</Typography>
            <CountList values={panel[section].porEstado} codes={sectionStates[section]} />
            {section === 'acciones' && <Typography>Vencidas: {number.format(panel.acciones.vencidas)} · Son un subconjunto de las acciones, no otro estado.</Typography>}
          </Stack>
        </Paper>)}
      </Box>
      {state.results && <EvaluationResults data={state.results} name={panel.evaluaciones.elementos[0].nombre} />}
      {state.resultsError && <Alert severity="warning">Los agregados están disponibles, pero no pudimos consultar los resultados de la evaluación destacada. Actualiza el panel para reintentar.{state.resultsError.correlationId && ` Referencia: ${state.resultsError.correlationId}`}</Alert>}
      <Paper component="section" sx={{ p: 2 }}><Stack spacing={2}>
        <Typography variant="h2">Situación de las valoraciones de riesgo</Typography>
        <CountList values={panel.riesgos.porSituacion} codes={['VIGENTE', 'PENDIENTE', 'REVISION_REQUERIDA']} />
        <Typography color="text.secondary">La matriz y los niveles incluyen solo valoraciones vigentes de la base elegida. Pendiente y revisión requerida no se convierten en riesgo bajo ni en cero.</Typography>
        <CountList values={panel.riesgos.porNivel} codes={['BAJO', 'MODERADO', 'ALTO', 'EXTREMO']} />
        <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Ver matriz de riesgos vigentes</Typography>
          <ScrollTable label="Matriz de riesgos vigentes"><Table size="small"><caption>Riesgos por probabilidad e impacto · base {panel.filtros.baseRiesgo.toLowerCase()}</caption><TableHead><TableRow><TableCell>Probabilidad / Impacto</TableCell>{['LEVE', 'MENOR', 'MODERADO', 'MAYOR', 'CATASTROFICO'].map(impact => <TableCell key={impact} scope="col">{labels[impact]}</TableCell>)}</TableRow></TableHead>
            <TableBody>{['MUY_ALTA', 'ALTA', 'MEDIA', 'BAJA', 'MUY_BAJA'].map(probability => <TableRow key={probability}><TableCell component="th" scope="row">{labels[probability]}</TableCell>{['LEVE', 'MENOR', 'MODERADO', 'MAYOR', 'CATASTROFICO'].map(impact => {
              const cells = panel.riesgos.matriz.filter(cell => cell.probabilidad === probability && cell.impacto === impact);
              return <TableCell key={impact}>{cells.length ? cells.map(cell => `${number.format(cell.total)} · ${labels[cell.nivel]}`).join('; ') : '0 · Sin registros'}</TableCell>;
            })}</TableRow>)}</TableBody></Table></ScrollTable>
        </Box>
      </Stack></Paper>
      <Paper component="section" sx={{ p: 2 }}><Stack spacing={2}>
        <Typography variant="h2">Detalle del panel</Typography>
        <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }} aria-label="Sección de detalle">
          {(['EVALUACIONES', 'RIESGOS', 'ACCIONES'] as const).map(detail => <Button key={detail} aria-pressed={panel.detalle === detail} variant={panel.detalle === detail ? 'contained' : 'outlined'} onClick={() => onLoad({ ...query, detalle: detail, pagina: 0 })}>{detail === 'EVALUACIONES' ? 'Evaluaciones' : detail === 'RIESGOS' ? 'Riesgos' : 'Acciones'}</Button>)}
        </Stack>
        <PanelDetails state={state} />
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <Button disabled={panel.pagina === 0} onClick={() => onLoad({ ...query, pagina: panel.pagina - 1 })}>Anterior</Button>
          <Typography>Página {panel.pagina + 1}</Typography>
          <Button disabled={(panel.pagina + 1) * panel.tamano >= (panel.detalle === 'RIESGOS' ? panel.riesgos.total : panel.detalle === 'ACCIONES' ? panel.acciones.total : panel.evaluaciones.total)} onClick={() => onLoad({ ...query, pagina: panel.pagina + 1 })}>Siguiente</Button>
        </Stack>
      </Stack></Paper>
    </>}
  </Stack>;
}
export function EvaluationResults({ data, name, panelSnapshot = true }: { data: Results; name: string; panelSnapshot?: boolean }) {
  const total = data.controlesGlobal;
  const score = total.puntaje === null ? labels[total.estado] : `${number.format(total.puntaje)} / 100`;
  return <Paper component="section" aria-label="Resultados de evaluación" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2}>
    <Typography variant="overline">{panelSnapshot ? 'Evaluación destacada · primera de esta página' : 'Resultados de esta evaluación'}</Typography><Typography variant="h2">{name}</Typography>
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}><Chip variant="outlined" label={labels[total.estado]} /><Typography>Revisión de resultados: {data.revision}</Typography></Stack>
    <Typography color="text.secondary">{panelSnapshot ? 'El resultado se consulta por separado del corte del panel y puede reflejar cambios posteriores.' : 'La ficha, las respuestas y los resultados se consultan por separado; sus revisiones pueden cambiar entre lecturas.'} Los cálculos pertenecen al backend.</Typography>
    <Typography>Puntaje de controles evaluados</Typography><Typography variant="h1" component="p">{score}</Typography>
    <Typography>Avance: {total.avance === null ? 'No calculable' : `${number.format(total.avance)} %`} · {total.evaluados} de {total.aplicables} controles</Typography>
    {total.avance !== null && <Box component="progress" max={100} value={total.avance} aria-label="Avance de evaluación" sx={{ width: '100%', height: 12, accentColor: 'primary.main' }} />}
    <Typography>Sin calificar: {total.pendientes} · Sin decidir aplicabilidad: {total.sinDecidir} · No aplica: {total.noAplican}</Typography>
    <Typography variant="body2" color="text.secondary">Cero es una nota registrada. Pendiente indica datos faltantes y no aplica es una exclusión. Un resultado provisional conserva pendientes; no afirma certificación.</Typography>
    <GroupResults name="Resultados por dominio" groups={data.dominios} />
    <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Ver resultados por cláusula</Typography><GroupResults name="Resultados por cláusula" groups={data.clausulas} /></Box>
  </Stack></Paper>;
}
function GroupResults({ name, groups }: { name: string; groups: Results['dominios'] }) {
  if (!groups.length) return <Typography>{name}: sin elementos.</Typography>;
  return <ScrollTable label={name}><Table size="small"><caption>{name}</caption><TableHead><TableRow>{['Grupo', 'Evaluados / Aplicables', 'Puntaje', 'Estado'].map(label => <TableCell scope="col" key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
    {groups.map(({ grupo, resultado }, index) => <TableRow key={grupo + index}><TableCell component="th" scope="row">{labels[grupo] || grupo.replace(/^CLAUSULA_/, 'Cláusula ')}</TableCell><TableCell>{resultado.evaluados} / {resultado.aplicables}</TableCell><TableCell>{resultado.puntaje === null ? labels[resultado.estado] : number.format(resultado.puntaje)}</TableCell><TableCell>{labels[resultado.estado]}</TableCell></TableRow>)}
  </TableBody></Table></ScrollTable>;
}
function PanelDetails({ state }: { state: AccessState }) {
  const panel = state.panel!;
  const list = panel.detalle === 'RIESGOS' ? panel.riesgos.elementos : panel.detalle === 'ACCIONES' ? panel.acciones.elementos : panel.evaluaciones.elementos;
  if (!list.length) return <Alert severity="info">No hay registros en esta página con los filtros aplicados.</Alert>;
  return <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
    {panel.detalle === 'EVALUACIONES' && panel.evaluaciones.elementos.map(evaluation => <Box component="li" key={evaluation.evaluacionId}>
      <Link href={`#/empresas/${panel.empresaId}/evaluaciones/${evaluation.evaluacionId}`} sx={{ overflowWrap: 'anywhere' }}>{evaluation.nombre}</Link>
      <Typography>{date(evaluation.fecha)} · {labels[evaluation.estado]}</Typography><Typography variant="body2">Controles: {evaluation.controlesEvaluados} / {evaluation.controlesAplicables} · Cláusulas: {evaluation.clausulasEvaluadas} / {evaluation.clausulasAplicables} · Sin decidir: {evaluation.sinDecidir} · Sin calificar: {evaluation.sinCalificacion} · Heredadas por confirmar: {evaluation.heredadasPendientes}</Typography>
    </Box>)}
    {panel.detalle === 'RIESGOS' && panel.riesgos.elementos.map(risk => <Box component="li" key={risk.riesgoId}><Link href={`#/empresas/${panel.empresaId}/riesgos/${risk.riesgoId}`} sx={{ fontWeight: 600 }}>{risk.codigo}</Link><Typography>{labels[risk.estado]} · {labels[risk.situacion]}</Typography><Typography>Nivel {panel.filtros.baseRiesgo.toLowerCase()}: {risk.nivel === null ? (risk.situacion === 'PENDIENTE' ? 'Pendiente' : 'Sin valoración vigente') : labels[risk.nivel]} · Probabilidad: {risk.probabilidad === null ? (risk.situacion === 'PENDIENTE' ? 'Pendiente' : 'Sin valoración vigente') : labels[risk.probabilidad]} · Impacto: {risk.impacto === null ? (risk.situacion === 'PENDIENTE' ? 'Pendiente' : 'Sin valoración vigente') : labels[risk.impacto]}</Typography></Box>)}
    {panel.detalle === 'ACCIONES' && panel.acciones.elementos.map(action => <Box component="li" key={action.accionId}><Typography sx={{ fontWeight: 600 }}>{action.codigo}</Typography><Typography>{labels[action.estado]} · Fecha límite: {date(action.fechaLimite)} · {action.vencida ? 'Vencida' : 'No vencida'}</Typography></Box>)}
  </Stack>;
}
