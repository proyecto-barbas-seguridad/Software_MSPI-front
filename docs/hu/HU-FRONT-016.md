# HU-FRONT-016 · Carga privada de evidencias de evaluación

## Historia y alcance

Como AE o GS de la empresa activa, quiero adjuntar un archivo a una respuesta de una evaluación en borrador para documentar el diagnóstico con validación del servidor y trazabilidad de la revisión.

Parte de `Develop` en `0f58540` (PR #16 fusionado). Continúa HU014–HU015, sobre OpenAPI 1.24.0. No modifica backend, contrato, documentos aprobados 01–09 ni infraestructura. La aplicación no incluye datos ilustrativos; los archivos de ejemplo se limitan a pruebas simuladas.

## Criterios implementados

- **Adjuntar evidencia** desde cada respuesta editable. Solo AE/GS de la empresa activa y estado borrador; AU mantiene lectura, RA solo no accede al módulo y AP no obtiene permisos empresariales automáticamente. Reutiliza la comprobación de revisiones diferentes de HU013–HU015.
- Formulario como página bajo demanda, con un archivo y descripción opcional de hasta 1000 caracteres. Muestra empresa mediante el espacio autenticado, evaluación, respuesta y revisión capturada. Conserva descripción/selección en errores recuperables; no usa almacenamiento persistente ni previsualiza el contenido.
- Validación local de archivo seleccionado, nombre no vacío de hasta 255 caracteres, sin separadores de ruta ni caracteres Unicode de control/formato, extensión PDF/PNG/JPG/JPEG, contenido no vacío y límite de **10 000 000 bytes**. `accept` es una ayuda del selector, no una garantía de seguridad. No rechaza solo porque el navegador no informe MIME; el servidor detecta y valida el contenido real.
- POST multipart tipado al ámbito de empresa/evaluación/respuesta, con `archivo` como File real, `revisionEsperada` capturada de la respuesta y descripción recortada si existe. Conserva nombre original y deja al navegador construir el boundary/Content-Type. Sesión del mismo origen, CSRF fresco, sin JWT ni solicitudes externas.
- Valida metadatos devueltos: evidencia, revisión incrementada exactamente en uno, nombre/tamaño, tipo detectado consistente con extensión, descripción e inspección limpia registrada. Una respuesta inválida se trata como escritura incierta; no se presenta como carga confirmada.
- La carga incrementa la revisión común de evaluación, sin alterar nota, aplicabilidad, fundamento o confirmación de herencia. Tras éxito consulta nuevamente ficha, respuestas y resultados; abre el listado paginado de evidencias de la respuesta mediante GET. No inserta metadatos optimistas en el listado, no calcula resultados locales y no selecciona el adjunto automáticamente para revisión/cierre.
- Carga/validación se muestra como estado indeterminado: no inventa porcentaje de transferencia o de inspección. Evita envíos simultáneos, protege cambios sin guardar al navegar/cambiar empresa/cerrar sesión/salir y descarta callbacks al perder el ámbito/desmontar. Salir o abortar no garantiza cancelar la transacción remota.
- 400 conserva el formulario y muestra problemas de campos. CSRF_INVALIDO permite reintento explícito; 401/403 de autorización retira el contexto.
- 413 y EVIDENCIA_BLOQUEADA (422) requieren seleccionar otro archivo; no se confunden con autorización perdida. Cuota agotada (409), cuota no configurada (503) e inspección no disponible (503) son rechazos conocidos y muestran instrucciones para un nuevo intento explícito, sin reintento automático ni afirmación de publicación. Muestra referencia de soporte y Retry-After si existen.
- 404, conflicto de revisión/estado y otros 409 bloquean otra escritura hasta consultar estado. 0/5xx no identificados como rechazo conocido, almacenamiento no disponible o metadatos inválidos se consideran inciertos: el archivo puede haberse guardado. Se conserva el formulario, se bloquea reenvío y se requiere confirmar descarte antes de reconsultar evaluación/evidencias. Coincidir en nombre o tamaño no demuestra que sea la misma solicitud; no hay reconciliación ni idempotencia ficticias.
- El cliente conserva 15 s por defecto para consultas/JSON y admite 45 s por defecto para multipart, incluyendo CSRF y espera de procesamiento. El gateway ya existente limita la subida y establece 30 s de plazo al upstream multipart. No se alteran sus límites ni se garantiza que una carga lenta termine. `timeoutMs` explícito del cliente conserva precedencia en todos los métodos. Un timeout sigue siendo incierto y no reenvía el archivo.

## Contratos y reglas contrastados

POST `/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/evidencias` con campos multipart `archivo`, `revisionEsperada`, `descripcion` opcional. Respuesta 201: `ResponseEvidenceUpload { evidencia, revisionEvaluacion }`. Consulta y descarga privadas de HU013 se mantienen, con nueva inspección del backend al descargar.

Se contrastaron `ApiEvidenceController`, `EvidenceContent`, `JpaResponseEvidence`, `ApiErrors`, el contrato generado y gateway. El backend comprueba permisos/revisión antes de inspeccionar y al publicar, contenido real y límites, inspección, cuota y almacenamiento. No se sustituye esa validación por extensión/MIME del navegador. No se inventa una consulta de cuota o endpoint para borrar/reemplazar archivos.

## Decisiones nuevas para revisión

Son propuestas de implementación, sin modificar el diseño aprobado 09:

1. Página de carga por respuesta, sin arrastrar/soltar, vista previa ni cargas simultáneas. Selector nativo etiquetado, descripción, nombre/tamaño y estado indeterminado; mantiene tema MUI y CSP sin estilos inline.
2. Regreso a la ficha con aviso de carga confirmada y evidencias de esa respuesta desplegadas, obtenidas nuevamente del servidor. Se conserva el filtro de respuestas que estaba activo. La selección de evidencia para enviar/cerrar permanece como decisión explícita separada.
3. Rechazos de inspección/tamaño obligan a reemplazar la selección; problemas de cuota/inspección indisponible admiten intento manual posterior. Conflictos y resultados inciertos exigen descarte confirmado y consulta, conservando el patrón de formularios anteriores.
4. Espera multipart diferenciada de la de consultas, manteniendo una cota del cliente y las restricciones existentes del gateway. No se simula progreso ni éxito de inspección desde el frontend.

Revisión manual sugerida: adjuntar PDF/imagen válida y consultar/descargar desde la ficha; probar descripción vacía y con texto; archivos vacíos/sobredimensionados o rechazados por inspección; cuota ausente/agotada; conflicto con otra edición; permiso retirado; cancelación/cambio de empresa durante carga; inspección de los estados en móvil y con teclado/lector de pantalla.

## Verificación y límites

- `npm run contracts:check`: contrato 1.24.0, 93 rutas, 121 operaciones; sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos. Formulario de carga separado bajo demanda, aproximadamente 7 kB minificados; sin advertencias por archivo individual mayor de 500 kB.
- `npm run test:ui`: **208 pruebas**, incluidas 30 nuevas. Cubren File/nombre real multipart, revisión capturada, descripción opcional y Unicode, límite exacto/tamaño cero/extensiones/nombres inseguros, MIME ausente, validación/CSRF, inspección/tamaño/cuota, estado/revisión, operaciones inciertas, duplicación, ámbito invalidado, metadatos incorrectos, AU/estado no editable, cancelación, relectura de resultados/evidencias y respuesta multipart a los 20 s con reloj simulado. Conserva las 178 anteriores, incluida denegación RA y protecciones generales.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas; transporte multipart acotado sin modificar boundary/bytes, sesión/CSRF, rutas y límites, errores/conflictos, CSP y publicación de todos los archivos del manifiesto.
- `docker build -t mspi-front-hu016-review .`: correcto, imagen `sha256:34ae3777a746f55cd5299b4ed5a69d19cf83d89bea4c729049907f62127ab34e`. Sin despliegue ni reinicio de servicios.

Pruebas con DOM/fetch simulados, archivos de prueba y upstream HTTPS local. No acreditan interacción con el selector nativo en navegador real, auditoría visual/accesibilidad ni integración con backend/PostgreSQL/antimalware desplegados. No se cargaron archivos ni se crearon datos empresariales en el backend.

Fuera de alcance: eliminación/reemplazo de adjuntos, referencias documentales como sustituto, administración de cuotas/retención, cargas de controles o acciones, y funcionalidades de riesgos/acciones. Sus reglas conservan el estado de la documentación.

Entrega mediante commit, push y PR hacia `Develop`; sin fusión ni auto-merge. La revisión y fusión son manuales del responsable.
