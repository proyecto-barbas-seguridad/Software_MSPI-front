# HU-FRONT-012 · Clasificación versionada de activos

Fecha: 16 de noviembre de 2026.
Rama: `feat/HU-FRONT-012-clasificacion-activos`.
Base: `Develop`, `854ccc2`, fusión de HU011 mediante PR #12.

Como AE o GS, quiero iniciar o continuar la clasificación de un activo, guardar entradas parciales y confirmar una versión completa conservando los valores reales, la vigente anterior y la trazabilidad.

## Fuentes y alcance

OpenAPI 1.24.0 versionado, HU-015 del backend, `ApiAssetClassificationController`, `JpaAssetClassification` y `ClassificationRules`; permisos y reglas de documentos centrales 02, 04, 05, 06 y bocetos 09. Se conservan backend, contrato, dependencias y documentación aprobada 01–09.

La confirmación de clasificación publica sus entradas completas conforme a PER-16. No añade operaciones de aprobación de tareas ni altera sus restricciones personales.

## Criterios implementados

- Entrada desde ficha activa con AE/GS, incluidas combinaciones AU+GS. AU solo consulta las versiones y RA queda fuera del inventario. Un activo archivado no ofrece escritura; se vuelve a comprobar al abrir el formulario y en cada operación del servidor. AP no se infiere de identidad.
- Formulario de página cargado bajo demanda, sin iniciar automáticamente una valoración. Al abrir consulta ficha, primera página de clasificaciones y detalle de la pendiente o vigente. El backend ordena por versión descendente y admite solo un borrador: la primera página contiene la pendiente y vigente actual. Se comprueba coherencia mínima de IDs, estados y estructura.
- Si hay pendiente, se continúa ese borrador con su revisión y entradas reales; se identifica expresamente. Si no hay pendiente y existe vigente, se copian sus entradas para una revisión nueva y se exige motivo. No se edita una versión confirmada. Si no hay versiones, se parte de pendientes/nulos.
- Regresión ACT-033: una vigente con C/I/D 1/1/1 se presenta y copia como 1/1/1. No se usan constantes de ejemplo 5/3/5 ni se asigna cero a un pendiente. Si existe un borrador distinto, se muestran sus entradas y se explica que es la versión pendiente, manteniendo la vigente como referencia.
- C/I/D seleccionable únicamente 1, 3, 5 o pendiente. Fundamento y declaraciones pueden permanecer pendientes al guardar, sujetos a coherencia condicional. Las salidas se construyen con una lista explícita de campos: no se envían criticidad, nivel, metadatos o campos calculados como entrada.
- Datos personales con tres estados: sí, no y pendiente. Con sí, se capturan menores, seis tipos del catálogo, finalidad y autorización SI/NO/NO_APLICA. NO_APLICA ofrece justificación de hasta 2000 caracteres. Cambiar a no/pendiente retira las dependencias con confirmación si tenían información. Cambiar autorización puede retirar una justificación existente con confirmación. Los textos vacíos se normalizan a nulo, sin convertir falso en pendiente.
- POST de borrador inicial/nueva revisión con entradas y motivo (hasta 1000 caracteres), o PUT de pendiente con `revisionEsperada`. Un guardado exitoso actualiza ID/revisión/entradas desde la respuesta y limpia los errores previos; no confirma ni recalcula criticidad. El motivo ya registrado de un borrador se muestra sin editar porque el PUT no lo admite.
- Antes del POST se vuelve a consultar la primera página: un borrador nuevo o una vigente distinta bloquean la creación hasta consultar el estado actual. La comprobación previa no es un bloqueo transaccional; el contrato de inicio no admite revisión esperada de la versión origen. El backend sigue imponiendo unicidad de borrador y estados bajo su transacción.
- Confirmación explícita de la versión guardada, con resumen C/I/D y revisión exacta devuelta por el servidor. Cambios locales sin guardar deshabilitan confirmar también en el controlador. La API valida dimensiones, fundamento y condicionales; CLASIFICACION_INCOMPLETA conserva el borrador e informa los campos. Tras confirmación, se muestran versión vigente, criticidad y nivel devueltos, y se ofrece releer la ficha actualizada.
- La versión confirmada previa permanece vigente mientras el borrador está pendiente. La interfaz no le asigna criticidad definitiva a ese borrador ni sustituye los valores de la ficha por un cálculo local. Las versiones históricas no se sobrescriben.
- Conflicto de revisión, valoración confirmada, origen cambiado o borrador concurrente bloquean nuevos envíos y conservan los cambios locales hasta consultar explícitamente el estado. No se actualiza la revisión en silencio ni se repite un POST.
- Un fallo después de intentar una escritura (red/timeout/5xx/respuesta inválida) se trata como resultado incierto y requiere lectura explícita antes de continuar. Un fallo en la lectura previa, antes del POST, no se presenta como escritura incierta. Sin reintentos automáticos ni doble envío; respuestas tardías se descartan al cambiar de alcance o desmontar.
- CSRF nuevo por escritura mediante el cliente de HU007. CSRF inválido conserva las entradas para reintento explícito; 401/403 de autorización retiran contenido y delegan al alcance empresarial. Errores por campo y correlación se mantienen visibles. El estado confirmado no conserva errores de un intento previo.
- Protección de borrador de HU011: navegación, cancelar, cambiar empresa o salir preguntan por cambios no guardados; la expiración/revocación los retira sin pedir permiso. El foco revalida identidad/roles sin desmontar un formulario con cambios. No hay persistencia fuera de memoria.
- Controles adaptables, etiquetas y estados textuales, campos personales agrupados y áreas activables de 44 px. Paper/Alert y Emotion conservan nonce, sin atributos de estilo inline ni cambios de CSP.

## Decisiones para revisar en el PR

- Continuar automáticamente el único borrador existente; para nueva revisión copiar la vigente y solicitar motivo. El botón de entrada nunca escribe por sí mismo.
- Separar guardar y confirmar; la confirmación usa únicamente datos ya guardados, con resumen en confirmación nativa breve.
- Pedir confirmación antes de retirar datos personales dependientes o una justificación ya escrita; los campos que dejan de aplicar se envían vacíos/nulos conforme al contrato.
- Mantener el formulario en la página de la ficha, sin URL ni recuperación persistente de su borrador local. Tras confirmar, mostrar el resultado y ofrecer volver a la ficha releída.

Se entregan como decisiones de implementación para revisión, sin registrarlas como aprobación nueva en `09-diseno-de-pantallas.md`. Los ejemplos se limitan a pruebas ficticias.

## Verificación y límites

```powershell
npm run contracts:check
npm run build
npm run test:ui
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm run test:gateway
docker build -t mspi-front-hu012-review .
```

- 103 pruebas UI/estado/cliente: 20 nuevas de clasificación y 83 previas. Precarga 1/1/1, ausencia/nulos, motivo, pendiente frente a vigente, guardado/revisión/confirmación separada, corrección de incompletos, condicionales, eliminación explícita, conflictos, escrituras inciertas, lectura previa fallida, origen concurrente, CSRF, autorización, doble envío/desmontaje, activo archivado, IDs cruzados, tipos de transporte y protección del borrador.
- 17 pruebas de reglas/gateway HTTPS conservan sus restricciones y verifican los archivos del manifiesto, incluidos formularios bajo demanda.
- TypeScript estricto, contrato y build Vite. Clasificación se carga como archivo separado de aproximadamente 17 kB minificado. La entrada mantiene la advertencia previa de aproximadamente 565 kB / 166 kB gzip; no se modifica el umbral ni se afirma optimización global.

Las pruebas usan DOM/fetch simulados y upstream HTTPS local; no acreditan inspección visual en navegador real ni integración con backend/PostgreSQL desplegado. El comportamiento nativo de confirmaciones y beforeunload requiere revisión manual de navegador. La imagen Docker se construye para revisión, sin desplegar ni modificar datos empresariales.

Entrega con commit, push y PR hacia `Develop`, sin fusión ni auto-merge. El responsable revisa/fusiona manualmente; CI se comprueba en el PR.
