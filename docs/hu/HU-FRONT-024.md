# HU-FRONT-024 · Gestión inicial de implementaciones de controles

## Historia y alcance

Como AE o GS de la empresa activa, quiero registrar una implementación desde un control del catálogo, iniciar su trabajo y registrar cambios de una implementación aplicada creando otra versión, conservando antecedentes. Como AU quiero consultar sus estados e historial.

Parte de `Develop` en `f5a8ef4` (PR #24 fusionado). Continúa las consultas de HU020 y las dependencias de riesgo de HU021–HU023 sobre OpenAPI 1.24.0. No modifica backend, contrato, infraestructura ni documentos aprobados 01–09. Datos ficticios solo en fixtures de prueba.

## Criterios implementados

- Nuevo acceso **Implementaciones de controles** en la navegación empresarial, adaptado al menú móvil existente y con sección activa. Listado `#/empresas/{empresaId}/controles` y ficha `…/controles/{implementacionId}`. Verifica membresía/empresa antes de leer; AE/GS/AU consultan, RA solo no accede y AP no obtiene permisos empresariales por su rol de plataforma.
- Lista paginada de cinco implementaciones, con nombre, estado de trabajo, resultado vigente, número de versión y causa de pérdida de vigencia cuando exista. No inventa filtros por nombre/estado que el contrato no admite. Página vacía no equivale a cero efectividad.
- Ficha reutiliza el detalle e historiales de HU020 sobre la misma respuesta validada, sin otro GET para presentar los mismos datos. Versión actual, aplicaciones, versiones anteriores y verificaciones bajo demanda mantienen procedencia. No transforma una nota de catálogo o evaluación en efectividad.
- AE/GS, incluidos roles combinados, pueden crear implementación. Formulario como página con versión de catálogo disponible para nuevos usos, elemento de tipo CONTROL perteneciente a esa edición y responsable de negocio activo de la empresa. No usa membresías como responsables ni permite introducir UUID arbitrarios.
- Selectores paginados con selección conservada al navegar. El cambio explícito de catálogo limpia la selección de elemento y reinicia su página; cancela/ignora respuestas del catálogo anterior. No elige silenciosamente el primer elemento. Consulta solo controles y rechaza respuestas de otra edición o tipo CLAUSULA.
- Nombre (máximo 250), descripción, alcance y trabajo propios de la implementación, obligatorios y vacíos al crear. Tipo y modo quedan pendientes por defecto y se guardan como null si no se seleccionan. No copia el texto del catálogo como dato empresarial ni modifica respuestas de evaluación.
- La creación devuelve PROPUESTO, revisión cero, versión 1 sin aplicación ni verificación. Validación de respuesta incluye referencia de catálogo/elemento, detalle enviado, estado, revisión, numeración y metadatos. Crearla no la vincula automáticamente a un riesgo ni inicia trabajo.
- **Iniciar implementación** solo en PROPUESTO: confirmación breve, envío de revisión capturada, misma versión/detalle y avance a EN_IMPLEMENTACION. No acredita aplicación ni efectividad.
- **Registrar cambio de implementación** solo en IMPLEMENTADO. Precarga valores reales, incluidos tipo/modo pendientes, y conserva identificador de responsable aunque no aparezca entre las opciones activas. Exige motivo de hasta 2000 caracteres y confirmación breve sobre la nueva versión.
- El cambio conserva catálogo/elemento y revisión capturada; devuelve revisión incrementada, nueva versión con número consecutivo e identificador distinto, motivo y detalle guardados. La versión actual queda sin aplicación, sin verificación vigente y EN_IMPLEMENTACION. Conserva evidencias y verificaciones antiguas como antecedentes; el backend gestiona los avisos sobre valoraciones dependientes.
- No ofrece cambios libres en propuesto/en implementación: el backend solo admite iniciar propuesta o cambiar implementada. Confirmación de aplicación, archivos y verificación se desarrollan en la siguiente HU; no se omiten hitos ni se simulan resultados.
- Tras crear navega y consulta la ficha nueva; tras iniciar/cambiar relee la ficha, sin estado optimista. Historial previo sigue disponible al desplegarlo. La consulta desde los vínculos de riesgos mantiene su modo de lectura existente.
- Sesión del mismo origen y CSRF fresco en cada escritura. Creación envía referencia y detalle; iniciar envía solo revisionEsperada; cambiar envía revisionEsperada, detalle y motivo. Sin campos o endpoints añadidos al contrato.
- Protege texto pendiente al navegar, cambiar empresa, cancelar o abandonar sesión. Revalidar autorización mientras se edita mantiene la revisión capturada, sin rebase silencioso. Cambios de identidad/empresa/roles retiran el ámbito; respuestas tardías no actualizan otra pantalla. Previene envíos simultáneos. Datos de formulario solo en memoria; abortar no garantiza revertir una escritura remota.
- 400 muestra validación y conserva campos; CONTROL_CATALOGO_NO_DISPONIBLE, RESPONSABLE_NO_DISPONIBLE y CSRF_INVALIDO permiten corregir/reintentar expresamente. 401/403 de autorización retiran contexto. 404/409 de estado/revisión bloquean hasta consultar.
- Red/timeout/5xx o metadatos incoherentes son resultados inciertos: puede haberse guardado. No hay reenvío automático. Reconsultar requiere confirmar el descarte; en creación advierte que encontrar el mismo nombre no demuestra que lo creó esa solicitud. El listado no dispone de código único/filtro por nombre para atribuir esa operación.

## Contratos y reglas contrastados

- Documentos 02 PER-26, 03 CU-19, 05 DD-16 y 06 TR-CTL-01/02/04: catálogo e implementación separados; hitos de trabajo independientes de efectividad; nuevas versiones conservan historial.
- POST `/api/v1/empresas/{empresaId}/implementaciones-control`, `…/{implementacionId}/iniciar` y `…/{implementacionId}/cambiar`.
- GET de listado/ficha/versiones/verificaciones ya usados en HU020; catálogo con disponibleNuevos, elementos con tipo CONTROL y responsables-negocio con estado ACTIVO, todos paginados según contrato.
- `ApiControlImplementationController`, `JpaControlImplementations.create/start/change/requireCatalog/requireResponsible/views`, `ImplementationRecord`, `ControlVersion`, `ApiErrors` y avisos de dependencias en migración V11.

No se incorpora la propuesta documental de operación guiada para registrar un control ya existente: esta HU mantiene los pasos separados que implementa el backend. No introduce reglas nuevas de cálculo o aprobación de tareas.

## Decisiones nuevas para revisión

Propuestas de implementación; documento aprobado 09 intacto:

1. Acceso de navegación propio para implementaciones, con listado y ficha paginados, además de las consultas existentes desde riesgos.
2. Creación con selectores explícitos de catálogo/control y datos empresariales vacíos; cambiar edición requiere volver a seleccionar su elemento.
3. Cambio como página precargada, con motivo y confirmación breve. La ficha releída distingue nueva versión sin verificar de sus antecedentes.

Mantiene Material UI, foco al título, etiquetas, textos ajustables, disposición adaptable y controles de al menos 44 px; sin dependencias nuevas. Revisión manual sugerida: crear, iniciar, cambiar una implementada, comprobar historial y resultado sin verificar, catálogo retirado/responsable inactivo, conflicto/incertidumbre y permisos AE/GS/AU/RA. Pendiente inspección móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: OpenAPI 1.24.0, 93 rutas / 121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos; módulo/formulario bajo demanda, sin fragmentos mayores de 500 kB.
- `npm run test:ui`: **452 pruebas correctas**, incluidas 39 nuevas. Cubren listado/paginación, selectores y cambio de catálogo, creación, precarga, motivos/confirmaciones, estados y permisos, referencias/validación/CSRF, conflictos/incertidumbre, metadatos, duplicación/ámbito invalidado, revalidación sin rebase, navegación/relectura, historial y rutas/cuerpos contratados. Conserva las 413 anteriores.
- `npm run test:gateway`: **17 pruebas HTTPS** correctas, incluidos archivos generados/CSP.
- `docker build -t mspi-front-hu024-review .`: no pudo conectar al daemon de Docker Desktop (pipe dockerDesktopLinuxEngine inexistente). Sin arranque/reinicio de servicios; construcción a verificar en CI.

Pruebas con DOM/fetch simulados y upstream HTTPS local. No acreditan integración con backend/PostgreSQL reales ni recorrido manual en navegador. Backend, datos empresariales y documentos aprobados intactos. Aplicación con evidencia, carga de archivos, verificación de control y gestión de acciones siguen fuera de esta HU.
