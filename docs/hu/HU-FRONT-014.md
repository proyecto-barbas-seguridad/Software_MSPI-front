# HU-FRONT-014 · Crear y diligenciar borradores de evaluación

## Historia y alcance

Como AE o GS de la empresa activa, quiero crear una evaluación en borrador, diligenciar sus respuestas y registrar/editar hallazgos, para conservar el diagnóstico con sus referencias y revisión del servidor.

Parte de `Develop` en `141f6e0` (PR #14 fusionado). Continúa HU-FRONT-013 sobre el contrato OpenAPI 1.24.0, sin modificar backend, contrato ni documentos aprobados 01–09. No introduce datos ficticios en la aplicación: los ejemplos se limitan a fixtures de pruebas.

## Criterios implementados

- **Crear evaluación** desde el listado: nombre (máximo 200 caracteres), fecha, alcance, responsable y versiones de catálogo/metodología obligatorios. Sin selección ni fecha implícitas. Tras crear, abre la ficha del identificador devuelto por el servidor.
- Selectores empresariales paginados de cinco en cinco, con carga/error/reintento explícito, vacío y selección conservada al cambiar de página. Catálogos y metodologías solicitan `disponibleNuevos=true`. Metodologías compatibles por `identificador=EVALUACION_CONTROLES_V1`, independientemente de su código; responsable mediante `membresiaId`, sin consultar listas de usuarios o inventar UUID.
- **Diligenciar** exclusivamente borradores para AE/GS: precarga exacta de aplicabilidad, calificación, justificación y fundamento. Cero se conserva; pendiente se envía como null, no como cero. Sin decidir no envía nota. No aplica se ofrece para controles, requiere justificación (máximo 2000) y envía nota null; las cláusulas no ofrecen esa opción. Toda nota requiere fundamento, incluida cero. Permite guardar incompletos coherentes. El guardado confirma también una respuesta heredada, tal como hace el backend; se explica en el formulario.
- **Hallazgos** bajo demanda por respuesta, paginados: lectura, creación y edición de descripción de brecha y recomendación opcional. Valida asociación con la respuesta e identificadores/revisión. No hay eliminación ni transformación automática en riesgo/acción.
- Escrituras con `revisionEsperada` capturada al abrir el formulario, común a la evaluación; no se obtiene una revisión nueva para sobreescribir datos antiguos. No se edita si ficha/respuestas/resultados muestran revisiones distintas; hallazgos con otra revisión deshabilitan su edición. El backend mantiene la autorización y validación definitivas.
- Tras guardar respuesta/hallazgo se consultan nuevamente ficha, respuestas y resultados con el filtro vigente; no se calculan resultados optimistas. Las referencias iniciales permanecen fijas: el contrato no ofrece edición general de la ficha.
- Sesión del mismo origen y CSRF fresco del cliente tipado en cada escritura, sin JWT ni datos de formularios en almacenamiento persistente. AU conserva consulta; RA solo no accede al módulo; AP no adquiere permisos empresariales. Roles se combinan dentro de la empresa. No se implementan aprobaciones propias ni ajenas en esta historia.
- Reutiliza la protección de cambios al navegar/cambiar empresa/cerrar sesión/salir. Una revalidación de acceso conserva el formulario si sigue autorizado; pérdida de sesión o permisos retira el contexto. Bloquea envíos simultáneos y descarta callbacks de una ruta invalidada aunque el transporte ignore la cancelación.
- 400 conserva el formulario y muestra errores de campos; CSRF_INVALIDO permite un nuevo intento explícito. 401/403 de autorización retiran el contexto. 404/409 bloquean reenvío y requieren consultar estado; 0/5xx o respuesta inválida tras intentar escribir muestran resultado incierto y bloquean otra escritura.
- Consultar estado después de bloqueo requiere confirmación breve para descartar el formulario; cancelar conserva el contenido. La creación no tiene clave de idempotencia ni nombre único: encontrar un nombre igual no demuestra que se guardó esa solicitud. No se reintenta automáticamente, ni se asegura que abortar haya cancelado la transacción remota.

## Contratos verificados

- POST `/api/v1/empresas/{empresaId}/evaluaciones`.
- PUT `/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}`.
- GET/POST `…/respuestas/{respuestaId}/hallazgos`; PUT `…/hallazgos/{hallazgoId}`.
- GET `/api/v1/empresas/{empresaId}/responsables`, `/catalogos`, `/metodologias`, con paginación documentada.
- No existe GET individual de respuesta. Se relee la colección de respuestas y la ficha, sin inventar rutas.

Se contrastaron `ApiEvaluationController`, `EvaluationResponse.update`, `JpaEvaluationDrafts` y `V11__referencias_para_evaluacion.sql` del backend. Este último valida responsable local activo AE/GS, catálogo publicado no retirado y metodología publicada no retirada con el identificador anterior. El estado editable y la revisión se verifican nuevamente en cada escritura.

## Decisiones nuevas para revisión

Estas son decisiones de implementación propuestas, no cambios aprobados al diseño 09:

1. Formularios como páginas dentro del espacio de evaluaciones y cargados bajo demanda. Se conserva el patrón de controles nativos etiquetados bajo el tema MUI para cumplir la CSP vigente sin estilos inline. Campos en una columna, botones que se adaptan al ancho y controles con objetivo mínimo de 44 px.
2. Sin referencias preseleccionadas. La selección conserva su etiqueta al paginar; la ausencia de opciones compatibles se muestra por página y no se interpreta como ausencia global si hay más páginas.
3. Hallazgos desplegables separados de evidencias, con formulario de creación/edición completo. El texto del botón de guardado identifica que aún se trabaja sobre un borrador.
4. Confirmación nativa breve para descartar cambios y consultar estado, siguiendo el mecanismo ya existente; los formularios extensos no usan diálogos. La consulta explícita es necesaria antes de otro intento incierto, sin una supuesta reconciliación por nombre.

Revisión manual sugerida: crear un borrador con referencias reales disponibles, guardar una respuesta con cero y otra pendiente, justificar no aplica en un control, registrar/editar un hallazgo y comprobar cancelación, cambio de empresa y conflicto concurrente. Revisar también disposición móvil y uso con teclado/lector de pantalla.

## Verificación

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas, 121 operaciones; sin regeneración de contrato.
- `npm run build`: TypeScript estricto y compilación Vite correctos. Formulario de evaluación separado bajo demanda, unos 11 kB minificados; sin advertencia de archivo individual mayor de 500 kB.
- `npm run test:ui`: **150 pruebas**, incluidas 26 nuevas. Cubren valores reales/cero/null, cláusulas/exclusión/fundamento, creación y referencias paginadas, metodología por identificador, fallos de validación/CSRF/autorización, revisiones/conflictos, envíos dobles, alcance invalidado, creación incierta, creación/edición de hallazgos, AU, consulta paginada de hallazgos, cancelación y relectura de resultados del servidor. Se conservan las 124 anteriores, incluidas protecciones globales y RA denegado.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas; incluye CSP, entrega de los archivos del manifiesto, sesión/CSRF, métodos/cuerpos del contrato y conservación de conflictos.
- `docker build -t mspi-front-hu014-review .`: correcto, imagen `sha256:446ba6bdeda140dfcf65f5dacf343e874c2f2d4baef302510159924d59646f88`. Construcción de revisión sin despliegue.

Las pruebas usan DOM/fetch simulados y upstream HTTPS local; no acreditan pruebas en navegador real, inspección visual móvil, accesibilidad auditada ni integración con backend/PostgreSQL desplegados. No se han creado evaluaciones empresariales ni reiniciado servicios.

Fuera de alcance: envío a revisión, cierre/devolución, corrección de evaluación cerrada, confirmación heredada independiente, carga de evidencias, riesgos y acciones. Se mantienen las reglas existentes sin inventar políticas de aprobación.

Entrega mediante commit, push y PR a `Develop`; sin fusión ni auto-merge. La revisión y fusión son manuales del responsable.
