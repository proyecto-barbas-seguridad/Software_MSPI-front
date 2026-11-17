# HU-FRONT-029 · Reporte básico empresarial e impresión

## Historia y alcance

Como AE, GS o AU de una empresa, quiero generar un reporte operativo con filtros y secciones seleccionadas y consultar una vista imprimible que conserve el corte, los filtros y las metodologías devueltos por el servidor.

Parte de `Develop` en `ff3496d` (PR #29 fusionado). Usa OpenAPI 1.24.0 sin regeneración ni dependencias nuevas. Backend, infraestructura y documentos aprobados 01–09 intactos. Datos ilustrativos únicamente en fixtures; no modifica datos empresariales ni implementa reportes administrativos de plataforma.

## Criterios implementados

- Navegación **Reportes**, ruta `#/empresas/{empresaId}/reportes`, carga de pantalla bajo demanda y empresa activa visible. AE/GS/AU pueden leer; roles combinados por empresa conservan acceso. RA solo no consulta reportes; AP no obtiene lectura empresarial automática. No admite una ficha ficticia bajo `/reportes/{id}`.
- Generación explícita mediante GET al reporte básico. Abrir la pantalla no consulta ni imprime un reporte automáticamente. Permite desde/hasta inclusivos, base inherente/residual y una o varias secciones: evaluaciones, riesgos y acciones. Exige al menos una y no duplica secciones.
- Filtros adicionales por estado de evaluación, estado/situación/nivel de riesgo, probabilidad, impacto, estado de acción y vencimiento. Distingue todas, solo vencidas y solo no vencidas; preserva `vencida=false`. Secciones se transmiten como parámetros repetidos según el contrato.
- Selector opcional de evaluación consultado solo al abrirlo, paginado de cinco, con elección conservada al cambiar de página. No sustituye la elección por la primera opción ni hace consultas independientes de resultados.
- Explica el alcance real: fechas de evaluación, creación del riesgo en zona empresarial y plazo de acción. Evaluación específica y estado de evaluación no filtran riesgos/acciones por relación; cada sección tiene filtros independientes.
- Valida empresa, fecha de generación, zona, filtros devueltos, secciones, conteos, estados, referencias y sumas antes de presentar un documento imprimible. Una respuesta parcial o incoherente no se transforma en ceros ni se habilita para imprimir. Exige payload nulo para secciones excluidas.
- Documento con empresa, identificador, fecha de generación en su zona horaria, filtros efectivos, secciones y referencias de metodología versionadas del backend. No mezcla el reporte con consultas de resultados de otro momento ni calcula calificaciones propias.
- Evaluaciones: total por estado y metodologías asociadas. El backend solo devuelve la fila de avance cuando se selecciona una evaluación específica; sin esa selección no se simula un listado. La fila muestra controles/cláusulas evaluados y aplicables, sin decidir, sin calificación y heredadas pendientes. Evaluaciones abiertas se señalan como provisionales.
- Cero aplicables no permite inferir «No aplica» ni calificación cero; se explica expresamente. Los agregados carecen de calificaciones de cumplimiento, por lo que no se calculan porcentajes o resultados inexistentes.
- Riesgos: total por estado, situación de valoración, nivel vigente y distribución tabular por probabilidad/impacto/nivel. Pendiente y revisión requerida permanecen separados de vigente; matriz y niveles solo representan vigentes. Las referencias metodológicas asociadas tampoco acreditan vigencia por sí mismas.
- Acciones: total por estado y vencidas, sin equiparar cancelada con completada ni deducir reducción de riesgo. Los agregados de riesgos y acciones no incluyen listados completos en este endpoint; no se añaden consultas separadas que mezclen cortes.
- Conteo agrupado sin una categoría equivale a cero según las proyecciones agrupadas del backend. Sección excluida significa excluida, no cero. Respuesta no disponible o inválida significa error, no ausencia de registros.
- **Imprimir o guardar como PDF** invoca el diálogo del navegador sobre un documento separado de navegación y filtros, mediante portal y estilos de impresión con el nonce existente. Incluye todos los filtros y metadatos. El usuario elige impresora o destino PDF; no se genera ni descarga automáticamente un archivo PDF.
- Impresión habilitada solo con reporte validado y filtros aplicados. Cambiar filtros conserva la vista anterior con aviso y bloquea imprimir hasta regenerar. Formulario inválido, carga, error o ámbito invalidado tampoco imprimen. El portal se retira al salir; impresión nativa sin documento listo muestra aviso, sin el reporte anterior.
- Al recuperar foco revalida identidad, empresa y roles sin sustituir el corte por otro ni desmontar el formulario. Un fallo de transporte informa que se conserva el corte; cada generación vuelve a autorizarse en el servidor. Cambios de identidad/roles/membresía y 401/403 retiran el ámbito.
- Reintento explícito tras error, sin repetición automática. Incluye referencia de soporte/espera del servidor cuando existen, bloqueo de generación simultánea, abortado al salir e ignorar respuestas tardías. Los filtros y el documento permanecen solo en memoria durante esta pantalla; cambiar de empresa o salir los descarta.

## Contratos y reglas contrastados

- Documentos 02 PER-37, 03 CU-27 y diseño de reportes de 09, con empresa, corte, filtros y metodologías; permisos de lectura empresarial AE/GS/AU y separación de AP.
- GET `/api/v1/empresas/{empresaId}/reportes/basico`, operación `generarReporteBasicoEmpresa`, DTO `CompanyBasicReport` y filtros del contrato generado.
- Backend `DefaultCompanyPanel`, `CompanyReport`, `ApiCompanyPanelController`, permiso `READ_PANEL` y proyecciones empresariales de evaluaciones, riesgos y acciones. El reporte emplea una transacción empresarial y un corte de generación; sus listas son intencionalmente acotadas a cero salvo la evaluación específica.
- GET paginado de evaluaciones únicamente para preparar la selección, separado de los datos del documento.

No incorpora certificación, reporte administrativo, exportación XLSX, calificaciones ausentes, listados completos ni una política documental pendiente como si estuviera aprobada.

## Decisiones nuevas para revisión

Propuestas de implementación; documentos aprobados conservados:

1. Generar por acción explícita, con secciones seleccionables y filtros secundarios plegables; evaluación específica opcional mediante selector paginado.
2. Documento único que utiliza exclusivamente la respuesta del reporte básico, con límites visibles del alcance agregado y sin añadir calificaciones de otras consultas.
3. Impresión mediante el navegador, documento separado y bloqueo por cambios de filtros sin aplicar. La impresión conserva el corte durante la revalidación de acceso al recuperar foco.

Mantiene Material UI, controles etiquetados de al menos 44 px, foco al título, columnas adaptables y tabla desplazable con encabezados semánticos. La matriz se presenta como distribución tabular legible, sin depender del color. Revisar filtros independientes, sección excluida frente a cero y «No aplica», empresa/zona/metodologías y papel/PDF. Pendiente recorrido manual móvil, teclado, lector de pantalla y paginación en navegador real; las pruebas DOM no certifican su presentación visual.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones, sin cambios generados.
- `npm run build`: TypeScript estricto y Vite correctos, módulo de reportes bajo demanda y sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **652 pruebas correctas**, incluidas 32 nuevas. Cubren generación explícita, permisos combinados/RA/AP, filtros y booleano false, secciones, selección paginada, provisional/pendientes/cero, matriz vigente, validación de respuesta, impresión bloqueada, reintento, pérdida de autorización, respuestas tardías, navegación y conservación del corte al revalidar acceso. Conserva las 620 anteriores.
- `npm run test:gateway`: **17 pruebas HTTPS** correctas, incluidas rutas y parámetros de contrato, manifiesto y protección del mismo origen.
- `docker build -t mspi-front-hu029-review .`: daemon local Docker Desktop no disponible (pipe dockerDesktopLinuxEngine inexistente). No se inicia/reinicia ningún servicio; construcción a comprobar en CI.

Pruebas DOM/fetch y upstream HTTPS simulados. El diálogo de impresión se simula; todavía debe comprobarse impresión, saltos de página y guardado PDF en navegador real, especialmente documentos extensos. No acredita integración real con backend/PostgreSQL ni datos de varias cuentas. Sin despliegue ni cambios empresariales reales.
