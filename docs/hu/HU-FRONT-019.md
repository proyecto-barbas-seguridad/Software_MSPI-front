# HU-FRONT-019 · Valoración inherente de riesgos

## Historia y alcance

Como AE o GS de la empresa activa, quiero guardar y confirmar una valoración inherente de un riesgo en análisis, conservando sus antecedentes y distinguiendo los campos pendientes de un resultado confirmado por el servidor.

Parte de `Develop` en `9255cf7` (PR #19 fusionado). Continúa HU017–HU018 sobre el contrato OpenAPI 1.24.0, sin modificar backend, contrato, infraestructura ni documentos aprobados 01–09. Los datos ilustrativos se limitan a fixtures de pruebas.

## Criterios implementados

- **Nueva valoración inherente** solo para AE/GS y riesgo en análisis. En el historial, únicamente borradores admiten **Editar borrador inherente** y **Confirmar valoración inherente**. Confirmadas conservan consulta, sin edición. AU mantiene lectura; RA solo no accede al módulo y AP no obtiene permisos empresariales automáticamente.
- Creación sin probabilidad/impacto preseleccionados ni copia implícita de una valoración anterior. Entradas opcionales al guardar: categorías, periodo de referencia (máximo 150), fundamento, supuestos y fuente. Vacíos se envían como null, sin cero ni categoría ficticia. El frontend no calcula matriz, nivel ni índices.
- Primera valoración omite motivo de reevaluación. Si la ficha tiene inherente registrada, exige motivo no vacío de hasta 2000 y el backend vincula el antecedente. La anterior se conserva y no se sustituye al guardar un borrador; la sustitución solo ocurre al confirmar.
- La metodología la selecciona/fija el backend; no ofrece un selector ni UUID metodológico inventado. En el borrador existente conserva y muestra metodología, antecedente y motivo originales, sin modificarlos al editar.
- **Guardar borrador inherente** y **Confirmar valoración guardada** son acciones distintas. El guardado permite pendientes y nunca encadena confirmación automática. Edición precarga los valores reales, incluidos faltantes, con revisión común capturada del riesgo.
- Confirmación muestra valores guardados, con controles de categoría deshabilitados y textos de solo lectura; no envía una nueva copia de las entradas. Requiere los seis campos que exige `RiskMatrix.missing`: probabilidad, impacto, periodo, fundamento, supuestos y fuente. Enumera pendientes y dirige a editar/guardar antes de confirmar. Una confirmación completa exige además confirmación nativa breve.
- Borrador con contexto desactualizado permite edición/guardado explícito para actualizar su contexto; confirmación deshabilitada mientras `requiereRevision` siga activo. La página muestra el contexto actual del riesgo para revisión. No hay rebase automático ni confirmación de datos que el usuario aún no guardó.
- Ficha y borrador deben compartir riesgo/revisión y estado editable; una lectura de otra revisión deshabilita edición/confirmación. El servidor comprueba nuevamente permiso, estado, revisión y contexto en cada escritura.
- Tras guardar/confirmar, consulta nuevamente ficha y valoraciones, desplegando inherentes y mostrando nivel/índices del servidor. No inserta resultados optimistas ni cambia el nivel registrado localmente. La actualización retira el dato anterior antes de recargar para evitar remontar el historial y solicitarlo con una ficha anterior.
- Si el backend informa `BORRADOR_INHERENTE_EXISTENTE`, bloquea otra escritura y permite confirmar descarte para reconsultar el historial y abrir el borrador devuelto por GET. No presupone su identificador ni reenvía creación. La presencia de un borrador no demuestra por sí sola qué solicitud lo creó.
- Valida respuesta asociada al riesgo, revisión incrementada, identificador/metodología preservados en versiones existentes, vínculo/motivo al crear y estado esperado. Borrador sin nivel/índices/base de confirmación; confirmada con nivel, índices, base, autor y fecha. Metadatos inesperados se consideran resultado incierto.
- Todas las escrituras usan API tipada, sesión del mismo origen y CSRF fresco. No usa JWT, persistencia del formulario o reintentos automáticos. Reutiliza protección de cambios al navegar/cambiar empresa/cerrar sesión/salir y revalidación de autorización.
- Impide envíos simultáneos y resultados tardíos tras desmontar/invalidar ámbito. 400 muestra campos del servidor y conserva contenido; CSRF_INVALIDO permite intento explícito; 401/403 de autorización retira el contexto.
- Incompletitud devuelta por el backend enumera los campos y permite volver para editar, sin afirmar confirmación. 404/409 de estado/revisión/contexto/metodología/borrador existente bloquean escrituras hasta consultar estado. 0/5xx o respuesta inválida muestra incertidumbre y exige descarte confirmado para reconsultar, sin atribuir éxito, duplicar ni asumir que abortar revirtió la transacción remota.

## Contratos y reglas contrastados

- POST `/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-inherentes`, con `revisionEsperada`, `entradas` y motivo de reevaluación cuando corresponde.
- PUT `…/valoraciones-inherentes/{valoracionId}`, con `revisionEsperada` y `entradas`.
- POST `…/valoraciones-inherentes/{valoracionId}/confirmar`, únicamente con `revisionEsperada`.
- Relectura mediante ficha y colección paginada existentes; no hay GET individual de valoración inherente y no se inventa esa ruta.

Se contrastaron `ApiInherentRiskController`, `JpaInherentRisks.startAssessment/editAssessment/confirmAssessment`, `InherentAssessment.update/view`, `RiskMatrix.missing/calculate`, `ApiErrors` y PER-25. Se mantiene la política del backend: solo en análisis, un borrador pendiente, metodología disponible para crear, motivo ausente en primera valoración y obligatorio en reevaluación, confirmación completa/contexto vigente. No se introducen rúbricas o índices nuevos.

## Decisiones nuevas para revisión

Propuestas de implementación, sin modificar el diseño aprobado 09:

1. Formulario como página bajo demanda, con pendientes explícitos y sin categorías por defecto; confirmación sobre los datos guardados en otro paso. No usa diálogos extensos.
2. Motivo únicamente al crear una reevaluación y antecedentes visibles al editar/confirmar. Guardar no reemplaza la referencia confirmada vigente.
3. Recuperar un borrador ya existente o un resultado incierto mediante consulta explícita de ficha/historial, sin otra creación ni reconciliación ficticia.
4. Desplegar el historial inherente después de guardar y retirar la ficha anterior mientras se carga la nueva, conservando filtros y las protecciones existentes.

Controles etiquetados, mínimos de 44 px, distribución vertical, botones adaptables y ajuste de textos largos; tema MUI y CSP sin estilos inline. Sin dependencias nuevas.

Revisión manual sugerida: primera valoración pendiente, completar/editar y confirmar; crear reevaluación con motivo y comprobar antecedente; cambiar contexto desde HU018, guardar explícitamente el borrador y confirmar; probar borrador existente, conflicto, permiso retirado y cancelación. Revisar móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: contrato 1.24.0, 93 rutas/121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos. Formulario bajo demanda, aproximadamente 9 kB minificados; sin archivos individuales mayores de 500 kB. No acredita transferencia total menor ni rendimiento medido.
- `npm run test:ui`: **286 pruebas**, incluidas 29 nuevas. Cubren primera valoración pendiente sin valores/motivo inventados, reevaluación, precarga/revisión capturada, guardado separado, confirmación explícita/solo datos guardados, pendientes, contexto desactualizado, revisiones incompatibles, validación/incompletitud, borrador existente, conflictos/metodología, incertidumbre, autorización/CSRF, duplicación/ámbito invalidado, metadatos inválidos, versiones confirmadas/AU/estados no editables, protección de cambios y relectura de ficha/historial sin consulta intermedia de contexto anterior. Conserva las 257 anteriores.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas; rutas/métodos/cuerpos del contrato, límites, sesión/CSRF, conflictos, CSP y entrega de todos los archivos del manifiesto.
- `docker build -t mspi-front-hu019-review .`: correcto, imagen `sha256:6b7c07c11c3555e9e18d1718c1c65665784daa2d2430cab9bd0d19d7ce8a8d9d`. Sin despliegue ni reinicio de servicios.

Pruebas con DOM/fetch simulados y upstream HTTPS local. No acreditan interacción/inspección visual en navegador real, auditoría de accesibilidad ni integración con backend/PostgreSQL desplegados. No se guardaron ni confirmaron valoraciones empresariales.

Fuera de alcance: valoraciones residuales, gestión/vinculación de controles, aprobación de aceptación, transiciones posteriores/cierre de riesgo y riesgo relacionado; acciones y nuevas políticas metodológicas.

Entrega mediante commit, push y PR hacia `Develop`, sin fusión ni auto-merge. Revisión y fusión manuales por el responsable.
