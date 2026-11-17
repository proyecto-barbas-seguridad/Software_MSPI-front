# HU-FRONT-017 · Consulta de riesgos en React

## Historia y alcance

Como AE, GS o AU de la empresa activa, quiero consultar riesgos, sus valoraciones y referencias de tratamiento para comprender su estado y antecedentes sin confundir un borrador, un dato histórico y una valoración vigente.

Parte de `Develop` en `d238a63` (PR #17 fusionado). Continúa la integración React sobre OpenAPI 1.24.0 existente. No modifica backend, contrato, documentos aprobados 01–09 ni infraestructura. Los datos ilustrativos se limitan a fixtures de pruebas.

## Criterios implementados

- **Consultar riesgos** en navegación, con estado activo y menú móvil existente. Listado `#/empresas/{empresaId}/riesgos` y ficha `#/empresas/{empresaId}/riesgos/{riesgoId}`. Los códigos del detalle de riesgos del panel enlazan ahora a la ficha React, sin cambiar cifras/filtros del panel ni afirmar vigencia por ser un enlace.
- Listado de cinco en cinco con `hayMas`, filtros de código (máximo 80) y estado enviados al backend. Aplicar/limpiar vuelve a la primera página. No busca en descripciones ni filtra solo registros ya descargados. Conserva filtros y página al volver de una ficha en la misma empresa; se limpian al cambiar de empresa, expirar o cerrar sesión.
- Ficha completa en página: descripción, amenaza, vulnerabilidad, activo principal mediante enlace autorizado, identificador de responsable, tratamiento propuesto, nivel inherente registrado, referencia de inherente vigente, revisión, fecha y riesgo relacionado cuando exista. Se avisa de revisión requerida y se aclara que proponer aceptar no acredita aceptación aprobada.
- Valoraciones inherentes/residuales, implementaciones de control vinculadas y aceptaciones se consultan **bajo demanda**, cada sección con carga, vacío, error, actualización explícita y paginación independiente. No se interpreta una página como historial completo ni la primera fila como la vigente.
- Las valoraciones muestran categorías, índices del servidor, nivel, fundamento, periodo, supuestos, fuente, creación, confirmación y motivo. Un null permanece pendiente; cero numérico se muestra como cero. Borrador se identifica como resultado provisional, separado de confirmada e histórica. No calcula el nivel, combina porcentajes ni aplica descuentos por controlar un riesgo.
- Inherente vigente se identifica por la referencia de la ficha y su indicador de revisión; residual mediante `vigente`/`requiereRevision` del backend. Conserva niveles registrados de antecedentes sin presentarlos como vigencia acreditada. Una revisión distinta entre ficha y subconsulta genera aviso antes de compararlas como un mismo corte.
- Residual distingue sin mitigación sí/no/pendiente y justificación no aplicable cuando corresponde. Muestra avisos activos y resueltos con fechas, referencias, base inherente, verificaciones, pruebas y vencimiento registrados. No inventa vigencia ni resuelve avisos por fecha local.
- Referencias de valoraciones desplegables: identificadores/versiones, antecedentes, autores, contexto base inherente y pruebas residuales conservadas. Los vínculos de control muestran implementación, efecto esperado y justificación; no se ofrecen rutas de un módulo aún no integrado ni se equipara vínculo con aplicación/verificación.
- Aceptaciones muestran estado vigente/revisión pendiente/histórica, justificación, próxima revisión, aprobación y referencias a las valoraciones. La aceptación y el estado del riesgo permanecen separados. No permite aprobar aceptación ni realizar otras escrituras en esta historia.
- Si existe cierre, conserva justificación, autor/fecha, identificadores de inherente/residual/aceptación y motivos de cancelación de acciones. No inventa resultados históricos que el contrato de cierre no devuelve. El riesgo relacionado enlaza a su ficha autorizada.
- Respeta PER-23: consulta para AE/GS/AU y combinación de roles dentro de la empresa. RA solo se rechaza antes de solicitar el módulo; AP no obtiene acceso empresarial automáticamente. Todas las llamadas son GET con sesión del mismo origen, sin JWT ni caché persistente. Lecturas parciales de aceptación no crean permisos para aprobarla.
- 401/403 de cualquier sección retira el contexto mediante el espacio autenticado; 404 no revela recursos de otra empresa. Otros errores parciales mantienen la ficha y permiten reintentar esa sección, sin reintentos automáticos. Presenta referencia de soporte/Retry-After disponibles.
- Al cambiar consulta, cerrar sección, desmontar, invalidar ámbito o cambiar empresa se abortan/ignoran solicitudes anteriores, aunque el transporte entregue un resultado tardío. No se restauran datos de otra ruta. La revalidación general por foco y protección de cambios de otros módulos se conservan.

## Contratos y reglas contrastados

GET de `/api/v1/empresas/{empresaId}/riesgos` y `…/riesgos/{riesgoId}`; GET paginados de `…/valoraciones-inherentes`, `…/valoraciones-residuales`, `…/implementaciones-control` y `…/aceptaciones`.

Se contrastaron OpenAPI, `ApiInherentRiskController`, `ApiResidualRiskController`, `InherentRisks`, `ResidualRisks`, `JpaInherentRisks`, `InherentAssessment.view` y dependencias residuales. Las subconsultas devuelven `revisionRiesgo` del corte de lectura; su diferencia con la ficha no se interpreta como nueva versión histórica. Los vínculos no llevan riesgoId en el cuerpo: la asociación se autoriza en la ruta del servidor. No se inventa un GET individual de valoración ni un campo de residual vigente ausente en la ficha.

## Decisiones nuevas para revisión

Son propuestas de implementación; el documento de diseño 09 conserva su estado aprobado:

1. Listado compacto de cinco registros, filtros nativos etiquetados y ficha como página. Secciones históricas desplegables evitan descargar todo al abrir; abrir/cerrar una sección no implica datos empresariales persistentes.
2. Mantener los identificadores de referencias sin consultar catálogos/membresías completos para resolver nombres. El activo y el riesgo relacionado enlazan a pantallas disponibles; otras referencias quedan visibles para trazabilidad.
3. Separar nivel registrado, resultado provisional, vigencia, revisión requerida y aceptación. Índices nulos no se convierten a cero; los efectos de control no se presentan como reducciones numéricas.
4. Reutilizar el tema MUI, menú móvil, controles mínimos de 44 px, presentación vertical/adaptable y ajuste de textos largos, sin nuevos diálogos, dependencias o estilos inline.

Revisión manual sugerida: filtrar/paginar, abrir desde panel y volver al listado, comparar valoración vigente e histórica, revisar residual con aviso vencido/resuelto y sin mitigación, consultar aceptación/cierre y probar cambio de empresa, pérdida de permiso, teclado y distribución móvil.

## Verificación y límites

- `npm run contracts:check`: contrato 1.24.0, 93 rutas y 121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos. Pantalla de riesgos bajo demanda; sin advertencias de archivo individual mayor de 500 kB. La distribución de archivos no acredita una reducción de transferencia total ni una medida de rendimiento real.
- `npm run test:ui`: **231 pruebas**, incluidas 23 nuevas. Cubren filtros/paginación/vacíos, referencias y vigencia, pendiente/cero/borrador, avisos residuales, vínculo sin descuento ficticio, aceptación histórica, paginación independiente, fallo parcial/reintento, autorización, UUID no válido, asociación incorrecta, callbacks tardíos, cambio de filtro, cierre, validaciones anidadas/calendario, API tipada, AU y RA en ruta real y conservación/limpieza de filtros. Se actualiza una expectativa del panel para verificar el nuevo enlace a ficha, manteniendo su comprobación de revisión requerida frente a pendiente. Conserva las 208 pruebas anteriores.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas; rutas/métodos del contrato, límites, sesión/CSRF de módulos existentes, CSP y entrega de todos los archivos declarados en el manifiesto.
- `docker build -t mspi-front-hu017-review .`: correcto, imagen `sha256:5aafcb0f20deaff147e9b5658d77cfef903bb4c84024251f7651f98840e83bc5`. Sin despliegue ni reinicio de servicios.

Pruebas con DOM/fetch simulados y upstream HTTPS local. No acreditan interacción/inspección visual en navegador real, auditoría de accesibilidad ni integración con backend/PostgreSQL desplegados. No se escribieron datos empresariales.

Fuera de alcance: crear/editar riesgos, valorar/confirmar, vincular controles, aprobar aceptación y transicionar/cerrar riesgos; implementación de controles y acciones. Sus permisos y reglas de escritura quedan para sus historias.

Entrega mediante commit, push y PR hacia `Develop`, sin fusión ni auto-merge. Revisión y fusión manuales por el responsable.
