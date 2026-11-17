# HU-FRONT-015 · Ciclo de evaluación en React

## Historia y alcance

Como AE o GS de la empresa activa, quiero enviar un borrador a revisión, devolverlo con motivo, cerrarlo cuando el backend valide sus requisitos y crear una corrección vinculada si requiere cambios posteriores, conservando el cierre original.

Parte de `Develop` en `a4d147f` (PR #15 fusionado). Continúa HU-FRONT-014 con el contrato OpenAPI 1.24.0 existente. No modifica backend, contratos, infraestructura ni documentos aprobados 01–09. Los fixtures usan datos de prueba; la aplicación consulta datos autorizados del servidor.

## Criterios implementados

- Botones según estado y permisos empresariales: borrador → enviar a revisión; en revisión → devolver/cerrar; cerrada → crear corrección. AU conserva lectura y consulta del cierre, RA solo no accede al módulo y AP no obtiene acceso empresarial automáticamente. No se editan respuestas en revisión/cerrada.
- Respeta la matriz aprobada PER-21: AE o GS puede revisar/cerrar la evaluación que diligenció. La separación obligatoria de personas sigue aplicando a aprobación de acciones; esta historia no introduce decisiones sobre tareas.
- Formularios como páginas cargadas bajo demanda. Toda escritura tiene confirmación breve explícita, usa la revisión capturada al abrir y reconsulta la ficha/resultados después de guardar. Una confirmación heredada no vuelve a enviar ni modifica los valores de la respuesta.
- Envío y cierre permiten seleccionar explícitamente un adjunto por respuesta aplicable. Respuestas sin filtros y adjuntos paginados de cinco en cinco, con carga/error/vacío/reintento explícito. Selecciones y etiquetas se conservan entre páginas. Se distinguen cero, pendiente, sin decidir, no aplica y herencia pendiente, mostrando fundamento/justificación para revisión.
- No preselecciona archivos ni presume que un estado de inspección antiguo acredita su validez actual. Archivos con inspección pendiente/error no se ofrecen como selección nueva; el servidor comprueba pertenencia, integridad y autorización al transicionar. Al cerrar se seleccionan nuevamente los adjuntos revisados; no se reutiliza silenciosamente la selección hecha al enviar.
- Para correcciones, obtiene y valida el cierre anterior; ofrece su evidencia vinculada a la respuesta heredada, con enlace a la evaluación de origen. Puede conservar una procedencia de una evaluación anterior en la cadena, como permite el backend. No copia archivos ni crea permisos nuevos. No se presume un endpoint que liste la selección del envío: `GET cierre` existe solamente para evaluaciones cerradas.
- La política actualmente implementada en el backend es `F1-1_EVIDENCIA_V1`, condicionada al catálogo/metodología compatibles: aplicabilidad resuelta, nota/fundamento, exclusiones justificadas y herencia confirmada; una nota mayor que cero requiere adjunto. Cero requiere fundamento pero no adjunto obligatorio según esta política. No se implementan rúbricas nuevas ni referencias documentales como sustituto de un archivo; su suficiencia por criterio conserva el estado de la documentación.
- El backend valida toda la evaluación, no solo la página visible. `EVALUACION_INCOMPLETA` conserva selección y enumera sus campos por respuesta, usando código cuando ya se consultó y UUID en los demás casos. Permite ajustar evidencia y reintentar explícitamente. Para editar valores o confirmar respuestas se cancela y vuelve al borrador. No se afirma que una página completa pruebe la completitud global.
- Devolver exige motivo no vacío de máximo 2000 caracteres. Corregir exige motivo y responsable local disponible AE/GS, seleccionado sin valor implícito mediante el selector mínimo de membresías. Abre el nuevo identificador devuelto y valida estado borrador, vínculo original y versiones conservadas. Una corrección existente se informa; no se genera otra automáticamente.
- **Confirmar heredada** aparece solo para una respuesta heredada pendiente de un borrador editable; muestra valores actuales y confirma sin sustituir el formulario de edición de HU014. Mantiene nota pendiente si así estaba: confirmar herencia no acredita completitud ni cambia el resultado.
- En una ficha cerrada, los resultados visibles proceden de `GET cierre`: instantánea inmutable, fecha, política y referencias de catálogo/metodología, autor y evidencia con procedencia/huella conservada. Se validan identificador, versiones, actor/fecha, revisión del resultado y referencias de evidencia. No se sustituye un cierre fallido por resultados actuales presentados como históricos. Las referencias técnicas se agrupan en un desplegable.
- Reutiliza sesión del mismo origen y CSRF fresco por escritura, protección de cambios sin guardar al navegar/cambiar empresa/cerrar sesión/salir y revalidación de autorización. Borradores solo en memoria; ninguna escritura tiene reintento automático. Controla envíos simultáneos y callbacks tardíos con desmontaje/cambio de ámbito.
- 400/CSRF_INVALIDO conserva contenido para corrección/reintento explícito; 401/403 de autorización retira el contexto; 404/409 de estado/revisión/política/corrección existente bloquea el envío y requiere consultar estado. 0/5xx o respuesta de transición inválida indica resultado incierto y bloquea otra escritura: cancelar el transporte no garantiza revertir la operación remota. Consultar estado exige confirmar el descarte. Una corrección incierta requiere comprobar si ya existe antes de intentar crear otra.

## Contratos y reglas contrastados

- POST `…/evaluaciones/{evaluacionId}/enviar-revision`, `/devolver`, `/cerrar`, `/correcciones`.
- GET `…/evaluaciones/{evaluacionId}/cierre`.
- POST `…/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/confirmar-heredada`.
- Lecturas existentes de respuestas, evidencias y responsables con paginación documentada.

Todas las rutas incluyen `/api/v1/empresas/{empresaId}`. Se contrastaron `ApiEvaluationLifecycleController`, `EvaluationClosing`, `JpaEvaluationDrafts`, `ApiErrors`, el contrato generado y las migraciones de revisión/cierre. El backend devuelve problemas con campos como `respuestas.{UUID}.evidenciaId`; no hay GET individual de respuesta ni de la selección enviada a revisión.

## Decisiones nuevas para revisión

Estas decisiones de interfaz son propuestas de implementación y no una modificación aprobada del documento 09:

1. Preparación de evidencias por páginas, selección persistente en memoria y nueva selección explícita al cerrar. La ficha existente permite consultar/descargar archivos antes de iniciar la transición; este formulario selecciona las referencias y no incorpora otro visor de archivos.
2. El cierre conserva su propia sección de resultados históricos, sin duplicar en pantalla el resultado de la consulta actual. Referencias técnicas y huellas quedan desplegables para trazabilidad.
3. Corrección desde la ficha cerrada y confirmación de herencia por respuesta, con formulario/página contextual y confirmación nativa breve antes de escribir. No se crea una revisión mediante edición del original.
4. Se extrae el selector de referencias de HU014 para reutilizarlo, conservando su comportamiento y sin nuevas dependencias. Controles etiquetados con altura mínima de 44 px, distribución vertical, botones adaptables y ajuste de textos largos; hereda tema MUI y CSP sin estilos inline.

Revisión manual sugerida: enviar con faltantes y comprobar su identificación, seleccionar un adjunto en distintas páginas, devolver con motivo, cerrar una evaluación completa compatible, consultar instantánea como AU, crear corrección, confirmar/editar heredadas y comprobar conflicto, pérdida de acceso y cancelación de cambios. Revisar móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas y 121 operaciones, sin cambios.
- `npm run build`: TypeScript estricto y Vite correctos. Ciclo/consulta de cierre bajo demanda y selector compartido separado; sin archivos individuales de más de 500 kB.
- `npm run test:ui`: **178 pruebas**, incluidas 28 nuevas. Cubren transiciones por estado, selección explícita y persistente/paginada, inspección pendiente, faltantes del backend, cero sin adjunto obligatorio, motivo, corrección y vínculo, herencia/evidencia histórica, revisión capturada, conflictos/política/corrección existente, guardados inciertos, CSRF, autorización, duplicación/cancelación/ámbito invalidado, respuesta inválida, instantánea y metadatos, AU lector y relectura de resultados. Conserva las 150 anteriores, incluida denegación a RA y protecciones generales.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas, incluyendo rutas/métodos/cuerpos del contrato, sesión/CSRF, CSP y entrega de todos los archivos declarados en el manifiesto.
- Imagen de revisión: `docker build -t mspi-front-hu015-review .`, correcta (`sha256:69147f02cdebdc72c8ffa7fc86fc609ef3608953a958eeabff5db48e889d8776`), sin despliegue ni reinicio de servicios.

Pruebas con DOM/fetch simulados y upstream HTTPS local. No acreditan interacción en navegador real, auditoría visual/accesibilidad ni integración con backend/PostgreSQL/inspección de archivos desplegados. No se escribieron evaluaciones empresariales.

Fuera de alcance: carga de evidencias nuevas, gestión de cuotas/retención, riesgos, acciones y políticas metodológicas nuevas. El servidor conserva la decisión final sobre cada transición.

Entrega mediante commit, push y PR hacia `Develop`; sin fusión ni auto-merge. Revisión y fusión manuales por el responsable.
