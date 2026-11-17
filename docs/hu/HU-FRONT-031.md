# HU-FRONT-031 · Configuración empresarial

## Historia y alcance

Como AE, quiero editar nombre, descripción y zona horaria de mi empresa con revisión de concurrencia. Como GS o AU, quiero consultar esos datos sin obtener permisos de administración.

Parte de `Develop` en `66edd5b`, fusión del PR #31 de HU030. Consume OpenAPI 1.24.0 sin cambios de contrato, dependencias, infraestructura, backend o documentos aprobados 01–09. Datos ilustrativos únicamente en fixtures; no ejecuta escrituras empresariales reales ni despliegues. Membresías, invitaciones y plataforma siguen en sus historias independientes.

## Criterios implementados

- Navegación **Configuración empresarial**, ruta `#/empresas/{empresaId}/configuracion`, carga de pantalla bajo demanda, empresa y roles vigentes visibles. AE/GS/AU consultan; solo AE edita incluso al combinar roles. RA solo conserva su contexto mínimo; AP no concede lectura empresarial automática.
- Consulta nombre, descripción, zona horaria y revisión real. Descripción nula/vacía muestra «Sin descripción registrada»; un error o dato inválido no se presenta como ausencia de información. No permite editar esquema, estado técnico, metodología o privilegios.
- Edición en página, con valores reales precargados y revisión capturada al abrir. Nombre obligatorio de hasta 200 caracteres, descripción opcional y zona obligatoria. Zona textual con sugerencias no exhaustivas, conservando la existente; no limita la selección a un catálogo supuesto del navegador.
- El servidor valida la zona IANA que admite. La interfaz explica cómo escribirla y presenta su error por campo; no considera que una sugerencia de interfaz autorice una zona. La lectura exige que el navegador reconozca la zona para poder presentar las horas empresariales, como el contexto existente.
- Cambiar zona exige confirmación breve con valor anterior/nuevo y efecto sobre fechas límite futuras. Los eventos históricos conservan instantes absolutos. No recalcula plazos, valoraciones ni estados de objetos en el navegador.
- PUT con nombre, descripción explícita, zona y revisionEsperada; sesión del mismo origen y CSRF fresco mediante el cliente común. Siempre incluye descripción para no vaciarla por omisión. Conserva null cuando no se edita una descripción originalmente nula; vaciar una descripción existente envía cadena vacía.
- Un 204 confirma la escritura pero no sustituye una consulta. Después vuelve a consultar configuración; solo una respuesta validada permite mostrar el resultado. Un guardado sin cambios efectivos conserva revisión; un cambio efectivo exige revisión mayor. No presupone que siempre aumente exactamente una, pues puede haber otro cambio concurrente antes del GET.
- Presenta la revisión y los datos leídos, sin sustituirlos por el formulario enviado. Si el GET ya contiene un cambio posterior, muestra esa configuración y pide revisar su revisión vigente. No atribuye por coincidencia de contenido un resultado incierto a una solicitud propia.
- Tras guardar/reconciliar/actualizar consulta de nuevo sesión y contexto para actualizar nombre/zona visibles de la empresa sin aplicar valores optimistas. Si esa revalidación de contexto falla por transporte, informa que conserva el contexto consultado anteriormente. 401/403 retiran el ámbito.
- Campos y revisión capturada se conservan al recuperar foco si identidad, membresía y roles siguen vigentes. El foco revalida acceso, sin reemplazar silenciosamente el formulario ni afirmar que se consultó una configuración nueva. Cambio de identidad/roles retira la vista.
- Protección de cambios al cancelar, navegar, cambiar empresa, cerrar sesión y salir de la página mediante las guardas existentes. Cancelación aceptada vuelve a consultar configuración; si había una operación en curso se advierte que salir no garantiza revertirla.
- Bloquea solicitudes simultáneas. Al salir aborta e ignora respuestas tardías, tanto de consulta inicial como de escritura; no vuelve a leer después de abandonar una escritura. Formulario y datos permanecen únicamente en memoria de esta pantalla.
- 400 presenta errores por campo y conserva valores; CSRF_INVALIDO admite reintento explícito sin perder contexto. No hay reenvíos automáticos.
- 404/409, red/timeout, 5xx o respuesta no verificable bloquean nuevo PUT hasta consultar. Un fallo del GET después de 204 también bloquea otro envío, aunque el error de lectura fuera normalmente corregible. No muestra éxito de la vista mientras no pueda comprobar sus datos.
- **Descartar formulario y consultar configuración** exige confirmación; cancelar conserva los campos. Consultar con éxito vuelve a vista de datos vigentes antes de abrir otro editor. Si falla mantiene el formulario bloqueado y ofrece consultar de nuevo; no sustituye automáticamente la revisión capturada ni reenvía el borrador.
- Carga, error, referencia de soporte y espera del servidor visibles cuando corresponden. Reintento/actualización de lectura explícitos; pérdida de autorización en lectura, guardado o consulta posterior retira el contexto.

## Contratos y reglas contrastados

- Documentos 02 PER-06/PER-07 y restricciones transversales; 03 CU-06, RN-11 y efecto de zona; configuración empresarial propuesta en 09. Se conserva la distinción entre reglas aprobadas y decisiones nuevas de presentación.
- GET/PUT `/api/v1/empresas/{empresaId}/configuracion`, operaciones `consultarConfiguracion` / `actualizarConfiguracion`, `CompanyConfiguration` y `UpdateCompanyConfiguration`.
- `ApiCompanyAdministrationController`: nombre normalizado, respuesta 204 y campos acotados; `JdbcCompanyAdministration`: zona de `ZoneId.getAvailableZoneIds`; V7 `configuracion_empresa` / `configurar_empresa`: permisos AE/GS/AU para lectura, AE para escritura, revisión bloqueada, no-op sin incremento y evento administrativo transaccional.
- El endpoint no exige motivo de edición; no se inventa ese requisito ni se envían propiedades técnicas. La actividad empresarial ya dispone de su consulta separada en HU030.

## Decisiones nuevas para revisión

Propuestas de implementación; documento aprobado 09 intacto:

1. Página de consulta con revisión visible y edición separada dentro del módulo, sin diálogo extenso. GS/AU reciben los mismos datos de consulta con ausencia de controles de edición.
2. Campo de zona con sugerencias y confirmación explícita al cambiarla, explicando las fechas límite. No se altera silenciosamente por zona del equipo ni se convierte en un selector restringido a cuatro opciones.
3. Guardado 204 seguido de relectura y actualización de contexto; formulario bloqueado ante conflicto o incertidumbre, con descarte confirmado antes de consultar y volver a editar.

Mantiene Material UI, temas existentes, campos etiquetados, errores asociados, foco al título, textos ajustables y controles de al menos 44 px. Revisar manualmente móvil, teclado, lector de pantalla, sugerencias de zona, confirmaciones y texto largo en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones, correcto sin regeneración.
- `npm run build`: TypeScript estricto/Vite correctos, configuración bajo demanda y sin fragmentos mayores de 500 kB.
- `npm run test:gateway`: **17 pruebas HTTPS correctas**, con upstream simulado.
- `docker build -t mspi-front-hu031-review .`: correcto, sin iniciar contenedores ni servicios.
- Suite UI completa con ajuste final: resultado registrado en el PR tras terminar la ejecución.
- 37 pruebas nuevas cubren permisos, precarga real, descripción null/vacía, zona y confirmación, no-op, revisión posterior concurrente, validación, CSRF, conflicto/incertidumbre, relectura fallida, autorización, respuestas tardías, cancelación, navegación, foco y formato GET/PUT.

Las primeras ejecuciones locales agotaron esperas al cargar rutas de pruebas existentes (siete en paralelo sin límite y una con dos procesos). El DOM seguía en carga; no se modificaron sus aserciones de permisos o negocio. Se limita Vitest a dos procesos, se amplía la espera asíncrona de Testing Library de uno a tres segundos y el máximo por prueba de cinco a diez segundos. No se añaden pausas fijas ni se omiten casos. La ejecución final usa esa configuración y se contrasta de nuevo en CI.

Pruebas DOM/fetch y upstream HTTPS simulados. No acreditan integración real con backend/PostgreSQL ni concurrencia real entre varias cuentas, cambios efectivos de zona en plazos o revisión visual de accesibilidad. Sin cambios empresariales reales ni despliegue.
