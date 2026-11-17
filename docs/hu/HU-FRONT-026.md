# HU-FRONT-026 · Consulta de acciones y Mis acciones para RA

## Historia y alcance

Como miembro de una empresa, quiero consultar las acciones a las que tengo acceso, su contexto, avances y archivos. Como RA solo, quiero ver mis tareas actualmente asignadas sin acceder a expedientes empresariales completos.

Parte de `Develop` en `d387445` (PR #26 fusionado). Inicia el módulo de acciones sobre OpenAPI 1.24.0. Backend, contrato, infraestructura y documentos aprobados 01–09 intactos. Datos ilustrativos únicamente en fixtures; sin cambios de datos empresariales reales.

## Criterios implementados

- Nuevo acceso **Acciones** para AE/GS/AU y **Mis acciones** para RA solo. Listado `#/empresas/{empresaId}/acciones` y ficha `…/acciones/{accionId}`. La empresa y sus roles se verifican antes de leer; el rol AP no concede acceso empresarial automático.
- Permisos combinados por empresa: AE/GS/AU con RA conserva el alcance general autorizado. No filtra toda la empresa como si fuera solo RA ni inventa un filtro de responsable. El backend decide entre READ_ACTIONS y READ_ASSIGNED_ACTIONS según los permisos efectivos y la asignación actual.
- RA dispone de acceso desde su entrada empresarial y navegación, sin enlaces al panel general, activos, riesgos, evaluaciones o controles. La nueva excepción de lectura se limita a la sección de acciones; los demás módulos siguen denegados antes de solicitar datos.
- Lista paginada de cinco acciones con código, descripción, estado, plazo y vencimiento devuelto por el servidor. No calcula vencimiento con el reloj local ni inventa filtros por estado/nombre/asignación que el contrato no ofrece. Página vacía no es cero cumplimiento. Conserva página dentro de una empresa y la retira al cambiar empresa, salir o vencer sesión.
- El código de acción del panel general enlaza a la ficha nueva sin cambiar los agregados ni sus filtros.
- Ficha con descripción, resultado esperado, plazo, estado, vencimiento, nombre de activo del contexto, resumen preparado por AE/GS y requisitos de evidencia. Separa adjunto requerido sí/no de pendiente; si no se requiere muestra la justificación registrada. Una acción completada no implica reducción automática del riesgo.
- RA recibe la presentación de contexto mínimo: no muestra los identificadores de origen como accesos a expedientes, referencias de responsable/creador, motivo de edición o metadatos administrativos de la ficha. No solicita fichas de riesgo, activo, evaluación, hallazgo o membresía para completar la pantalla. El DTO de backend contiene más campos, pero la vista no los muestra ni los usa para ampliar acceso.
- AE/GS/AU mantienen consulta empresarial: enlace al riesgo de origen, referencia de hallazgo y metadatos de acción. No inventa una ruta de evaluación/hallazgo que no se pueda construir con el contrato. Un identificador sin nombre no se presenta como nombre resuelto.
- **Archivos de contexto seleccionados** procede solo de evidenciasContexto de la acción autorizada, con motivo de selección. No enumera archivos del riesgo/hallazgo ni usa sus rutas directas. La descarga usa la ruta de contexto de esa acción y el servidor revalida pertenencia, selección, asignación y archivo.
- El contrato de contexto solo da identificador/motivo, sin nombre o tamaño. La interfaz numera los archivos y descarga con nombre genérico de contexto y extensión del tipo recibido, sin inventar metadatos originales. Declara que el nombre original no figura en esa lista.
- **Historial de avances y revisión** se consulta al desplegarlo. Presenta tipos operativos INICIADA, AVANCE, SOLICITUD_REVISION, APROBADA y DEVUELTA, comentario, autor/fecha. No lo presenta como registro administrativo completo: el backend no entrega creación, ediciones o cancelación en este endpoint.
- El historial es un arreglo paginado sin total/hayMas. Permite siguiente cuando devuelve cinco eventos y explica que la siguiente página puede estar vacía; no inventa conteos ni certeza de más filas. Valida longitud, tipos, identificadores únicos y metadatos.
- **Evidencias de la acción** es otra sección bajo demanda, con su paginación, nombre, tamaño, descripción y última inspección registrada. No confunde adjuntos de ejecución con las evidencias de contexto seleccionadas.
- Descargas explícitas GET del mismo origen, sin previsualización ni URL privada. El backend vuelve a autorizar e inspeccionar cada descarga, aunque la metadata anterior diga limpia. El cliente comprueba tipo/tamaño del Blob, normaliza el nombre y revoca la URL temporal al terminar o desmontar. Un doble clic no duplica la misma descarga; respuesta tardía tras perder ámbito no crea archivo.
- Carga, error, vacío, reintento explícito y fallos parciales de historial/archivos separados de la ficha. 401/403 retiran el contexto mediante el espacio autenticado, incluyendo reasignación de una acción de RA. 404 presenta recurso no disponible sin intentar otros orígenes. Soporte/Retry-After se muestran cuando el servidor los facilita.
- Cancela/ignora consultas anteriores al cambiar ruta/empresa, revalidar o vencer sesión. Valida que la ficha coincida con el identificador solicitado. Sin persistencia de datos privados ni ampliación de permisos a partir de campos del DTO.
- Solo lectura: no crea, edita, cancela, entrega, carga evidencias ni aprueba/devuelve acciones. La independencia por identidad de la revisión se mantiene; no se incorpora ninguna excepción por roles combinados ni aprobación propia. Esas escrituras se desarrollarán en sus HUs.

## Contratos y reglas contrastados

- Documentos 01 APR-09, 02 PER-29/PER-35/PER-36 y condiciones 4.2–4.4, 03 CU-22/CU-23 y 05 DD-21/DD-22: acceso por asignación, contexto preparado y archivos elegidos expresamente; roles combinados y revisión independiente.
- GET `/api/v1/empresas/{empresaId}/acciones` y `…/{accionId}`.
- GET `…/{accionId}/historial`, `…/{accionId}/evidencias`, `…/{accionId}/evidencias/{evidenciaId}/archivo` y `…/{accionId}/evidencias-contexto/{evidenciaId}/archivo`.
- `ApiImprovementActionController`, `JpaImprovementActions.actions/get/readableMembership/readEvidence/requireContextEvidence/history/view`, `ApiEvidenceController` y los contratos generados.

El backend conserva la autoridad de asignación: el contexto empresarial no incluye una membresía propia utilizable para deducir asignación en el cliente. No se calcula esa condición comparando usuarioId con responsableMembresiaId, que son identificadores de entidades distintas. La pérdida de asignación se hace efectiva en la siguiente solicitud/revalidación autorizada.

## Decisiones nuevas para revisión

Propuestas de implementación; documento aprobado 09 intacto:

1. Una ruta de acciones con presentación **Mis acciones** para RA solo, manteniendo navegación empresarial general para los roles que la autorizan.
2. Resumen de tarea y archivos seleccionados visibles en ficha; historial y adjuntos de ejecución desplegables e independientes para reducir carga visual.
3. Nombre genérico por archivo de contexto y aviso de paginación sin total en historial, respetando los datos que realmente ofrece el contrato.

Mantiene Material UI, etiquetas, foco al título, disposición vertical adaptable, textos ajustables y controles de al menos 44 px. Sin dependencias nuevas. Revisión manual sugerida: RA solo frente a GS+RA/AU+RA, reasignación y permiso retirado, paginación, archivo de contexto frente a ejecución, inspección bloqueada, vínculo desde panel y retorno al listado. Pendiente inspección móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos, pantalla bajo demanda y sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **529 pruebas correctas**, incluidas 29 nuevas de lista/ficha, RA/contexto mínimo y roles combinados, paginación, validación, carga diferida/fallos parciales, reasignación/autorización, memoria por empresa, descargas/contexto, respuestas tardías y operaciones GET contratadas. Conserva las 500 anteriores. Actualiza expectativas del campo de capacidad de acciones en las pruebas de permisos existentes.
- `npm run test:gateway`: **17 pruebas HTTPS** correctas, incluidos archivos generados y descargas acotadas.
- `docker build -t mspi-front-hu026-review .`: daemon local de Docker Desktop no disponible (pipe dockerDesktopLinuxEngine inexistente). Sin iniciar/reiniciar servicios; construcción a comprobar en CI.

Pruebas DOM/fetch y upstream HTTPS simulados. No acreditan reasignación, antivirus o integración con backend/PostgreSQL reales ni recorrido manual en navegador. Sin despliegue ni modificaciones de datos empresariales. Gestión, avance, entrega, aprobación/devolución y carga de archivos de acciones quedan fuera de esta HU.
