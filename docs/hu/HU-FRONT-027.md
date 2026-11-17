# HU-FRONT-027 · Crear, editar, reasignar y cancelar acciones

## Historia y alcance

Como AE o GS de la empresa activa, quiero crear una acción desde riesgo o hallazgo, asignar responsable, preparar contexto y evidencia esperada y registrar cambios/cancelación con motivo, conservando antecedentes y la independencia de la revisión.

Parte de `Develop` en `3565516` (PR #27 fusionado). Continúa HU026 sobre OpenAPI 1.24.0. Backend, contrato, infraestructura y documentos aprobados 01–09 intactos. Los datos ficticios se limitan a fixtures; no modifica datos empresariales reales.

## Criterios implementados

- **Crear acción**, **Editar acción** y **Cancelar acción** para AE/GS, incluidos roles combinados por empresa. AU y RA solo conservan consulta; AP no obtiene acceso empresarial automático. No habilita solicitar revisión, aprobar o devolver, ni excepciones para revisar una entrega propia.
- Formularios como páginas, con código/revisión capturados al editar o cancelar. El servidor asigna el código al crear; no acepta un código manual ni una revisión inventada para alta.
- Creación con exactamente un origen: riesgo o hallazgo. Riesgos mediante listado empresarial paginado, excluyendo cerrados de las nuevas opciones sin inventar un filtro de exclusión. Hallazgo mediante evaluación → respuesta → hallazgo, con selectores dependientes paginados y pertenencia a respuesta validada.
- Origen, responsable, fecha, requisito de adjunto y contenido de tarea sin valores elegidos por defecto al crear. No copia descripción, resultado ni contexto automáticamente del riesgo/hallazgo.
- Responsable mediante `/responsables`: membresías elegibles, no responsables de negocio ni usuarios sueltos. El backend devuelve miembros activos con AE/GS/RA y vuelve a verificar elegibilidad y empresa al guardar. No compara usuarioId con membresiaId ni concede permisos por seleccionar una persona.
- Descripción, resultado esperado, fecha límite, evidencia/comprobación esperada (hasta 2000) y resumen para RA obligatorios. Decisión de adjunto sí/no/pendiente explícita; si no se exige, justificación de hasta 2000. Si se exige, la justificación no aplica y se envía null. Cambiar sí/no conserva el texto previo en el formulario para permitir reconsiderar, sin enviar una justificación incompatible.
- Plazo nuevo o modificado no anterior al día actual en la zona de la empresa; puede ser hoy. Un plazo ya vencido puede conservarse exactamente sin cambiarlo al editar, como permite el backend. No impone un mínimo HTML que impida conservarlo. El servidor vuelve a comprobar fechas al escribir.
- Edición solo en PENDIENTE o EN_EJECUCION, con precarga real de datos, false, plazo, origen y contexto. Conserva referencias guardadas aunque no aparezcan en opciones vigentes; el servidor valida su uso. Cambiar origen es explícito y exige nueva selección, sin borrar silenciosamente archivos de contexto conservados.
- Toda edición exige motivo de hasta 2000. Reasignar requiere confirmación breve y explica la pérdida de acceso por asignación del responsable anterior. Los roles/identidades de la revisión futura siguen siendo comprobados por el backend; no se aprueba ninguna entrega en esta operación.
- Archivos de contexto solo mediante selección expresa desde respuestas de evaluación o la versión actual consultada de una implementación de control autorizada. La navegación de archivos es opcional: abrirla sin añadir archivo no impide guardar una acción sin adjuntos de contexto.
- Selectores de evaluación/respuesta/control y sus archivos paginados, con referencia de versión capturada. Valida página/metadatos y ofrece nuevos archivos solo con inspección registrada LIMPIA, que es la condición que comprueba replaceContext. El backend revalida disponibilidad/empresa antes de compartir y reautoriza e inspecciona cada descarga posterior.
- Hasta 20 archivos sin duplicados, cada uno con motivo de hasta 1000. Añadir al contexto no guarda la acción ni otorga acceso hasta guardar; requiere completar motivo. Un archivo guardado sin nombre resoluble muestra su identificador, sin inventar metadatos. Retirada individual explícita; no elimina el archivo original.
- El resumen y archivos seleccionados se presentan como información que podrá ver el responsable, incluido RA. Cambiar origen conserva el contexto visible hasta revisarlo/retirarlo; no amplía permisos al expediente completo. La selección queda limitada a fuentes que AE/GS puede consultar y el backend resuelve en la misma empresa.
- Cancelación solo en PENDIENTE, EN_EJECUCION o EN_REVISION, con motivo de hasta 2000 y confirmación breve. Conserva historial y motivo; no equivale a completar/aprobar ni permite reabrir estados terminales. COMPLETADA y CANCELADA no ofrecen edición/cancelación.
- POST de creación envía solo datos. PUT de edición envía datos, revisión capturada y motivo. POST cancelar envía solo revisión y motivo. Sesión del mismo origen y CSRF fresco para cada escritura, sin rebase automático.
- Respuestas verificadas por identificador/código, estado/revisión, datos reales (incluidos false y null), origen y mapa de contexto. Creación debe devolver PENDIENTE/revisión cero, sin entrega/finalización. Edición conserva estado y aumenta revisión; cancelación devuelve CANCELADA y motivo. Una respuesta incoherente se trata como incierta.
- Tras crear navega y consulta la ficha nueva; editar/cancelar releen ficha y contexto del servidor. No publica estados optimistas. El historial operativo de HU026 mantiene los eventos que su endpoint ofrece; cambios/cancelaciones quedan registrados en backend y no se inventan eventos adicionales en esa consulta.
- Protección de texto al navegar, cancelar, cambiar empresa, cerrar sesión o salir. Revalidar autorización conserva revisión capturada; cambios de roles/identidad retiran el ámbito. Evita envíos simultáneos y descarta respuestas tardías tras invalidación. Borrador solo en memoria.
- 400 y validaciones conservan datos; CSRF_INVALIDO permite intento explícito. 401/403 de autorización retiran contexto, incluido un rechazo de membresía no elegible que el backend expresa como acceso denegado. 404/409 bloquean hasta consultar; red/timeout/5xx o metadatos incoherentes son inciertos y no se reenvían automáticamente.
- Descartar para reconsultar exige confirmación. Una creación incierta vuelve a la primera página para revisar las más recientes, sin atribuir un resultado por descripción: el código lo asigna el servidor. Encontrar texto coincidente no demuestra que esa solicitud creara el registro.

## Contratos y reglas contrastados

- Documentos 02 PER-30/PER-31/PER-29 y condiciones de contexto/revisión independiente, 03 CU-22 y 06 ciclo de acciones; APR-09. Responsable con membresía habilitada, contexto preparado y sin aprobación propia.
- POST `/api/v1/empresas/{empresaId}/acciones`, PUT `…/{accionId}` y POST `…/{accionId}/cancelar`.
- GET `/responsables`, `/riesgos`, `/evaluaciones`, sus respuestas/hallazgos/evidencias e implementaciones/versiones/evidencias existentes, paginados con tamaño 5. Sin endpoints, filtros o identificadores de origen inventados.
- `ApiImprovementActionController.Data/Create/Edit/Cancel`, `JpaImprovementActions.create/edit/cancel/validate/requireOpenRisk/replaceContext`, `CurrentCompanyAccess.requireActionAssignee`, función `comun.responsables_empresa`, `ApiErrors` y restricciones de V12.

El backend exige un único origen; editar también comprueba que ni el riesgo anterior ni el nuevo estén cerrados. El cliente no deduce esa condición de datos que la ficha de acción no expone y muestra el conflicto del servidor. No convierte en aprobadas las políticas documentales pendientes de referencias como evidencia, retención o revisión.

## Decisiones nuevas para revisión

Propuestas de implementación; documento aprobado 09 intacto:

1. Gestión desde el módulo de acciones, con selectores de origen en vez de campos UUID libres. El origen guardado se conserva hasta elegir explícitamente otro.
2. Preparación de contexto en la misma página con navegador opcional de archivos autorizados, motivo por archivo y retirada explícita; no limpia selecciones al cambiar origen.
3. Confirmaciones breves para reasignación y cancelación; creación incierta vuelve a la primera página sin atribuir coincidencias.

Mantiene Material UI, etiquetas, foco al título, disposición vertical adaptable, textos ajustables y controles de al menos 44 px. Sin dependencias nuevas. Revisar manualmente riesgo/hallazgo, membresía inactiva, plazo vencido conservado frente a modificado, sí/no/pendiente, archivos de contexto, reasignación, cancelación en revisión y errores simultáneos. Pendiente inspección móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones; sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos, editor/selectores bajo demanda y sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **572 pruebas correctas**, incluidas 43 nuevas de origen, membresías, creación, precarga/false, fechas, motivos, contexto/límite/duplicados, fuente autorizada, estados y roles, reasignación/cancelación, validación/CSRF, conflictos/incertidumbre, respuestas inválidas/tardías, guardas/revalidación y rutas contratadas. Conserva las 529 anteriores, ajustando la expectativa de botones de gestión de HU026 para AE/GS.
- `npm run test:gateway`: **17 pruebas HTTPS** correctas, incluidos archivos generados y operaciones acotadas.
- `docker build -t mspi-front-hu027-review .`: daemon de Docker Desktop local no disponible (pipe dockerDesktopLinuxEngine inexistente). Sin iniciar/reiniciar servicios; construcción a comprobar en CI.

Pruebas DOM/fetch y upstream HTTPS simulados. No acreditan integración con backend/PostgreSQL, reasignación, cuota/inspección reales ni recorrido manual en navegador. Sin despliegue ni cambios de datos empresariales. Avances, entrega, archivos de ejecución y aprobación/devolución independiente siguen para sus historias.
