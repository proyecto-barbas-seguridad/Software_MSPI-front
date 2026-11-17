# HU-FRONT-023 · Nuevo riesgo relacionado con uno cerrado

## Historia y alcance

Como AE o GS de la empresa activa, quiero registrar un evento posterior al cierre como un riesgo nuevo relacionado, conservando el original y su historial.

Parte de `Develop` en `f89c8a6` (PR #23 fusionado). Completa el flujo posterior al cierre pendiente en HU022, sobre OpenAPI 1.24.0. No modifica backend, contrato, infraestructura ni documentos aprobados 01–09. Los datos ilustrativos se limitan a fixtures.

## Criterios implementados

- **Crear riesgo relacionado** aparece en la ficha cerrada para AE/GS, incluidos roles combinados por empresa. AU mantiene lectura; RA solo no consulta riesgos y AP no obtiene permisos empresariales por ser administrador de plataforma. Un riesgo no cerrado no ofrece esta operación y el formulario tampoco envía contra ese estado.
- Formulario como página, reutilizando los campos y selectores de creación existentes. Identifica el código/revisión del original y explica que su cierre e historial permanecen conservados.
- Código, activo principal, responsable de negocio, amenaza, vulnerabilidad y descripción se introducen expresamente. Comienza vacío, incluido el tratamiento pendiente, para no reutilizar referencias que pudieran estar archivadas ni proponer una reclasificación o decisión implícita. No precarga los datos del riesgo cerrado.
- Selecciona activos y responsables empresariales activos mediante sus GET paginados existentes, con búsqueda de activo y selección conservada al paginar. El servidor comprueba disponibilidad y empresa al escribir. No usa membresías como sustituto de responsables de negocio.
- POST al origen y empresa capturados con **solo codigo y detalle**, tal como exige CreateRisk. Este contrato de creación no recibe revisionEsperada, motivo ni estado; no se inventan campos. El backend exige origen cerrado y permiso EDIT_RISKS antes de registrar.
- La respuesta debe tener identificador nuevo distinto del original, relación exacta con este, código y detalle enviados, estado IDENTIFICADO, revisión cero, valoraciones/nivel pendientes y ausencia de cierre o revisión requerida. Una respuesta incoherente se trata como resultado incierto.
- Al confirmar la creación navega a la nueva ficha y realiza su GET autorizado. El enlace de riesgo relacionado ya existente permite consultar el origen. No cambia el estado del original ni copia sus valoraciones, controles, aceptaciones o acciones; el nuevo riesgo sigue su propio ciclo.
- API tipada con sesión del mismo origen y CSRF fresco, sin JWT o almacenamiento persistente del borrador. Previene envíos simultáneos y descarta respuestas tardías tras desmontaje o invalidación del ámbito. Abortar no garantiza deshacer una escritura remota.
- Mantiene protección de cambios al cancelar/navegar/cambiar empresa y autorización del espacio empresarial. 400 y errores por campo conservan texto. Código duplicado, activo/responsable no disponible y CSRF_INVALIDO permiten corregir y reintentar expresamente. 401/403 de autorización retiran contexto.
- 404/409 de estado u otros conflictos bloquean otra escritura hasta consultar. Red/timeout/5xx y metadatos inválidos son inciertos: puede haberse creado. No reintenta automáticamente.
- Ante incertidumbre permite descartar con confirmación y consultar el listado por el código introducido, también al venir de una ficha. Encontrar ese código no acredita que esta solicitud lo haya creado: debe revisarse su procedencia. No navega automáticamente a un resultado coincidente ni lo presenta como éxito.

## Reglas y contratos contrastados

- Documentos 01 (conservar cierres), 02 PER-23/PER-24, 03 CU-21, 05 DD-17 y 06 ciclo de riesgos: un evento posterior al cierre crea riesgo relacionado; original y acciones quedan congelados.
- POST `/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/riesgos-relacionados`, entrada CreateRisk, salida Risk.
- `ApiInherentRiskController.createRelated`, `JpaInherentRisks.createRelated/register`, `RiskRecord` y validadores de creación. El backend conserva la relación de origen, genera UUID/estado inicial y valida activo/responsable/código.
- Se reutilizan GET de activos/responsables y ficha/listado de riesgos, sin filtros de relación o endpoints nuevos.

## Decisiones nuevas para revisión

Propuestas de implementación; el documento aprobado 09 permanece intacto:

1. Formulario vacío con aviso del origen, en vez de copiar automáticamente datos de un evento cerrado. El nuevo evento se describe y asigna expresamente.
2. Navegación a la nueva ficha tras respuesta validada, conservando el enlace existente al origen.
3. Consulta por código tras descarte confirmado de un resultado incierto; exige revisar el resultado antes de crear otra vez.

Mantiene tema Material UI, etiquetas/foco al título, distribución adaptable, textos ajustables y controles de al menos 44 px, sin dependencias nuevas. Revisar manualmente creación desde cerrado, selección de referencias vigentes, cancelación con cambios, duplicado/incertidumbre y vínculo al origen. Pendiente inspección móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: contrato 1.24.0, 93 rutas / 121 operaciones; sin regeneración.
- `npm run build`: TypeScript estricto y compilación Vite correctos, formulario bajo demanda y sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **413 pruebas correctas**, incluidas 31 nuevas. Cubren formulario vacío, creación y vínculo, origen inmutable, estados/permisos, validación y referencias no disponibles, errores por campo, CSRF, conflictos/incertidumbre, metadatos, protección de cambios, duplicación/ámbito invalidado, navegación/relectura y consulta por código. Conserva las 382 anteriores.
- `npm run test:gateway`: 17 pruebas HTTPS correctas.
- `docker build -t mspi-front-hu023-review .`: no pudo conectar con el daemon de Docker Desktop (pipe dockerDesktopLinuxEngine inexistente). Sin arranque ni reinicio de servicios; construcción de imagen a comprobar en CI.

DOM/fetch simulados y upstream HTTPS local. No acredita integración con backend/PostgreSQL reales ni recorrido manual en navegador. Backend, datos empresariales y documentos aprobados intactos. Gestión de implementaciones/archivos y gestión de acciones siguen fuera de esta HU.
