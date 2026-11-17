# HU-FRONT-030 · Consulta de actividad empresarial

## Historia y alcance

Como AE, quiero consultar los eventos de mi empresa y filtrarlos por instante, actor, acción u objeto para revisar la trazabilidad sin editar ni borrar registros.

Parte de `Develop` en `30fbe4d`, fusión del PR #30 de HU029. Usa el contrato OpenAPI 1.24.0 existente. Backend, infraestructura y documentos aprobados 01–09 conservados. Los eventos ilustrativos están únicamente en pruebas; no modifica datos empresariales ni inicia servicios.

## Criterios implementados

- Enlace **Actividad empresarial** exclusivo para quien tiene AE en la empresa activa, incluso combinado con otros roles. Ruta `#/empresas/{empresaId}/actividad`, pantalla bajo demanda y navegación seleccionada. GS/RA/AU sin AE no acceden por enlace ni por URL directa; AP no se infiere de la sesión y no concede acceso empresarial automático.
- Consulta de solo lectura por GET con tamaño fijo de cinco. Presenta origen administrativo u operativo, identificador del evento, actor usuario, código de acción, tipo/ID de objeto, resultado registrado, motivo cuando existe y correlación.
- Usa la pareja origen/eventoId como identidad del evento, tal como exige el contrato. No confunde IDs iguales de distintos orígenes. No hay edición, borrado, exportación ni enlaces arbitrarios a objetos basados en un código de tipo.
- El backend no entrega nombres de actor: muestra UUID de usuario, expresamente identificado, sin confundirlo con membresía ni inventar nombres. Conserva códigos exactos para permitir filtrar sin perder su significado original. Ausencia de motivo se presenta como «Sin motivo registrado», no como pendiente o no aplica.
- Fechas mostradas en la zona empresarial y texto del instante original conservado. Filtros desde/hasta requieren ISO con segundos y zona explícita, por ejemplo `2026-11-17T00:00:00-05:00` o `2026-11-17T05:00:00Z`; no usan por suposición la zona del PC.
- Desde inclusivo y Hasta exclusivo, con Desde estrictamente anterior a Hasta. Valida fechas reales y rango de años del backend. Conserva el desplazamiento y la precisión fraccional hasta nueve decimales al comprobar el periodo, sin redondear instantes diferentes al mismo milisegundo.
- Filtros combinados exactos: UUID de actor, código de acción, tipo de objeto y UUID de objeto. Códigos en mayúsculas con patrón del contrato; un código válido sin coincidencias admite página vacía. No limita los códigos a un catálogo supuesto ni descarga miembros para resolver nombres.
- **Aplicar filtros** inicia desde el primer cursor. Filtros efectivos visibles junto a resultados; editar campos no cambia la consulta actual. Con filtros sin aplicar se informa el alcance anterior y se bloquea avanzar/retroceder hasta aplicar o restablecer.
- **Siguiente** transmite el cursor opaco devuelto junto con los mismos filtros. **Anterior** vuelve a consultar el cursor anterior; no recupera datos de una caché empresarial. No decodifica, fabrica ni persiste cursores. **Actualizar/Reintentar desde el inicio** reinicia la cadena con los filtros aplicados; no aplica silenciosamente un borrador.
- Orden conservado del servidor, más reciente primero con desempate estable. Indica número de página recorrida, sin total inventado. Explica que no es una instantánea inmutable; al actualizar pueden aparecer eventos nuevos. Cursor nulo significa fin, no se deduce por tener menos filas.
- Valida forma, tamaño, campos esenciales, instantes, identificadores, longitud de motivo, identidad repetida dentro de una página y cursor no repetido en la cadena. Datos incoherentes son error y no se presentan como página vacía. Orígenes diferentes con el mismo eventoId son válidos.
- Carga y nuevas consultas retiran las filas anteriores; acciones de envío bloqueadas mientras carga. Errores de transporte/servidor muestran aviso, correlación y espera cuando existen, con reintento explícito. No reintenta automáticamente ni convierte un fallo en cero eventos.
- 401/403 retiran el contexto empresarial mediante las guardas compartidas. Cambiar empresa, navegar o salir aborta consultas y descarta respuestas tardías. Filtros, cursores y filas solo permanecen en memoria durante esta pantalla; no se comparten entre empresas ni se guardan en URL/almacenamiento.
- Al recuperar el foco se comprueban sesión, empresa y roles sin borrar filtros aplicados/borrador y filas de la última consulta si la autorización sigue vigente. Identidad/roles cambiados retiran el ámbito. Un fallo de transporte conserva la vista con aviso explícito; cada nueva consulta requiere autorización del backend. Revalidar acceso no se presenta como haber actualizado los eventos.

## Contratos y reglas contrastados

- Documentos 01 RF-21/SEG-09/RNF-09, 02 PER-38 y separación de roles, 03 CU-28 y vista específica de AE propuesta en 09. Las decisiones pendientes de diseño no se elevan a aprobación funcional.
- GET `/api/v1/empresas/{empresaId}/actividad`, operación `consultarActividadEmpresarial`, `CompanyActivityPage` y `CompanyActivityEvent`. Sin ampliación ni regeneración del contrato.
- `ApiCompanyActivityController`: permiso `READ_ACTIVITY`, consulta combinada dentro de unidad empresarial autorizada, filtros desde inclusivo/hasta exclusivo, orden estable y cursor opaco.
- `ActivityLog`, `JpaActivityLog` y funciones de V15 de consulta administrativa/operativa: proyección limitada, actor/objeto/correlación y resultado. No lee registros técnicos ni contenido completo de objetos. La auditoría operativa de acciones conserva su pantalla e historial propios.

## Decisiones nuevas para revisión

Propuestas de implementación; el documento aprobado 09 permanece intacto:

1. Página de actividad exclusiva de AE, con tarjetas de cinco eventos que evitan una tabla ancha en móvil; actor/objeto/correlación visibles y códigos exactos.
2. Entrada textual ISO con desplazamiento explícito para evitar ambigüedad entre zona del equipo y empresa. Revisar facilidad de uso de estos campos; no introduce un selector de fecha que presuponga una conversión de zona.
3. Filtros por UUID y códigos según el contrato disponible, sin directorio de nombres supuesto. Navegación por cursores y actualización explícita desde el inicio, conservando el alcance aplicado durante la edición.

Material UI y temas existentes, campos etiquetados, distribución de una/dos columnas, texto ajustable y lista semántica. Foco en el título al entrar y en resultados después de consultar; indicador de carga y alertas accesibles. Revisar manualmente móvil, teclado, lector de pantalla y lectura de identificadores largos en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones; sin cambios generados.
- `npm run build`: TypeScript estricto y Vite correctos; actividad bajo demanda y sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **683 pruebas correctas**, incluidas 31 nuevas de filtros, permisos, estados, cursores, respuesta válida/inválida, revalidación, aislamiento y transporte GET; conserva las 652 pruebas previas de las demás HU.
- `npm run test:gateway`: **17 pruebas HTTPS correctas**, con upstream simulado y manifiesto de compilación actual.
- `docker build -t mspi-front-hu030-review .`: construcción local correcta; no inicia contenedores ni modifica servicios.
- Higiene de secretos y comprobación del diff correctas antes del commit.

Pruebas DOM/fetch y upstream HTTPS simulados. No acreditan integración real con backend/PostgreSQL, aislamiento con varias cuentas reales ni accesibilidad visual revisada en navegador. Sin despliegue ni escritura empresarial; no implementa administración de miembros, invitaciones o plataforma.
