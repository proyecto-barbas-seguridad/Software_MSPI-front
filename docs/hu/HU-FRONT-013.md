# HU-FRONT-013 · Consulta de evaluaciones, respuestas y evidencias en React

Fecha: 16 de noviembre de 2026.
Rama: `feat/HU-FRONT-013-consulta-evaluaciones`.
Base: `Develop`, `9e04f48`, fusión de HU012 mediante PR #13.

Como integrante con permiso de consulta, quiero abrir las evaluaciones de mi empresa y revisar sus respuestas, resultados y evidencias privadas dentro del espacio React.

## Fuentes y alcance

Migración de las consultas de HU-FRONT-002/003 y resultados de HU-FRONT-004 a React. Contrato OpenAPI 1.24.0 versionado, HU-017/025 del backend, `ApiEvaluationController`, `ApiEvidenceController` y errores de inspección de `ApiErrors`. Se respetan documentos centrales 02, 04, 05 y 06 y dirección Panorama de 09. Los documentos aprobados, backend, contrato y dependencias no cambian.

Esta HU es de lectura. No crea evaluaciones, edita respuestas, registra hallazgos, envía/cierra/devuelve evaluaciones, confirma herencias ni carga evidencias. Esas operaciones siguen pendientes de sus historias. No ofrece operaciones de aprobación de tareas ni modifica sus restricciones personales.

## Criterios implementados

- Ruta React de listado `#/empresas/{empresaId}/evaluaciones` y ficha `#/empresas/{empresaId}/evaluaciones/{evaluacionId}`. Navegación lateral con estado activo, enlace empresarial y enlaces desde el detalle del panel; la evaluación anterior, cuando existe, abre su propia ficha. Se mantienen las rutas originales sin redirigir ni retirar consultas previas.
- Sesión y empresa se revalidan al entrar/recargar. AE, GS y AU consultan; RA solo es rechazado antes de solicitar datos del módulo, incluso por URL directa. AP no se deduce de la identidad. Las restricciones de cada objeto siguen en el servidor.
- Lista de cinco registros por página, con nombre, fecha, estado y revisión. Usa `hayMas`; no fabrica un total a partir de las filas. La API no ofrece filtros de estado para ese listado y la interfaz no simula un filtro global sobre una página parcial.
- Ficha como página con alcance, estado, fecha, revisión, actualización/cierre en la zona de la empresa y referencias de catálogo/metodología/responsable por sus identificadores. No se inventan nombres históricos. La sección de referencias es plegable.
- Resultados por el endpoint del backend, reutilizando la presentación de controles, dominios y cláusulas del panel con rótulo propio de evaluación. Puntaje cero se conserva, null mantiene ausencia/estado y provisional no se presenta como definitivo. No se calculan promedios por página ni un global PHVA.
- Las respuestas usan páginas de cinco registros y filtros de tipo CONTROL/CLAUSULA y código exacto de grupo (hasta 80 caracteres), aplicados en el backend. Aplicar/limpiar reinicia página. Los resultados globales pertenecen a toda la evaluación y no se alteran al filtrar respuestas.
- Página del listado y filtros/página de la evaluación actual se conservan solo en memoria al navegar y revalidar por foco. Cambiar empresa, ir al selector, expirar o salir los limpia. Abrir otra evaluación no reutiliza sus filtros. Sin consultas ni datos empresariales guardados en almacenamiento web o URL.
- Cada respuesta muestra tipo, código, grupo, título, aplicabilidad, nota/ausencia, justificación, fundamento y revisión. Cero es una nota registrada; pendiente no se transforma en cero; no aplica conserva su exclusión y fundamento opcional no registrado. Las respuestas heredadas indican si falta confirmación en esta evaluación sin ofrecer aún esa escritura.
- Ficha, respuestas y resultados se consultan por separado y pueden observar revisiones distintas. Se muestran sus números y se avisa cuando difieren; no se afirma que todos los endpoints constituyan un corte atómico. Actualizar vuelve a consultarlos. Un fallo auxiliar no autorizado 401/403 retira todo el alcance; otros fallos parciales se presentan sin inventar respuestas vacías o puntajes cero.
- Evidencias por respuesta únicamente al desplegar su sección. Metadatos, descripción, tipo, tamaño, fecha y último estado de inspección; página independiente de cinco registros. Cerrar sección, cambiar filtros/página o desmontar aborta lecturas y descargas pendientes y elimina sus recursos temporales.
- Descargar es una acción explícita con la ruta completa empresa/evaluación/respuesta/evidencia. Se usa el cliente tipado con cookie del mismo origen, respuesta como adjunto y MIME permitido, y se comprueba coherencia con los metadatos. Nunca se muestra el contenido como HTML ni se navega directamente hacia un error JSON de descarga.
- Para guardar el archivo se crea una URL Blob temporal con nombre saneado/extensión acorde al MIME; se libera tras iniciar o al desmontar, junto con temporizadores. Se bloquea la descarga duplicada y las respuestas tardías no inician un archivo si ya se invalidó el alcance empresarial, incluso antes de la limpieza visual del panel. Un archivo cuya descarga ya se inició no se puede retirar desde la interfaz.
- El estado de inspección mostrado es histórico. El backend vuelve a autorizar, comprobar integridad e inspeccionar en cada descarga. EVIDENCIA_BLOQUEADA (422) conserva la evaluación e informa que el archivo no se descargó; indisponibilidad de inspección/almacenamiento se distingue de revocación y muestra correlación/Retry-After cuando existe. 401/403 de autorización retira contenido. No se reintenta automáticamente.
- Validación de transporte: UUID/ID de ficha, fechas de calendario válidas, revisiones, tipos, calificaciones discretas, aplicabilidad, catálogo coincidente, estructura/páginas y metadatos de evidencia. La respuesta no incluye empresa/evaluación en cada fila: la pertenencia definitiva de filas y archivos la garantiza la API de la ruta autorizada, no se presume una comprobación inexistente del cliente.
- Cancelación/generación por petición y señal del alcance empresarial; se retiran datos anteriores al cargar y se ignoran respuestas tardías. Se conserva la retirada por sesión vencida y protección de formularios de otros módulos al navegar hacia evaluaciones.
- Diseño adaptable, lectura en tarjetas, detalles/evidencias plegables, controles etiquetados de 44 px y foco en el encabezado tras cargar. El módulo se carga bajo demanda. No se amplían CSP ni permisos del gateway; solo se publican archivos declarados en el manifiesto y Emotion conserva nonce y no genera atributos de estilo inline en la vista comprobada.

## Decisiones para revisar

- Cinco registros en listados, respuestas y evidencias; referencias y adjuntos plegables para compactar móvil.
- Filtro de grupo por su código exacto de catálogo, con ejemplos visibles, además de control/cláusula. No se supone un catálogo fijo para todas las versiones.
- Mantener secciones disponibles si falla una consulta auxiliar, con aviso de revisión diferente cuando corresponde.
- Descargar mediante Blob temporal para tratar los fallos dentro de la interfaz y evitar abrir el archivo automáticamente.

Son decisiones propuestas para revisión en el PR; no se registran como aprobación nueva en `09-diseno-de-pantallas.md`. Los datos ilustrativos están en fixtures de pruebas, no en la aplicación.

## Verificación y límites

```powershell
npm run contracts:check
npm run build
npm run test:ui
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm run test:gateway
docker build -t mspi-front-hu013-review .
```

- 124 pruebas UI/estado/cliente: 21 nuevas del módulo y 103 anteriores. Cubren listado/detalle/paginación/filtros, cero/pendiente/no aplica/provisional, cláusulas y herencia, revisiones diferentes, fallos parciales, 401/403, IDs/catálogos/fechas inválidos, cancelación, evidencias bajo demanda/paginadas, descarga explícita/privada, cierre/alcance invalidado, inspección bloqueada/indisponible, API tipada, CSP, URLs directas, AU lector y RA denegado.
- 17 pruebas de reglas/gateway HTTPS conservan rutas, origen, TLS, cookie/CSRF y entrega de todos los archivos declarados en el manifiesto, incluido el módulo bajo demanda.
- TypeScript estricto, contrato y build Vite verificados. También se ejecutó el arranque de los módulos compilados en jsdom con sesión simulada sin autenticar, comprobando el formulario de acceso; no es una prueba de navegador real.
- Vite separa ahora el módulo y archivos comunes: entrada de aproximadamente 388 kB, común de 185 kB y módulo de evaluaciones de 14 kB minificados. No hay advertencia de archivo individual mayor de 500 kB; esa distribución no acredita una reducción del total transferido ni una medida de rendimiento real.

Las pruebas usan DOM/fetch simulados, un Blob de prueba y upstream HTTPS local. No acreditan inspección visual, descarga/guardado nativos en navegador real ni integración contra backend/PostgreSQL/antimalware desplegados. Se construye una imagen Docker para revisión sin desplegar servicios ni modificar datos empresariales.

Entrega con commit, push y PR hacia `Develop`, sin fusión ni auto-merge. El responsable revisa/fusiona manualmente; CI se consulta en el PR.
