# HU-FRONT-028 · Avances, evidencias, entrega y revisión independiente

## Historia y alcance

Como responsable actual de una acción, quiero registrar avances, adjuntar evidencia y solicitar revisión. Como AE o GS distinto de quien entregó, quiero revisar la entrega vigente y aprobarla o devolverla con motivo, sin omitir controles de identidad ni conservar una revisión desactualizada.

Parte de `Develop` en `9fff768` (PR #28 fusionado). Completa el ciclo operativo de acciones iniciado en HU026/HU027 sobre OpenAPI 1.24.0. Backend, contrato, infraestructura y documentos aprobados 01–09 intactos. Datos ilustrativos solo en fixtures; sin cambios de datos empresariales reales.

## Criterios implementados

- AE/GS/RA con asignación actual pueden avanzar, cargar y entregar mientras PENDIENTE o EN_EJECUCION. Los roles se combinan por empresa; AU solo no ejecuta y AP no obtiene acceso empresarial automáticamente. El vencimiento no impide avanzar ni produce cancelación/aprobación automática.
- El contrato de contexto empresarial no expone la membresía propia para compararla con responsableMembresiaId. La interfaz presenta estas operaciones como exclusivas del responsable y el servidor comprueba asignación en cada escritura. No deduce asignación por nombre ni compara usuarioId con membresiaId. Para AE/GS y AU+RA con consulta general, ver una tarea no acredita que la tenga asignada; un rechazo 403 retira el contexto.
- **Registrar avance** abre página con comentario obligatorio de hasta 2000 y revisión capturada. Desde PENDIENTE el backend registra inicio y avance: revisión aumenta dos. Desde EN_EJECUCION aumenta una. Valida el incremento real en lugar de suponer siempre +1; no inicia nada al abrir la pantalla.
- **Adjuntar evidencia de acción** abre página para un PDF/PNG/JPEG de hasta 10 MB (10 000 000 bytes), nombre válido y descripción opcional de hasta 1000. Valida mediante utilidades comunes de archivos; el servidor determina tipo real, inspección, integridad, cuota y asignación.
- Carga según el contrato específico de acciones: revisionEsperada y descripcion van en query; el multipart contiene únicamente archivo. Sesión del mismo origen, CSRF fresco, boundary generado por el navegador y espera multipart existente de 45 segundos. No copia por suposición el formato de carga de controles/evaluaciones.
- La carga incrementa revisión una vez, sin iniciar la acción, registrar avance o enviarla a revisión. Respuesta exige metadata LIMPIA coherente y revisión incrementada. Tras cargar relee ficha y evidencias; el siguiente paso captura la revisión nueva.
- Archivo rechazado por inspección/tamaño requiere sustitución. Cuota agotada, cuota no configurada o inspección temporalmente no disponible conservan datos y admiten intento explícito. Conflicto/incertidumbre bloquean reenvío hasta consultar; nombre/tamaño coincidentes no atribuyen un archivo a una solicitud incierta.
- **Solicitar revisión** requiere comentario de hasta 2000, confirmación breve y adjunto expresamente elegido cuando evidenciaRequerida es true. Si la tarea fue configurada sin adjunto obligatorio, admite entrega sin archivo o con uno seleccionado voluntariamente. No vuelve a decidir el requisito ni pide justificación diferente de la preparada en HU027.
- Selector paginado de adjuntos de esa acción, conservando elección al paginar. Los archivos de contexto de riesgos/hallazgos no sustituyen evidencia de la entrega ni se ofrecen como si fueran adjuntos de ejecución. Cargar y entregar son pasos separados, sin selección automática.
- Desde pendiente, entregar también registra inicio y aumenta revisión dos; desde ejecución, una. Respuesta exige EN_REVISION y nuevo entregaVigenteId, sin finalización. No hay pendiente → completada ni aprobación sin entrega.
- En revisión no se ofrecen avances, nuevas entregas o archivos. Edición/reasignación sigue bloqueada por HU027 hasta devolver; cancelación mantiene su flujo separado. Completada/cancelada son terminales para este ciclo.
- **Revisión independiente:** consulta el historial paginado para localizar exactamente el evento cuyo eventoId coincide con entregaVigenteId. No usa la primera solicitud de revisión ni entregaId del evento como sustitutos. Exige tipo SOLICITUD_REVISION, comentario, responsable coherente y evidencia cuando es requerida.
- El historial no informa hayMas: sigue páginas de cinco hasta encontrar el evento o llegar a una página menor. Detecta identificadores repetidos para impedir una consulta inconsistente. Si falta entrega o identidad válida de sesión, bloquea la decisión y ofrece reconsultar.
- Compara autorId de esa entrega con usuarioId de la sesión verificada. No compara contra creadaPor, nombres o IDs de membresía. Si coincide, oculta los botones de aprobación/devolución en ficha y bloquea ambos POST incluso si el formulario se invoca directamente. Combinar AE/GS con RA no habilita revisión propia.
- AE/GS independiente dispone de **Aprobar entrega** y **Devolver entrega**. La página muestra comentario, autor/fecha y descarga de la evidencia real de la entrega vigente; no permite reemplazarla con otro archivo o entrega histórica. Descarga usa la autorización/inspección de acción existente.
- Ambas decisiones exigen motivo de hasta 2000 y confirmación breve. POST queda ligado a entrega y revisión capturadas. El backend vuelve a validar identidad independiente, estado, entrega y, al aprobar, responsable elegible/evidencia aplicable. Devolver no exige superar una inspección del archivo para poder explicar su rechazo.
- Aprobar devuelve COMPLETADA, revisión +1, entrega conservada y finalizadaEn válida. Devolver devuelve EN_EJECUCION, revisión +1, entrega vigente/finalización retiradas, conservando la entrega anterior y el motivo en historial. Ninguna decisión cambia automáticamente efectividad de controles ni riesgo.
- Valida respuesta por ID/código, revisión/estado, origen, responsable, contenido, requisitos y contexto conservados. No sustituye datos operativos por un resultado optimista. Tras escribir relee ficha y despliega historial o evidencias según el paso.
- Protección de comentario/archivo al cancelar, navegar, cambiar empresa o salir. Conserva revisión capturada durante revalidación de acceso; cambio de roles/identidad retira ámbito. Bloquea solicitudes simultáneas e ignora respuestas tardías tras invalidación. Borrador solo en memoria; abortar no garantiza revertir escritura remota.
- 400 conserva campos y muestra validación; CSRF_INVALIDO permite nuevo intento explícito. 401/403 retiran contexto, incluida reasignación o prohibición de revisión independiente que el servidor vuelva a detectar. 404/409 bloquean hasta consultar. Red/timeout/5xx o metadatos inválidos son inciertos: no reenvío automático y descarte confirmado antes de releer.

## Contratos y reglas contrastados

- Documentos 01 APR-09, 02 PER-32/PER-33/PER-34 y condición de revisión independiente, 03 CU-23/CU-24 y 06 TR-ACC-02/03/04/05 con condiciones de pendiente, revisión, terminales y responsable revocado.
- POST `…/acciones/{accionId}/avances`: revisionEsperada, comentario.
- POST `…/acciones/{accionId}/entregas`: revisionEsperada, comentario y evidenciaId opcional.
- POST `…/acciones/{accionId}/entregas/{entregaId}/decision`: revisionEsperada, decision APROBAR/DEVOLVER y motivo.
- POST `…/acciones/{accionId}/evidencias`: multipart con archivo y query revisionEsperada/descripcion; GET de historial, evidencias y descarga ya implementados en HU026.
- `JpaImprovementActions.advance/submit/start/assigned/attachEvidence/decide`, `ActionEvent`, `CurrentCompanyAccess.currentActionMembership/requireIndependentReviewer`, permisos EXECUTE_ACTION/REVIEW_ACTION, `ApiImprovementActionController`, `ApiEvidenceController` y contrato generado.

La revisión usa la identidad de quien realizó la entrega, conservada por el backend; cambiar autoría de creación o combinar roles no altera esa identidad. No se transforma en aprobada una política documental pendiente sobre referencias como evidencia, retención o nuevas transiciones.

## Decisiones nuevas para revisión

Propuestas de implementación; documento aprobado 09 intacto:

1. Páginas separadas para avance, carga, entrega y decisión. Adjuntar nunca inicia/entrega y la evidencia se selecciona expresamente al solicitar revisión.
2. Comprobación local de la autoría de la entrega vigente antes de mostrar aprobación/devolución, sin inferencias por nombre o membresía. El editor vuelve a consultar y el backend valida al escribir.
3. Operaciones de ejecución presentadas como condicionadas a ser responsable actual; el backend es quien confirma asignación porque el contrato no entrega una membresía propia comprobable. No se amplía el alcance de lectura de RA para resolverlo.

Mantiene Material UI, etiquetas, foco al título, distribución adaptable, textos ajustables y controles de al menos 44 px. Sin dependencias nuevas. Revisar manualmente primer avance/entrega desde pendiente, adjunto requerido frente a opcional, revisión propia con roles combinados, aprobación/devolución vigente, evidencia bloqueada, responsable revocado y concurrencia. Pendiente inspección móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos, pantallas de ejecución/carga bajo demanda y sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **620 pruebas correctas**, incluidas 48 nuevas. Cubren revisiones +1/+2, adjunto opcional/requerido, historial paginado y entrega exacta, autoría propia/creador/membresía, identidad ausente, estados y roles, decisiones, metadatos, validación/CSRF/conflictos, carga/inspección/cuota/incertidumbre, ámbito invalidado, guardas, integración con identidad de sesión y formato query/multipart. Conserva las 572 anteriores, ajustando expectativas de ejecución de RA frente a gestión de HU027.
- `npm run test:gateway`: **17 pruebas HTTPS** correctas, incluidos multipart, descargas y archivos del manifiesto.
- `docker build -t mspi-front-hu028-review .`: daemon local de Docker Desktop no disponible (pipe dockerDesktopLinuxEngine inexistente). Sin iniciar/reiniciar servicios; construcción a comprobar en CI.

Pruebas DOM/fetch y upstream HTTPS simulados. No acreditan integración con backend/PostgreSQL, asignación/reasignación, identidad de varias cuentas, antivirus o cuota reales, ni recorrido manual en navegador. Sin despliegue ni modificaciones de datos empresariales. No añade reapertura de acciones terminales, borrado de archivos ni políticas de retención.
