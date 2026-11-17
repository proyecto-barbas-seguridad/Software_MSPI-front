# HU-FRONT-025 · Aplicación, evidencias y verificación de controles

## Historia y alcance

Como AE o GS de la empresa activa, quiero adjuntar evidencia a la versión actual, confirmar su aplicación y registrar verificaciones con prueba, criterios y fundamento, conservando el historial. Como AU quiero consultar y descargar los archivos autorizados de cada versión.

Parte de `Develop` en `3badc40` (PR #25 fusionado). Completa el flujo de controles iniciado en HU024 sobre OpenAPI 1.24.0. Backend, contrato, infraestructura y documentos aprobados 01–09 intactos. Los datos ilustrativos se limitan a fixtures; no se escriben datos empresariales reales.

## Criterios implementados

- AE/GS, incluidos roles combinados, pueden adjuntar a la versión vigente en EN_IMPLEMENTACION o IMPLEMENTADO. Propuesto no admite archivos. AU conserva lectura/descarga; RA solo no consulta este módulo y AP no obtiene acceso empresarial automático. No crea ni aprueba tareas.
- **Adjuntar evidencia de control** abre formulario de página con versión/revisión capturadas: un PDF, PNG o JPEG, hasta 10 MB (10 000 000 bytes), nombre válido sin rutas/caracteres de control y descripción opcional de hasta 1000. Reutiliza la validación de archivo existente mediante un módulo compartido; no confía en el MIME declarado por el navegador.
- Multipart tipado a la versión actual, con revisionEsperada y CSRF fresco; el navegador construye el boundary. Mantiene el tiempo de espera multipart existente de 45 segundos. El backend inspecciona, comprueba integridad, cuota, estado y permisos. Respuesta exige metadatos LIMPIA coherentes con nombre, tamaño, tipo, descripción y revisión incrementada.
- La carga no confirma aplicación/verificación ni selecciona automáticamente el adjunto. Tras cargar relee ficha y despliega evidencias de esa versión; la siguiente decisión captura la nueva revisión.
- Archivos rechazados por inspección/tamaño requieren reemplazo. Cuota agotada, cuota no configurada o inspección temporalmente no disponible conservan contenido y permiten intento explícito. Conflictos y resultados inciertos bloquean reenvío hasta consultar; coincidir nombre/tamaño no atribuye un adjunto a una solicitud incierta.
- **Confirmar aplicación** solo en EN_IMPLEMENTACION: selecciona un adjunto ya asociado a esa versión, fecha real no futura según el día de la empresa y confirmación breve. El backend revalida integridad/inspección y responsable. Devuelve IMPLEMENTADO, misma versión con aplicación registrada y SIN_VERIFICAR; aplicar no acredita efectividad.
- **Registrar verificación** solo en IMPLEMENTADO: prueba realizada, fundamento, criterios evaluados enteros positivos, cumplidos enteros entre cero y el total, próxima revisión posterior al día empresarial y adjunto seleccionado expresamente. Fechas/cantidades empiezan vacías; cero cumplidos se conserva como dato y no equivale a pendiente. No ofrece selector de resultado ni calcula descuentos de riesgo.
- El resultado procede del backend; la respuesta valida versión, revisión incrementada, prueba/fundamento, cantidades, fecha, evidencia, autor/fecha y resultado no pendiente. No publica estado optimista ni sustituye verificaciones anteriores.
- Consulta todas las páginas de verificaciones de la versión antes de ofrecer un adjunto para una verificación nueva. Los ya utilizados quedan deshabilitados conforme a la unicidad (version_id, evidencia_id). No excluye un archivo por haber servido de aplicación si nunca fue usado para verificar. Rechaza historial de revisión posterior a la ficha o paginación con verificaciones repetidas; el backend vuelve a comprobar concurrencia y unicidad al guardar.
- Selector de evidencias paginado, sin UUID arbitrarios ni selección del primer archivo. Conserva elección al paginar y muestra última inspección registrada, sin acreditarla como inspección actual. Un rechazo de evidencia exige otra selección. Si necesita subir un archivo, cancela esta decisión, adjunta y vuelve con revisión nueva.
- Cargar, aplicar y verificar son pasos separados. El cambio de implementación de HU024 mantiene sus propias condiciones y crea una versión nueva sin reutilizar aplicaciones ni verificaciones antiguas. No altera riesgos ni sus índices desde el cliente; el backend gestiona dependencias y vigencia.
- Evidencias consultables bajo demanda en versión actual e históricas, con paginación y descarga autorizada. Cada descarga revalida/inspecciona en backend. El cliente comprueba Blob/tipo/tamaño antes de descargar, normaliza el nombre y usa URL temporal revocada al terminar o abandonar la pantalla. No previsualiza archivos ni expone URL de almacenamiento privado.
- Tras aplicar/verificar relee la ficha y despliega evidencias/verificaciones correspondientes. Las consultas desde riesgos conservan lectura e incorporan consulta de archivos por versión; no introducen controles de escritura fuera del módulo autorizado.
- Todas las escrituras usan revisión capturada, sesión del mismo origen y CSRF, sin rebase silencioso o reintentos automáticos. Protege texto/archivo al navegar, cancelar, cambiar empresa o salir, bloquea envíos simultáneos y descarta respuestas tardías si el ámbito se invalidó. Borrador solo en memoria; abortar no garantiza revertir una escritura remota.
- 400 y errores por campo conservan entradas; CSRF_INVALIDO permite intento explícito. 401/403 de autorización retiran contexto. 404/409 de estado/revisión bloquean hasta consultar. Red/timeout/5xx y metadatos inválidos son inciertos salvo rechazos de carga conocidos: pueden haberse guardado. Reconsultar exige confirmar descarte.

## Contratos y reglas contrastados

- Documentos 02 PER-26/PER-34/PER-35, 03 CU-19, 05 DD-16/DD-18, 06 TR-CTL-03/TR-VER-01/02 y 08 DEC-06. Estado de trabajo, resultado de verificación y valoración de riesgo son dimensiones distintas.
- POST `…/implementaciones-control/{implementacionId}/confirmar-aplicacion`: revisionEsperada, fechaAplicacion, evidenciaId.
- POST `…/implementaciones-control/{implementacionId}/verificar`: revisionEsperada, prueba, fundamento, criteriosEvaluados, criteriosCumplidos, proximaRevision, evidenciaId.
- GET/POST `…/versiones/{versionId}/evidencias` y GET `…/evidencias/{evidenciaId}/archivo`, sin inventar filtros o endpoints.
- `ApiControlImplementationController`, `ApiControlEvidenceController`, `JpaControlImplementations.apply/verify/inspect/attachEvidence/views`, `ControlVerification`, `JpaResponseEvidence.verifiedHash/download`, `ApiErrors`, integridad/estados y unicidad de evidencia de V9.

No se modifica ni presenta como aprobada una política documental pendiente. Se siguen los contratos implementados de prueba/criterios, fechas, integridad e inspección; no se extiende esta política a otros módulos.

## Decisiones nuevas para revisión

Propuestas de implementación; documento aprobado 09 intacto:

1. Páginas separadas para adjuntar, aplicar y verificar, con versión/revisión visibles; ningún paso selecciona o confirma el siguiente automáticamente.
2. Selector de archivos de la versión con elección conservada y antecedentes paginados para descartar adjuntos ya verificados. Fecha/cantidades vacías; cero se introduce expresamente.
3. Archivos por versión en secciones desplegables, también históricas. La ficha releída despliega el antecedente correspondiente después de escribir.

Mantiene Material UI, etiquetas, foco al título, distribución vertical adaptable y controles de al menos 44 px. Sin dependencias nuevas. Fecha empresarial y validación de nombres/tamaño se extraen a utilidades compartidas, conservando exportaciones y comportamiento de HUs anteriores.

Revisión manual sugerida: adjuntar y comprobar revisión; aplicar con fecha/evidencia; verificar con cero, parcial y todos los criterios; intentar reutilizar un adjunto; revisar histórica tras cambiar versión; rechazo/permiso retirado/incertidumbre y salida con cambios. Pendiente inspección móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones; sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos; formularios/listado de evidencias bajo demanda, sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **500 pruebas correctas**, incluidas 48 nuevas de aplicación, verificación, carga/descarga, estados/permisos, fechas, cero/pendientes, evidencias anteriores, preparación/paginación, cuotas/inspección, conflictos/CSRF, metadatos, duplicación/ámbito invalidado, guardas y relectura. Conserva las 452 anteriores, incluidas las de archivos de evaluación y fecha empresarial de riesgos.
- `npm run test:gateway`: **17 pruebas HTTPS** correctas, incluidos multipart acotado, descarga, CSP y archivos del manifiesto.
- `docker build -t mspi-front-hu025-review .`: daemon local no disponible (pipe dockerDesktopLinuxEngine inexistente). Sin iniciar/reiniciar servicios; construcción de imagen a comprobar en CI.

Pruebas DOM/fetch y upstream HTTPS simulados. No acreditan integración con backend/PostgreSQL, inspección antivirus real, cuota empresarial real o recorrido manual en navegador. Sin despliegue ni cambios de datos empresariales. La gestión de acciones y las vistas específicas RA siguen para sus historias.
