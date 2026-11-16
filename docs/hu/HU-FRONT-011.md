# HU-FRONT-011 · Crear, editar, archivar y restaurar activos

Fecha: 16 de noviembre de 2026.
Rama: `feat/HU-FRONT-011-gestion-activos`.
Base: `Develop`, `cf8b4d7`, fusión de HU010 mediante PR #11.

Como AE o GS, quiero mantener las fichas de activos de mi empresa con referencias válidas, trazabilidad y control de concurrencia para conservar un inventario consistente.

## Fuentes y alcance

Contrato OpenAPI 1.24.0 versionado, `ApiAssetInventoryController`, `JpaAssetInventory`, `CompanyPermission` y HU-014 del backend. Límites comprobados: código 80, nombre 250, ubicación y motivo 1000 caracteres; descripción obligatoria sin máximo específico en el DTO, sujeta al límite JSON del gateway. Código único normalizado y reservado incluso archivado, inmutable en edición. No se inventan reglas de bloqueo por riesgos abiertos que el endpoint no verifica.

Se conservan documentos aprobados 01–09, backend, contrato, gateway y dependencias. La clasificación C/I/D se sigue consultando; iniciar/editar/confirmar clasificaciones corresponde a una HU posterior. Esta entrega no implementa procesos/responsables nuevos: utiliza los catálogos empresariales ya disponibles en el backend.

## Criterios implementados

- Crear desde inventario y editar/archivar/restaurar desde la ficha React. Solo AE/GS, incluidas combinaciones AU+GS. AU solo carece de controles de escritura y RA continúa fuera del inventario. No se deduce AP ni se implementan aprobaciones propias o delegaciones de privilegios.
- POST alta con código/nombre/descripción/tipo y referencias; PUT edición con `revisionEsperada` de la ficha cargada, sin reenviar el código. Campos opcionales vacíos enviados nulos. El resultado validado conduce a una nueva lectura de la ficha, sin inventar un evento local de historial.
- Archivo con motivo y revisión; conservación explícita de código, referencias e historial. Restauración con motivo/revisión, comprobación de referencias originales por servidor o reemplazos explícitos en `referencias`. No se elimina físicamente ningún registro.
- Selectores de proceso, propietario y custodio con páginas de cinco referencias activas de la empresa. Se conservan ID/etiqueta seleccionados al paginar. Las relaciones existentes se mantienen como selección aunque no estén en la página activa; la edición puede conservar una relación históricamente archivada, conforme al backend. Una nueva asignación/restauración sigue sujeta a validación de referencia activa. Sin valores UUID fabricados ni selección automática de la primera fila.
- Formularios largos como contenido de página, con etiquetas, requeridos, límites del DTO, errores por campo y referencia de soporte. El código se muestra no modificable al editar. Un error de validación, código duplicado o referencia no disponible conserva el borrador para corrección; no se reenvía nada automáticamente.
- `REVISION_DESACTUALIZADA`, estado incompatible o activo archivado bloquean un nuevo envío. Se conserva el borrador hasta elegir explícitamente descartarlo y consultar la ficha actual por GET. Nunca se actualiza silenciosamente la revisión para sobrescribir cambios ajenos.
- Error de transporte/timeout o respuesta 5xx se trata como resultado incierto: puede haber escritura confirmada en el servidor aunque el cliente no recibiera respuesta. Se bloquea otro envío. Para un activo existente se consulta la ficha tras confirmar el descarte; para un alta se vuelve al inventario buscando el código para comprobar el resultado antes de crear otra vez. No hay garantía de cancelar una transacción remota al abortar la petición.
- CSRF nuevo por escritura mediante el cliente de HU007, cookie del mismo origen y sin reintentos de escritura. Un `CSRF_INVALIDO` preserva el formulario para reintento explícito; un 401 o 403 de autorización retira borrador/datos y delega al alcance empresarial. Retry-After se muestra si lo entrega el servidor, sin implementar un temporizador nuevo.
- Bloqueo de doble envío sin depender únicamente del botón deshabilitado. Se abortan peticiones y descartan resultados al desmontar. Campos deshabilitados durante la escritura; salir mientras se procesa advierte que no garantiza cancelar la operación en el servidor.
- Borrador únicamente en memoria, descartado al salir con confirmación, expirar o perder autorización. Navegación por enlaces, cambio de empresa, cancelación y cierre de sesión comprueban cambios pendientes. Al retroceder por fragmento y cancelar se repone la URL aceptada sin abandonar el formulario. Cerrar/recargar activa la advertencia nativa beforeunload cuando el navegador la permite.
- Revalidación por foco/pestaña con borrador: consulta sesión y contexto sin desmontar el formulario ni mover su foco. Si cambian identidad o roles, o se recibe 401/403, se retira el alcance sin preguntar por un borrador ya no autorizado. Si falla el transporte se conserva el formulario con aviso explícito; toda escritura posterior sigue autorizada por el backend. El vencimiento de sesión continúa retirándolo sin confirmación.
- Componente de formulario cargado bajo demanda mediante el manifiesto Vite. Controles nativos estilizados por Material UI/Emotion, sin atributos de estilo inline ni ampliación de CSP.

## Corrección de permisos del historial

HU010 solicitaba historial para todos los lectores. El contrato funcional HU-014 y `CompanyPermission.READ_ASSET_HISTORY(AE)` del backend lo reservan a AE. El 403 de esa solicitud auxiliar retiraba la ficha completa para GS/AU. Esta HU evita la solicitud y oculta la sección para cuentas sin AE; no ignora una denegación real ni amplía permisos. GS/AU conservan ficha/clasificaciones; AE puede consultar historial. Las pruebas de historial identifican explícitamente el rol AE.

## Decisiones para revisión

- Crear/editar/cambio de estado ocupan la página actual del inventario/ficha, sin una URL independiente para el borrador. Recargar vuelve a consulta y no promete recuperación del contenido no guardado.
- Confirmaciones breves nativas del navegador para descarte, archivo y restauración. Conservan gestión de foco/teclado del navegador y CSP; su aspecto depende de él. Los formularios extensos no se presentan en diálogos.
- Restaurar conserva referencias por omisión y ofrece una selección explícita de reemplazos activos. La validación definitiva es del servidor.
- Ante resultado incierto o conflicto se exige una lectura explícita; no hay resolución automática ni combinación de versiones. El descarte es confirmado para activos existentes.

Son decisiones propuestas en esta entrega para revisión manual del PR. No se anotan como acuerdos nuevos en `09-diseno-de-pantallas.md`. Los datos ficticios se limitan a pruebas.

## Verificación

```powershell
npm run contracts:check
npm run build
npm run test:ui
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm run test:gateway
docker build -t mspi-front-hu011-review .
```

- 83 pruebas UI/estado/cliente: 19 nuevas de formularios/protección y 64 anteriores actualizadas. Cubren cuatro escrituras/CSRF, cuerpo y revisión, código fijo, referencias/paginación, validación/duplicados, conflicto, resultado incierto, motivo/confirmación, doble envío, desmontaje, 401/403 y CSRF inválido, AU/GS sin historial, cancelación de navegación/cierre, foco con borrador, revocación/identidad/expiración y fallo temporal de revalidación.
- 17 pruebas de reglas/gateway HTTPS, incluida la entrega de todos los archivos declarados por el manifiesto y el componente cargado bajo demanda.
- TypeScript estricto, contrato generado y build Vite. El formulario separado ocupa aproximadamente 11 kB minificado; la entrada conserva la advertencia previa de tamaño, aproximadamente 563 kB / 165 kB gzip. No se cambia ese umbral ni se afirma una optimización global del paquete.

Las pruebas usan DOM/fetch simulados y upstream HTTPS local. No acreditan inspección visual real, validación de todos los comportamientos de confirmación/beforeunload del navegador ni ensayo contra backend/PostgreSQL desplegado. Se construye imagen Docker para revisión, sin desplegar servicios ni modificar datos empresariales.

Entrega con commit, push y PR hacia `Develop`. La revisión/fusión corresponde exclusivamente al responsable, sin auto-merge. CI se consulta en el PR.
