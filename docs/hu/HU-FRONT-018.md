# HU-FRONT-018 · Crear/editar riesgos e iniciar análisis

## Historia y alcance

Como AE o GS de la empresa activa, quiero registrar un riesgo, mantener su contexto y responsable e iniciar su análisis, respetando las restricciones del estado y las referencias ya valoradas.

Parte de `Develop` en `a42e1e7` (PR #18 fusionado). Continúa HU017 sobre OpenAPI 1.24.0. No modifica backend, contrato, infraestructura ni documentos aprobados 01–09. Los datos ilustrativos se limitan a fixtures de pruebas.

## Criterios implementados

- **Crear riesgo** desde el listado y **Editar riesgo** desde una ficha no cerrada, para AE/GS de esa empresa. AU conserva lectura, RA solo no accede al módulo y AP no adquiere permisos empresariales automáticamente. Código inmutable tras crear; riesgo cerrado sin edición directa.
- Formulario como página bajo demanda: código obligatorio de hasta 80, activo principal, amenaza/vulnerabilidad obligatorias de hasta 1000, descripción obligatoria, responsable de negocio y tratamiento propuesto opcional. Pendiente se envía como null; proponer aceptar no aprueba aceptación ni aplica descuentos.
- Creación sin referencias preseleccionadas. Activos y responsables de negocio activos, cinco en cinco, con carga/error/vacío/reintento explícito. El activo se busca por nombre/código mediante filtro del servidor; selección y etiqueta se conservan al paginar/buscar. El responsable usa `/responsables-negocio` y `responsableId`, no membresías o `/responsables` de evaluaciones.
- Edición precarga los valores reales y conserva referencias actuales aunque no aparezcan entre las opciones activas. No impone reemplazar una referencia histórica sin modificación; el backend valida cualquier sustitución. No inventa nombres ni UUID para referencias ausentes.
- Identificado/en análisis: contexto y tratamiento editables. En tratamiento/seguimiento: contexto y tratamiento deshabilitados, solo responsable modificable. Al enviar conserva los valores originales de los controles deshabilitados, que FormData no incluiría. No ofrece cambios que el backend prohíbe.
- Si cambia activo, amenaza, vulnerabilidad o descripción y hay referencia inherente registrada, exige motivo de hasta 2000. Un cambio solo de responsable no obliga a justificar un cambio de contexto inexistente. El servidor conserva antecedentes, aumenta contexto/revisión y marca revisión cuando corresponde; el frontend no recalcula ni invalida versiones por su cuenta.
- **Iniciar análisis** solo desde identificado, con confirmación breve y revisión capturada. El backend comprueba estado y responsable activo. No crea ni confirma valoraciones ni permite avanzar a tratamiento/seguimiento/cierre en esta historia.
- Todas las escrituras usan API tipada, sesión del mismo origen y CSRF fresco. Edición/inicio usan la revisión leída al abrir, sin rebase automático. Valida ID/código, estado y revisión de respuesta; una respuesta inválida se considera incierta.
- Tras crear abre la ficha del nuevo identificador. Tras editar/iniciar consulta otra vez la ficha; muestra estado/niveles y revisión requerida del servidor, sin valores optimistas. Se mantienen filtros del listado en una empresa y las protecciones globales al navegar/cambiar empresa/cerrar sesión/salir, incluida revalidación sin perder un formulario modificado que siga autorizado.
- Evita envíos simultáneos y callbacks tardíos por desmontaje/ámbito invalidado. Borrador solo en memoria, sin almacenamiento persistente. Abortar no garantiza revertir una operación remota.
- 400 conserva contenido y muestra problemas de campo, incluidos `detalle.*`. CSRF_INVALIDO permite intento explícito; 401/403 de autorización retira el contexto. Duplicado de código o referencia no disponible (409) conserva formulario editable para corregir; iniciar análisis con responsable no disponible requiere volver a la ficha para editarlo.
- 404, conflicto de revisión/estado y otros 409 no corregibles bloquean escrituras hasta consultar estado. 0/5xx y metadatos inválidos indican resultado incierto, bloquean reenvío y exigen confirmar descarte. Para creación incierta, vuelve al listado con el código como filtro de inspección: su unicidad no prueba qué solicitud creó un registro. No reintenta ni atribuye automáticamente la creación.

## Contratos y reglas contrastados

- POST `/api/v1/empresas/{empresaId}/riesgos` con `codigo` y `detalle`.
- PUT `…/riesgos/{riesgoId}` con `revisionEsperada`, `detalle` y motivo opcional.
- POST `…/riesgos/{riesgoId}/iniciar-analisis` con `revisionEsperada`.
- GET `/api/v1/empresas/{empresaId}/activos` con estado activo/texto/paginación y `/responsables-negocio` con estado activo/paginación.

Se contrastaron `ApiInherentRiskController`, `JpaInherentRisks.register/edit/startAnalysis`, `RiskRecord.changesBasis/view`, `ApiErrors`, OpenAPI y PER-24. El backend solo exige referencias activas si se crean/sustituyen; al iniciar análisis vuelve a comprobar responsable. El filtro de código de riesgo se normaliza en servidor, sin buscar por descripción. No se añaden rutas de eliminación, aprobación de aceptación o revisiones relacionadas en esta historia.

## Decisiones nuevas para revisión

Son propuestas de implementación; el diseño 09 conserva su estado aprobado:

1. Un formulario de página para creación/edición y una página contextual con confirmación nativa breve para iniciar análisis. No usa diálogos extensos ni nuevas dependencias.
2. Referencias explícitas sin valores iniciales al crear; al editar se conserva identificador actual con su etiqueta disponible, sin confundir responsable de negocio con cuenta/membresía.
3. Bloqueo visual de contexto/tratamiento en estados avanzados y motivo condicionado al cambio real de contexto valorado. El motivo opcional también puede acompañar una edición de responsable, como admite el contrato.
4. Consulta del código tras creación incierta como inspección, sin asumir idempotencia ni ownership de la solicitud. La ficha se relee después de las otras escrituras.

Controles etiquetados, mínimos de 44 px, distribución vertical/botones adaptables y texto largo ajustable; hereda tema MUI y CSP sin estilos inline. La búsqueda de activos del selector tiene límite de interfaz de 200 caracteres, dentro del máximo de 250 del contrato.

Revisión manual sugerida: crear con referencias reales; editar sin cambios y sustituir responsable; cambiar contexto valorado con/sin motivo; comprobar bloqueo de campos en tratamiento/seguimiento, confirmar/cancelar inicio de análisis, código duplicado, referencia archivada, conflicto concurrente, pérdida de acceso y cambio de empresa con cambios. Revisar móvil, teclado y lector de pantalla.

## Verificación y límites

- `npm run contracts:check`: contrato 1.24.0, 93 rutas/121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos; formulario separado bajo demanda, aproximadamente 11 kB minificados y sin archivos individuales de más de 500 kB. No acredita reducción de transferencia total ni rendimiento real.
- `npm run test:ui`: **257 pruebas**, incluidas 26 nuevas. Cubren creación con referencias explícitas y tratamiento pendiente, precarga/revisión/código fijo, motivo condicionado, estados avanzados, referencias actuales ausentes, búsqueda/paginación, duplicados/validación/referencias no disponibles, conflictos/incertidumbre, inspección de código, autorización/CSRF, inicio confirmado/cancelado, duplicación/ámbito invalidado, respuesta inválida, cierre sin edición, protección de cambios y relectura autoritativa. Conserva las 231 anteriores, incluida consulta AU, bloqueo RA y protecciones globales.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas, con rutas/métodos/cuerpos del contrato, sesión/CSRF, límites, conflictos, CSP y entrega de todos los archivos del manifiesto.
- `docker build -t mspi-front-hu018-review .`: correcto, imagen `sha256:544e130897ac7e3d6fd48db961592b23800ceba50c34ff3d90d37c30ea0b7c46`. Sin despliegue ni reinicio de servicios.

Pruebas con DOM/fetch simulados y upstream HTTPS local. No acreditan selector/interacción en navegador real, auditoría visual/accesibilidad ni integración con backend/PostgreSQL desplegados. No se crearon ni editaron riesgos empresariales.

Fuera de alcance: valoraciones inherentes/residuales, vinculación de controles, aprobación de aceptación, transiciones posteriores/cierre y creación de riesgo relacionado desde uno cerrado; implementación de controles y acciones. Sus reglas quedan para sus historias.

Entrega mediante commit, push y PR hacia `Develop`, sin fusión ni auto-merge. Revisión y fusión manuales por el responsable.
