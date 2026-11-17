# HU-FRONT-020 · Vincular implementaciones de control y consultar antecedentes

## Historia y alcance

Como AE o GS de la empresa activa, quiero vincular una implementación de control a un riesgo con efecto esperado y justificación. Como AE, GS o AU, quiero consultar su versión, aplicación y verificaciones sin confundir el catálogo, la implementación, la eficacia y la valoración del riesgo.

Parte de `Develop` en `d0b57be` (PR #20 fusionado). Prepara la consulta de controles vinculados necesaria para la futura valoración residual. Usa OpenAPI 1.24.0, sin modificar backend, contrato, infraestructura ni documentos aprobados 01–09. Los datos ilustrativos se limitan a fixtures de pruebas.

## Criterios implementados

- **Vincular control al riesgo** desde una ficha no cerrada, únicamente para AE/GS de la empresa. El backend permite planificar vínculos en cualquier estado no cerrado; no exige que la implementación ya esté implementada o verificada. AU conserva lectura; RA solo no accede al módulo y AP no obtiene permisos empresariales automáticamente.
- Formulario de página bajo demanda. Selección explícita de implementación existente de la empresa, efecto esperado (probabilidad, impacto o ambos) y justificación obligatorios. Sin preselecciones, porcentajes, creación de controles o referencias inventadas.
- Selector paginado de cinco en cinco según el contrato, sin búsqueda/filtros no admitidos por el endpoint. Muestra nombre, estado y resultado vigente; conserva nombre/selección al paginar. Carga, vacío, error y actualización explícitos. Un listado vacío por página no se interpreta como inexistencia global de controles.
- Consulta de la implementación seleccionada solo al desplegarla. Cada vínculo del historial de riesgo ofrece la misma consulta, también para AU. Cerrar secciones cancela sus lecturas; no descarga todas las implementaciones/versiones/verificaciones al abrir una ficha de riesgo.
- La ficha de implementación muestra nombre, estado, revisión y resultado vigente del servidor, con causa de falta de vigencia (vencimiento/evidencia bloqueada) cuando exista. No deduce vigencia con el reloj del navegador ni con la primera fila de un historial.
- Diferencia referencias de catálogo/versionado de la implementación concreta. Muestra descripción, alcance, trabajo, responsable de negocio, tipo/modo pendientes cuando faltan, cambio de versión, autor/fecha y aplicación registrada o pendiente.
- Historial de versiones bajo demanda, paginado independientemente. Identifica la actual por `versionActual.versionId`, no por posición. Conserva antecedentes y referencias de evidencia de aplicación; no presenta una versión histórica como actual.
- Verificaciones bajo demanda para cada versión, paginadas. Incluye resultado, prueba/fundamento, criterios cumplidos/evaluados (con cero explícito), próxima revisión, autor/fecha, revisión registrada al verificar y referencia de evidencia. Ausencia de verificaciones no equivale a resultado no efectivo.
- La revisión registrada en una verificación es histórica: no se compara como si fuera la revisión de una consulta actual de implementación. La referencia de última verificación de la ficha no convierte por sí sola un antecedente efectivo en evidencia vigente; el estado/causa de la implementación siguen separados.
- Vincular registra un efecto esperado, no una aplicación/verificación ni una reducción de riesgo. No selecciona verificaciones para una valoración residual. Se mantienen las categorías y los resultados del riesgo devueltos por el servidor, sin descuentos o eficacia calculados localmente.
- POST con revisión capturada del riesgo, implementación elegida, efecto y justificación; sesión del mismo origen y CSRF fresco. Valida vínculo devuelto, asociación a implementación, efecto/justificación y revisión incrementada. Tras guardar consulta otra vez la ficha y despliega los vínculos obtenidos mediante GET; no inserta registros optimistas.
- 400 conserva el formulario y muestra errores por campo. CSRF_INVALIDO permite nuevo intento explícito; 401/403 de lecturas o escritura retira el contexto. Implementación no disponible (409) permite seleccionar otra; vínculo duplicado, estado/revisión incompatibles y otros 404/409 bloquean otra escritura hasta consultar estado.
- 0/5xx y metadatos inválidos se consideran resultados inciertos: conserva contenido, bloquea reenvío y exige confirmar descarte antes de consultar ficha/vínculos. No reintenta ni atribuye automáticamente la creación de un vínculo existente a una solicitud incierta.
- Impide envíos simultáneos y descarta callbacks por desmontaje/ámbito invalidado, aunque el transporte ignore cancelación. Reutiliza protección de cambios al navegar/cambiar empresa/cerrar sesión/salir y revalidación de autorización. No usa JWT, almacenamiento persistente del formulario o reintentos automáticos. Abortar no acredita reversión de una escritura remota.
- Fallos parciales en versiones/verificaciones conservan la ficha autorizada y permiten actualización de la sección. Valida IDs/asociación a versión, estados/categorías, fechas de calendario, metadatos, conteos e información de aplicación; no muestra como válida una respuesta de otro objeto.

## Contratos y reglas contrastados

- GET `/api/v1/empresas/{empresaId}/implementaciones-control` y `…/implementaciones-control/{implementacionId}`.
- GET `…/implementaciones-control/{implementacionId}/versiones` y `…/versiones/{versionId}/verificaciones`, con paginación documentada.
- POST `/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/implementaciones-control`, con `revisionEsperada`, `implementacionId`, `efectoEsperado` y `justificacion`.

Se contrastaron `ApiControlImplementationController`, `JpaControlImplementations.list/get/versions/verifications`, `ControlImplementations`, `ApiInherentRiskController`, `JpaInherentRisks.link/editable`, `ApiErrors`, PER-23/PER-26 y permisos READ_CONTROLS/EDIT_CONTROLS. El backend autoriza empresa/objeto, unicidad del vínculo, estado no cerrado y revisión común del riesgo. Los catálogos y el estado de una implementación son objetos diferentes.

## Decisiones nuevas para revisión

Propuestas de implementación, sin modificar el diseño aprobado 09:

1. Incorporar vinculación y consulta de controles dentro de la ficha de riesgo, sin una nueva navegación global ni una pantalla de mantenimiento de controles todavía incompleta.
2. Selector sin valores iniciales, efecto esperado explícito y explicación de que el vínculo no acredita eficacia ni reduce una valoración. Las implementaciones propuestas siguen disponibles para planificación, como admite el backend.
3. Fichas/versiones/verificaciones desplegables con paginación independiente. Referencias técnicas y evidencias se conservan como identificadores; esta HU no implementa visor, descarga o carga de archivos de control ni promete su disponibilidad actual.
4. Regreso al historial de vínculos releído del servidor después de guardar/consultar un resultado incierto. Se conserva el comportamiento equivalente de la valoración inherente, generalizando la sección a desplegar al volver.

Controles etiquetados de mínimo 44 px, distribución vertical/botones adaptables y ajuste de texto largo; tema MUI y CSP sin estilos inline. Sin nuevas dependencias.

Revisión manual sugerida: vincular una implementación propuesta y otra implementada, paginar sin perder selección, consultar aplicación/versiones/verificaciones y sus faltantes, comprobar cero criterios, resultado sin verificar por vencimiento, vínculo duplicado y conflicto concurrente. Revisar AU, riesgo cerrado, pérdida de permiso, cancelación/cambio de empresa, móvil, teclado y lector de pantalla.

## Verificación y límites

- `npm run contracts:check`: contrato 1.24.0, 93 rutas/121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos. Formulario y consulta separados bajo demanda; sin archivos individuales de más de 500 kB. No acredita menor transferencia total ni rendimiento medido.
- `npm run test:ui`: **314 pruebas**, incluidas 28 nuevas. Cubren vínculo explícito/revisión/justificación, faltantes, implementación propuesta, paginación/selección, consulta bajo demanda, vigencia del servidor, versiones históricas, cero criterios, revisiones históricas, verificaciones vacías/paginadas, fallo parcial/reintento, metadatos/asociación/fechas inválidas, autorización, validación/implementación no disponible, CSRF, duplicado/conflictos/incertidumbre, callbacks tardíos/duplicación, AU, protección de cambios y relectura sin reducción optimista. Se amplía la comprobación existente de riesgo cerrado para verificar que tampoco ofrece vínculo. Conserva las 286 anteriores.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas, incluyendo rutas/métodos/cuerpos del contrato, límites, sesión/CSRF, conflictos, CSP y todos los archivos del manifiesto.
- `docker build -t mspi-front-hu020-review .`: correcto, imagen `sha256:de9861b0ed878b7ac8f0291d2e669337e5b78bc603ce1e737dc915b8546b3737`. Sin despliegue ni reinicio de servicios.

Pruebas con DOM/fetch simulados y upstream HTTPS local. No acreditan interacción/inspección visual en navegador real, auditoría de accesibilidad ni integración con backend/PostgreSQL/antimalware desplegados. No se crearon vínculos ni se escribieron datos empresariales en el backend.

Fuera de alcance: crear/cambiar/aplicar/verificar implementaciones, archivos de control, desvinculación o eliminación, valoración residual, aceptación y cierre/transiciones posteriores de riesgo, acciones y nuevas políticas metodológicas.

Entrega mediante commit, push y PR hacia `Develop`, sin fusión ni auto-merge. Revisión y fusión manuales por el responsable.
