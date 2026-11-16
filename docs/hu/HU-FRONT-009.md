# HU-FRONT-009 · Panel empresarial en React

Fecha: 16 de noviembre de 2026.
Rama: `feat/HU-FRONT-009-panel-empresa`.
Base: `Develop`, `5a48670`, fusión de HU008 mediante PR #9.

Como integrante con permiso de consulta, quiero ver el panel de mi empresa con el corte, filtros, resultados y pendientes reales para orientar el seguimiento de seguridad.

## Fuentes y alcance

La dirección Panorama está elegida en el documento 09. La matriz de permisos 02 y las reglas de resultados 04 prevalecen sobre sus cifras ilustrativas. Se utiliza el contrato OpenAPI 1.24.0 ya versionado y la semántica comprobada en `Software_MSPI-back/docs/hu/HU-026.md`, `DefaultCompanyPanel` y las proyecciones SQL de evaluaciones/riesgos/acciones. No se modifica backend, contrato, gateway ni documentación aprobada 01–09.

La HU migra el panel al espacio React de HU008. Las consultas existentes de inventario, evaluación y evidencias conservan sus pantallas actuales. No incorpora formularios de negocio, aprobaciones, reportes, tareas asignadas ni administración de plataforma.

## Criterios implementados

- Entrada automática al panel tras validar sesión y contexto de una empresa con AE, GS o AU. RA solo no recibe enlace lateral ni ejecuta solicitudes de panel/resultados. GS+RA y AU+GS conservan consulta; no se deduce AP ni se agregan permisos de otras empresas.
- `GET /empresas/{empresaId}/panel` alimenta los totales y desgloses de evaluaciones, riesgos y acciones. Son todos los registros filtrados, incluidos estados finales; no se etiquetan como «abiertos». No se estima un total de activos a partir de páginas ni se inventa un indicador que el endpoint no entrega.
- Se muestran empresa activa, membresía, zona horaria, corte `generadoEn`, periodo efectivo y base residual/inherente devueltos por el servidor. El periodo inclusivo filtra fecha de evaluación, día empresarial de creación del riesgo y fecha límite de acción, respectivamente.
- Filtros iniciales: desde, hasta y base de riesgo, con limpieza y comprobación del rango. Aplicar/cambiar sección reinicia la página; revalidar por foco conserva los filtros aplicados. Cambiar empresa los retira. El contrato admite más filtros, que no se presentan aún como implementados.
- Detalles de evaluaciones, riesgos y acciones paginados de cinco en cinco con `detalle`, `pagina` base cero y `tamano=5`. El límite de siguiente se deriva del total filtrado de esa sección, sin recalcular los totales. Enlaces únicamente a consultas de evaluación ya implementadas; no hay enlaces falsos a acciones/riesgos completos.
- En detalle de evaluaciones, se consulta `/evaluaciones/{evaluacionId}/resultados` para la primera evaluación de la página, ordenada por fecha descendente en el backend. Aparecen nombre, revisión, puntaje global de controles, avance, pendientes, exclusiones y tablas separadas de dominios y cláusulas. No se mezclan las cláusulas con el puntaje de controles ni se afirma certificación/madurez.
- El panel y los resultados son consultas independientes. Se explica que los resultados pueden reflejar cambios posteriores al corte; no se afirma un snapshot atómico entre endpoints. Si falla solo resultados, los agregados permanecen con un aviso, sin puntaje fabricado.
- Puntaje cero se muestra como cero. `null` se presenta conforme a SIN_ELEMENTOS, NO_APLICA o PENDIENTE y el avance no calculable conserva su ausencia. PROVISIONAL y CALCULADO usan el estado del backend. No hay fórmulas ni reclasificación en el navegador.
- Riesgos: conteos de vigente, pendiente y revisión requerida separados de niveles; la matriz incluye solo valoraciones vigentes de la base seleccionada. Cada celda conserva todos los grupos probabilidad/impacto/nivel recibidos: pueden existir varios niveles para una misma pareja, por distintas metodologías. No se selecciona uno ni se recalcula un nivel. La ausencia de un grupo en una respuesta válida significa cero registros, no riesgo bajo.
- Acciones: vencimiento mostrado aparte de ejecución; las vencidas son un subconjunto, no otro estado ni una suma adicional. Se usa el booleano y conteo del servidor, sin recalcular plazos en la zona del navegador.
- Cada carga retira el panel anterior. Un único alcance en memoria cancela solicitudes y descarta respuestas tardías al filtrar, cambiar empresa, salir o expirar. 401 vuelve al acceso; 403 retira todo el contexto. Errores de red, servicio o formato no se convierten en cero y permiten reintentar.
- Validación de formato mínimo: empresa coincidente, paginación/detalle/filtros efectivos, zona horaria y fechas válidas, conteos seguros no negativos, estructura de secciones y resultados del ID solicitado. No sustituye validaciones metodológicas o autorización del backend.
- Bloques apilados en móvil, filtros adaptables, cláusulas/matriz plegables, tablas con región de desplazamiento accesible y etiquetas/estados textuales. CSP conservada con nonce; pruebas comprueban que el panel no genera atributos de estilo inline. Sin dependencias nuevas.

## Decisiones para revisión del responsable

- Destacar la primera evaluación de la página; las demás abren su consulta existente. Al paginar, cambia la evaluación destacada. Se etiqueta expresamente y no se presenta como la más reciente de toda la empresa en páginas posteriores.
- Fecha/base como conjunto inicial de filtros; cinco registros por página y matriz/cláusulas plegables para compactar móvil.
- Mostrar agregados del panel incluso si falla el endpoint independiente de resultados, con aviso y acción de actualización.

Estas decisiones son implementación propuesta para revisar en el PR; no se registran como nueva aprobación en `09-diseno-de-pantallas.md`. Los datos ficticios existen solo en pruebas y no se inyectan en la aplicación.

## Verificación y límites

```powershell
npm run contracts:check
npm run build
npm run test:ui
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm run test:gateway
docker build -t mspi-front-hu009-review .
```

- 50 pruebas de UI/estado/cliente: 20 del panel más las 30 previas. Cubren cero y ausencias, estados provisionales, cláusulas separadas, zona empresarial, filtros/limpieza/rango, paginación, matriz con varios niveles, riesgo sin valoración vigente, ejecución/vencimiento, vacíos/errores/carga, resultados parciales, RA solo, filtros al revalidar, respuestas tardías, cambio de empresa, 401/403, formato y nonce/CSP.
- 17 pruebas de reglas/gateway HTTPS conservan las restricciones y el contrato de entrega.
- TypeScript estricto, contrato generado y build Vite verificados. Se conserva la advertencia de tamaño de entrada: aproximadamente 535 kB minificado / 158 kB gzip. La división de módulos sigue pendiente al unificar las pantallas migradas.

Las pruebas usan DOM/fetch simulados y upstream HTTPS local. No acreditan inspección visual en navegador real ni integración con un backend/PostgreSQL desplegado. No se despliegan servicios ni se modifican datos empresariales. La imagen Docker se construye para revisión.

Entrega con commit, push y PR hacia `Develop`. Revisión y fusión manuales por el responsable, sin auto-merge. CI se consulta en el PR.
