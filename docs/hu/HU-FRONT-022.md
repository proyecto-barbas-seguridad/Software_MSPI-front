# HU-FRONT-022 · Aceptación y ciclo de riesgos

## Historia y alcance

Como AE o GS de la empresa activa, quiero realizar las transiciones autorizadas del riesgo, aprobar su aceptación cuando tengo AE y cerrar con referencias conservadas y explicaciones de cancelaciones.

Parte de `Develop` en `2beed5d` (PR #22 fusionado). Continúa HU021 sobre OpenAPI 1.24.0. No modifica backend, contrato, infraestructura ni documentos aprobados 01–09. Los datos ficticios se limitan a fixtures de prueba.

## Criterios implementados

- Aceptación solo para AE, también con roles combinados, en riesgos no cerrados con tratamiento ACEPTAR. GS solo no aprueba; AU conserva consulta; RA solo no accede al módulo. La condición de administrador de plataforma no aporta membresías ni roles empresariales.
- Aceptación como formulario de página con justificación explícita, fecha de próxima revisión vacía y resumen de las referencias vigentes. Consulta la inherente exacta indicada por la ficha y la residual confirmada vigente de esa base, recorriendo las páginas necesarias y comprobando la revisión capturada. No asume que la primera fila es vigente; un borrador pendiente no invalida por sí solo una aceptación si hay valoraciones confirmadas vigentes. El servidor revalida dependencias y pruebas.
- Fecha válida estrictamente posterior al día de la empresa, calculado con su zona horaria. No usa el día UTC ni la zona del equipo. El backend vuelve a comprobarlo al escribir, incluyendo un posible cambio de día durante la edición.
- Aceptar no cambia de estado. La aprobación requiere confirmación breve y envía revisión capturada, justificación y fecha. Valida la respuesta VIGENTE, referencias, revisión incrementada y datos enviados; relee ficha e historial de aceptaciones.
- AE/GS pueden pasar de análisis a tratamiento/seguimiento, de tratamiento a seguimiento y desde seguimiento volver a análisis/tratamiento o cerrar. Identificado conserva el inicio de análisis de HU018; cerrado no se reabre.
- Toda transición exige motivo y confirmación. El regreso a análisis explica el cambio de contexto y la revisión de valoraciones; no exige valoraciones vigentes para permitirlo. Las demás condiciones de tratamiento, acciones, valoraciones y aceptación aplicable se comprueban en el backend. Los problemas se muestran sin afirmar éxito ni publicar estados optimistas.
- Cierre únicamente desde seguimiento. Antes de habilitarlo consulta todas las páginas de acciones autorizadas de la empresa y conserva solo código, identificador, riesgo y estado; filtra por riesgo localmente porque el contrato no ofrece filtro riesgoId. Los resultados no se muestran como un corte transaccional: el backend verifica nuevamente las acciones al cerrar.
- Una acción abierta bloquea el cierre. Se solicita una explicación de hasta 2000 caracteres por cada acción cancelada vinculada; se envía exactamente ese mapa y un mapa vacío si no existen canceladas. No ofrece UUID arbitrarios ni inventa nombres. Detecta identificadores repetidos durante la paginación y pide volver a consultar.
- El contrato de lectura de acciones no expone el motivo original de cancelación. No se usa motivoCambio como sustituto. La interfaz explica que la explicación del cierre no reemplaza ese motivo; el backend exige ambos cuando corresponde. No aprueba ni cancela tareas y conserva el recorrido independiente de aprobación de acciones.
- El servidor exige valoraciones vigentes, ausencia de borradores pendientes, acciones finalizadas/canceladas justificadas y aceptación aplicable al cerrar. La interfaz advierte del cierre definitivo; valida revisión, estado, justificación, base inherente y mapa devueltos. Relee ficha y presenta el cierre conservado que ya consulta HU017.
- El fallo al consultar acciones impide el cierre, sin impedir por ese motivo otras transiciones que no requieren esa preparación. Las lecturas se cancelan/ignoran al abandonar el ámbito; los resultados tardíos no actualizan otra empresa o ruta.
- Escrituras tipadas con sesión del mismo origen, CSRF fresco y revisión capturada, sin rebase automático. Bloquea envíos simultáneos. Protege texto al navegar/cambiar empresa y mantiene formularios solo en memoria.
- 400 muestra validación y conserva contenido; CSRF_INVALIDO permite otro intento explícito. 401/403 de autorización retira contexto. 404/409 bloquean otra escritura hasta consultar; 0/5xx o respuesta inválida se consideran inciertos, pues pueden haberse guardado. No reenvía automáticamente. Reconsultar pide confirmar el descarte del formulario.

## Contratos contrastados

- POST `/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/aceptaciones`: revisionEsperada, justificacion, fechaProximaRevision.
- POST `/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/transiciones`: revisionEsperada, destino, motivo y accionesCanceladas únicamente en cierre.
- GET existentes de inherentes, residuales y acciones empresariales con pagina/tamano; no se añaden filtros o endpoints.

Se contrastaron `JpaInherentRisks.accept/transition/requireCurrentAssessments/requireNoPendingAssessments/actionStatus/requireApplicableAcceptance`, los controladores de riesgos, `ApiErrors`, permisos ACCEPT_RISK/TRANSITION_RISK y el contrato generado. No se incorpora una política nueva de aceptación o aprobación de tareas.

## Decisiones nuevas para revisión

Propuestas de implementación, sin alterar el documento aprobado 09:

1. Una página por decisión, con resumen del riesgo y confirmación breve antes del POST. Fecha y motivos sin valores sugeridos.
2. Cierre con consulta completa de acciones y explicación separada por cancelada. El botón queda bloqueado ante acciones abiertas o lectura incompleta; otras transiciones se validan al escribir sin cargar ese listado.
3. Descarte confirmado y relectura del servidor ante conflicto o resultado incierto; sin sustituir silenciosamente la revisión capturada.

Mantiene tema MUI, etiquetas, foco al título, disposición vertical adaptable y objetivos de 44 px. No añade dependencias. Revisión manual sugerida: AE combinado frente a GS/AU, fecha en otra zona, aceptación sin cambio de estado, retorno a análisis, cierre con cero/canceladas/abiertas, conflictos y navegación con texto pendiente. Pendiente comprobación visual móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- Contrato 1.24.0 verificado: 93 rutas / 121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos; formulario bajo demanda, sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **382 pruebas correctas**, incluidas 36 nuevas de aceptación, roles, fechas y zonas, preparación paginada, transiciones, cierre, errores, CSRF, ámbito invalidado, metadatos y protección de cambios. Conserva las 346 anteriores.
- `npm run test:gateway`: 17 pruebas HTTPS correctas.
- `docker build -t mspi-front-hu022-review .`: no pudo ejecutarse porque Docker Desktop no tiene el daemon disponible (pipe dockerDesktopLinuxEngine inexistente). No se arrancaron servicios. La construcción de imagen se verifica en CI.

Pruebas con DOM/fetch simulados y upstream HTTPS local; no acreditan integración con backend/PostgreSQL reales ni recorrido manual en navegador. Backend y datos empresariales intactos. La creación de un riesgo relacionado a uno cerrado, gestión de implementaciones/archivos y gestión de acciones quedan fuera de esta HU.
