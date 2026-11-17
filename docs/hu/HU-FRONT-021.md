# HU-FRONT-021 · Valoración residual de riesgos

## Historia y alcance

Como AE o GS de la empresa activa, quiero guardar y confirmar una valoración residual usando una inherente vigente como base, seleccionando pruebas de controles vinculados o justificando la ausencia de mitigación, sin descuentos automáticos y conservando antecedentes.

Parte de `Develop` en `7cfbf2b` (PR #21 fusionado). Continúa HU019–HU020 sobre OpenAPI 1.24.0, sin modificar backend, contrato, infraestructura ni documentos aprobados 01–09. Los datos ilustrativos se limitan a fixtures de pruebas.

## Criterios implementados

- **Nueva valoración residual** para AE/GS únicamente en análisis o tratamiento, con inherente registrada sin revisión requerida. El historial permite editar/confirmar borradores; las confirmadas mantienen consulta. AU conserva lectura, RA solo no accede al módulo y AP no obtiene permisos empresariales automáticamente.
- Preparación mediante GET paginados existentes: busca la inherente indicada por la ficha, no la primera fila del historial. Valida asociación, confirmación, categorías y revisión capturada. Recorre las páginas necesarias; aborta al salir/invalidar ámbito. No inventa un GET individual de valoración.
- Consulta antecedentes residuales para distinguir primera valoración de reevaluación. La existencia de una confirmada exige motivo de hasta 2000 aunque esa versión ya no esté vigente. La primera omite motivo. Si detecta borrador existente, no permite crear otro y ofrece reconsultar el historial. El backend vuelve a verificar todo al escribir.
- Creación sin categorías o decisión de mitigación preseleccionadas; los vacíos se conservan como null. Edición precarga entradas reales, booleano false, motivo/antecedente y verificaciones guardadas. Las referencias no resueltas muestran su identificador, sin inventar nombres ni acreditar vigencia por tener un UUID.
- Guardar admite pendientes y no confirma. Confirmar es otro paso sobre las entradas/referencias guardadas, con controles de solo lectura y confirmación breve. Requiere probabilidad, impacto, periodo (máximo 150), fundamento, supuestos, fuente y decisión de mitigación.
- **Sin mitigación:** exige justificación de hasta 2000, ninguna verificación y las mismas categorías de probabilidad/impacto de la base. El botón **Usar categorías de la base inherente** copia esos valores solo por acción explícita; no hay recategorización silenciosa. Los seleccionados se retiran explícitamente antes de guardar sin mitigación.
- **Con mitigación:** selección expresa de verificaciones, sin justificación de ausencia de mitigación. Los borradores pueden mantener decisiones/entradas pendientes, pero no se confirma sin selección coherente. Límite de 100 referencias, sin duplicados. No convierte un efecto esperado de vínculo en un porcentaje de reducción.
- Selector por controles ya vinculados, con paginación independiente y carga bajo demanda. Consulta implementación y verificaciones de su versión actual. Solo ofrece la referencia que la ficha identifica como última, de implementación aplicada/implementada, resultado efectivo o parcialmente efectivo y sin causa de pérdida de vigencia; exige criterios cumplidos positivos. No calcula vigencia con el reloj local. El servidor revalida vinculación, versión, últimas pruebas, evidencias, integridad y vencimiento al confirmar.
- Selecciones y etiquetas se conservan al paginar controles/verificaciones. Las guardadas antiguas no se eliminan ni reemplazan automáticamente; pueden retirarse expresamente. No se crean implementaciones, verificaciones o archivos como efecto de seleccionar una prueba.
- Si cambia la inherente, permite revisar y guardar explícitamente un borrador para actualizar su base; no confirma una base guardada distinta de la vigente. Una lectura de otra revisión bloquea la escritura y obliga a consultar de nuevo, sin rebases automáticos.
- POST/PUT usan revisión capturada del riesgo, datos y motivo cuando corresponde; confirmación envía solo revisión esperada. API tipada, sesión del mismo origen y CSRF fresco. Metodología vinculada a la base elegida por el backend, sin selector metodológico arbitrario.
- Valida respuesta, revisión incrementada, riesgo/base/metodología, antecedente/motivo, estado y metadatos de confirmación. Confirma solo con nivel/índices/autor/fecha/vigencia y pruebas coherentes con las referencias guardadas. Un resultado inesperado se trata como incierto.
- Tras guardar/confirmar consulta nuevamente ficha y residuales y despliega su historial. Nivel, índices, pruebas con procedencia y avisos vienen del backend; no publica valores optimistas ni calcula descuentos. Conservar la anterior no significa que siga vigente tras una confirmación nueva.
- Protege cambios al navegar/cambiar empresa/cerrar sesión/salir y conserva la revalidación de autorización. Controla envíos simultáneos y resultados tardíos por desmontaje/ámbito invalidado. Formulario solo en memoria, sin JWT, persistencia o reintentos automáticos. Abortar una solicitud no garantiza revertir la escritura remota.
- 400 conserva contenido y muestra campos incluidos `datos.entradas.*`; CSRF_INVALIDO permite intento explícito; 401/403 de preparación, selectores o escritura retira el contexto. Incompletitud devuelta al confirmar enumera faltantes sin afirmar éxito y permite volver a editar.
- 404/409 de estado/revisión/base/pruebas/mitigación/borrador existente bloquean otra escritura hasta consultar estado. 0/5xx y metadatos inválidos se consideran inciertos: puede haberse guardado. Confirma descarte antes de consultar ficha/historial y no atribuye un borrador encontrado a una solicitud incierta.

## Contratos y reglas contrastados

- POST `/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-residuales`, con `revisionEsperada`, `datos` y motivo de reevaluación cuando corresponde.
- PUT `…/valoraciones-residuales/{residualId}`, con `revisionEsperada` y `datos`.
- POST `…/valoraciones-residuales/{residualId}/confirmar`, solo con `revisionEsperada`.
- GET existentes de inherentes/residuales, controles vinculados, ficha de implementación y verificaciones de versión, siempre con ámbito empresarial/paginación documentados.

Se contrastaron `ApiResidualRiskController`, `JpaInherentRisks.startResidual/editResidual/confirmResidual/requireAssessmentWork/requireMitigation`, `ResidualAssessment`, `ResidualDependencies.verify/views`, `RiskMatrix.missing/calculate`, `ApiErrors` y PER-25/PER-26. La residual se valora conjuntamente por categorías, con base vigente y pruebas verificables o justificación sin mitigación; no se suman eficacias ni se calculan descuentos por control. No se introduce una nueva política de valoración.

## Decisiones nuevas para revisión

Propuestas de implementación, sin modificar el diseño aprobado 09:

1. Formulario como página, con preparación visible de base/antecedentes antes de habilitar escrituras. Recorre las páginas necesarias para localizar la referencia exacta y detectar reevaluación, sin asumir que la primera fila o una versión sin vigencia equivale a ausencia de antecedentes.
2. Decisión sin mitigación sí/no/pendiente y copia de categorías solo mediante botón explícito. Las referencias guardadas se preservan hasta retirarlas, sin sustitución silenciosa al cambiar controles o base.
3. Selector de verificaciones dentro de controles vinculados, desplegable y paginado, conservando selección. Confirmar usa únicamente lo guardado y comprueba el servidor la vigencia/integridad final.
4. Regreso al historial residual releído después de escribir o consultar una operación incierta. Residuales confirmadas y antecedentes se mantienen en la consulta de HU017.

Controles etiquetados, disposición vertical, botones adaptables, textos largos ajustables y objetivos de interacción de al menos 44 px de alto; tema MUI y CSP sin estilos inline. Sin dependencias nuevas.

Revisión manual sugerida: primera residual pendiente; completar sin mitigación, copiar categorías y confirmar; reevaluación con motivo; escoger una prueba actual frente a otra histórica/vencida; comprobar referencias guardadas que perdieron validez; cambiar la base y guardar explícitamente; conflicto, permiso retirado y cancelación. Revisar móvil, teclado y lector de pantalla en navegador real.

## Verificación y límites

- `npm run contracts:check`: contrato 1.24.0, 93 rutas/121 operaciones, sin regeneración.
- `npm run build`: TypeScript estricto y Vite correctos. Formulario/selector residual bajo demanda; sin archivos individuales de más de 500 kB. No acredita reducción de transferencia total ni rendimiento real.
- `npm run test:ui`: **346 pruebas**, incluidas 32 nuevas. Cubren primera residual pendiente, reevaluación con antecedente no vigente, búsqueda paginada de base/antecedentes, precarga de valores/false/referencias, copia explícita de categorías, sin mitigación/coherencia/retirada, confirmación separada, pendientes, cambio de base, borrador existente, base/revisión inválidas, prueba actual vinculada y selección paginada, vencimiento del servidor, procedencia de pruebas confirmadas, errores por campo, conflictos/incompletitud de preparación, incertidumbre, autorización/CSRF, duplicación/ámbito invalidado, metadatos incorrectos, AU, estado/base y protección de cambios/relectura. Conserva las 314 anteriores.
- `npm run test:gateway` con OpenSSL de Git: **17 pruebas HTTPS** correctas, incluyendo rutas/métodos/cuerpos del contrato, límites, sesión/CSRF, conflictos, CSP y todos los archivos del manifiesto.
- `docker build -t mspi-front-hu021-review .`: correcto, imagen `sha256:1922367bebb416ffc758d57fc5ee5932c51c68255a00e129c17151e615993128`. Sin despliegue ni reinicio de servicios.

Pruebas con DOM/fetch simulados, referencias de evidencia de prueba y upstream HTTPS local. No acreditan navegador real, auditoría visual/accesibilidad ni integración con backend/PostgreSQL/antimalware desplegados. No se guardaron ni confirmaron valoraciones empresariales.

Fuera de alcance: creación/cambio/aplicación/verificación de implementaciones, archivos de control, aceptación y cierre/transiciones posteriores del riesgo, acciones y nuevas políticas metodológicas.

Entrega mediante commit, push y PR hacia `Develop`, sin fusión ni auto-merge. Revisión y fusión manuales por el responsable.
