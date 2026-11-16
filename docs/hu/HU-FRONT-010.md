# HU-FRONT-010 · Inventario y fichas de activos en React

Fecha: 16 de noviembre de 2026.
Rama: `feat/HU-FRONT-010-inventario-activos`.
Base: `Develop`, `8ea2e80`, fusión de HU009 mediante PR #10.

Como integrante con permiso de consulta, quiero buscar activos y revisar sus fichas, versiones de clasificación y eventos dentro del espacio React de mi empresa.

## Alcance y fuentes

Migración de la consulta de HU-FRONT-005 a React, con incorporación de historial paginado y datos declarados de las versiones. Se consultaron contrato OpenAPI 1.24.0, HU-014/HU-015 del backend y documentos centrales 02, 05, 06 y 09. La dirección Panorama está elegida; los documentos aprobados y sus reglas se conservan. Esta entrega no convierte los bocetos pendientes en acuerdos nuevos.

Solo lectura. Creación, edición, archivo/restauración y captura/confirmación de clasificación quedan para otra HU. No se presenta como implementado un formulario de precarga de clasificación; la ficha sí comprueba ACT-033 con sus datos reales de prueba 1/1/1, sin sustituirlos por 5/3/5. No se modifica backend, OpenAPI, gateway, esquema ni datos empresariales.

## Criterios implementados

- Navegación lateral y enlace empresarial hacia `#/empresas/{empresaId}/activos`, con ficha en `#/empresas/{empresaId}/activos/{activoId}`. Se revalidan sesión/contexto al entrar, recargar o cambiar ruta. Se conserva el panel en la ruta empresarial y las consultas antiguas en sus URL originales.
- AE, GS y AU consultan. RA solo es rechazado antes de solicitar inventario o fichas, incluso por URL directa. AP no se infiere de la identidad. La API sigue autorizando cada lectura; los enlaces no conceden acceso.
- `GET /activos`: búsqueda de nombre/código, siete tipos y estados activo/archivado. Estado inicial activo; todos los estados es una opción explícita. Aplicar/limpiar reinicia página. Búsqueda acotada a 250 caracteres y enviada mediante URLSearchParams del cliente tipado.
- Páginas de cinco registros con `hayMas` del backend. No se estima un total global a partir de las filas recibidas. Carga, vacío y error se diferencian; un error no produce un inventario vacío ficticio.
- Los filtros/página del inventario se conservan solo en memoria al abrir una ficha, volver o revalidar por foco. Se limpian al ir al selector, cambiar empresa, expirar o cerrar sesión. No se guardan entidades o consultas en almacenamiento web ni en URL.
- Ficha como página, sin diálogo: código, nombre, descripción, tipo, estado, ubicación, revisión y referencias al proceso, propietario y custodio. Las referencias se consultan por sus IDs locales y se muestran con su estado; se conserva la lectura de relaciones archivadas. Un custodio nulo se muestra como no registrado, no como error de consulta.
- Las clasificaciones se leen de `/clasificaciones`, cinco por página en orden descendente. Cada versión muestra C/I/D, criticidad/nivel del backend, fundamento, motivo, metodología, revisión y trazabilidad. Vigente, borrador pendiente y confirmada histórica tienen rótulos diferentes. Un borrador no reemplaza visualmente la confirmada vigente.
- C/I/D admite 1, 3, 5 o ausencia conforme al contrato; la ausencia se rotula pendiente. La interfaz no precarga dimensiones inventadas, calcula máximos ni confirma clasificaciones. Si una página no incluye la vigente, no se afirma que no exista.
- Datos personales plegables por versión: declaración, menores, tipos, finalidad, autorización y justificación. Ausencia pendiente se distingue de falso. Si declara que no contiene datos personales, los campos dependientes dicen no aplica. Autorización NO_APLICA conserva su justificación; no se interpreta como certificación de conformidad legal.
- Historial plegable, cinco eventos por página, independiente de la página de clasificaciones. Actor/fecha, operación, estados anterior/nuevo, motivo, campos y referencia de correlación proceden del backend. Los cambios de referencias conservan identificadores anteriores/nuevos; no se inventan nombres históricos ni se consultan identidades de otras empresas.
- Clasificación, historial y referencias se leen en paralelo después de validar la ficha. Un fallo no autorizado 401/403 en cualquier lectura retira todos los datos y comunica el evento al alcance empresarial. Otros fallos auxiliares muestran aviso parcial y actualización, sin atribuir un propietario inexistente ni borrar las partes disponibles.
- Cancelación y generación por cada carga; se retiran datos anteriores y se ignoran respuestas tardías al cambiar petición o desmontar la vista. El alcance empresarial conserva retirada global en cierre, vencimiento y revocación. Los filtros no se suman entre empresas.
- Validación mínima de transporte: IDs de activo/valoración/referencias coincidentes, UUID, estructura/paginación, revisiones, enums, C/I/D, datos condicionales y fechas. Se valida la zona de contexto antes de formatear fechas. No sustituye reglas del servidor.
- Diseño adaptable con etiquetas visibles, controles de 44 px, nombres/descripciones que pueden partir línea, detalles semánticos, navegación plegable y foco en el título al completar la carga. Se quita el bloque introductorio repetido del inventario; la empresa y todos sus roles siguen visibles. Emotion conserva nonce/CSP, sin atributos de estilo inline ni dependencias nuevas.

## Decisiones que debe revisar el responsable

- Cinco registros por página y estado activo como filtro inicial; limpiar vuelve a ese estado.
- Ficha como página y datos personales/historial plegables; paginar vuelve a consultar ficha y referencias vigentes. Al revalidar contexto se inicia la paginación de versiones/historial desde la primera página.
- Mantener la ficha con avisos si falla una referencia o sección auxiliar, salvo 401/403, que retira todo el contenido empresarial.
- Retener filtros solo durante la navegación en memoria de esa empresa. La URL directa identifica la ficha, sin incorporar datos del buscador.

Estas decisiones se entregan para revisión mediante PR. No se anotan como nuevas aprobaciones en `09-diseno-de-pantallas.md`. Los ejemplos ACT-033 y las personas/empresas de pruebas son ficticios y no se cargan como datos de la aplicación.

## Verificación y límites

```powershell
npm run contracts:check
npm run build
npm run test:ui
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm run test:gateway
docker build -t mspi-front-hu010-review .
```

- 64 pruebas UI/estado/cliente, incluidas 14 nuevas de inventario: filtros, limpieza, hayMas/paginación, URL directa, referencias archivadas, ACT-033 1/1/1 y borrador separado, pendientes/no aplica, historial, datos parciales, 401/403, cancelación, IDs/dimensiones inválidos, API tipada, CSP, revalidación y RA denegado.
- 17 pruebas de reglas/gateway HTTPS mantienen rutas acotadas, origen, TLS, sesión/CSRF, límites y entrega compilada.
- Contrato generado y TypeScript estricto correctos. Build Vite conserva la advertencia del paquete de entrada, aproximadamente 556 kB minificado / 163 kB gzip; la división de módulos continúa pendiente. Docker construye una imagen para revisión sin desplegarla.

Las pruebas utilizan DOM/fetch simulados y un upstream HTTPS local; no acreditan inspección visual en navegador real ni ensayo contra backend/PostgreSQL desplegado. El control de cambios empresariales sin guardar y conflictos de escritura se implementará con los formularios, que no existen en esta HU.

Entrega: commit, push y PR hacia `Develop`; revisión y fusión manuales, sin auto-merge. El estado remoto de CI se consulta en el PR.
