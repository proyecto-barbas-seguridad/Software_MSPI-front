// Generated from contracts/backend-v1.yaml. Do not edit manually.
export interface paths {
    "/api/v1": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Consulta la versión del contrato */
        get: operations["consultarVersionApi"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        /** Consulta las cabeceras de la versión */
        head: operations["consultarCabecerasVersionApi"];
        patch?: never;
        trace?: never;
    };
    "/api/v1/identidad/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtiene un token CSRF vinculado a la sesión del navegador */
        get: operations["consultarCsrf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/identidad/sesion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consulta la identidad de la sesión vigente
         * @description Comprueba vencimiento, existencia de la cuenta, estado HABILITADA y version de credencial. Si la cuenta se desactiva, se elimina o cambia su version, rechaza la sesion con 401 NO_AUTENTICADO. Rehabilitar la cuenta requiere iniciar una nueva sesion.
         */
        get: operations["consultarSesion"];
        put?: never;
        /** Autentica una cuenta local y rota la sesión del navegador */
        post: operations["iniciarSesion"];
        /** Invalida la sesión vigente en el servidor */
        delete: operations["cerrarSesion"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/identidad/recuperacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Solicita recuperación de acceso con el correo registrado */
        post: operations["solicitarRecuperacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/identidad/recuperacion/confirmar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Restablece la contraseña con un comprobante de un solo uso */
        post: operations["confirmarRecuperacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/mis-empresas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista las empresas operables de la sesión */
        get: operations["listarMisEmpresas"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/contexto": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Consulta la membresía propia y el contexto mínimo de la empresa */
        get: operations["consultarContextoEmpresa"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Consulta el inventario local
         * @description Requiere AE, GS o AU de la empresa activa. Busca texto literal en código o nombre y admite filtros opcionales.
         */
        get: operations["listarActivos"];
        put?: never;
        /**
         * Registra un activo
         * @description Requiere AE o GS de la empresa activa. El código se reserva por empresa y se fija al crear.
         */
        post: operations["crearActivo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos/{activoId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        /**
         * Consulta un activo local
         * @description Requiere AE, GS o AU de la empresa activa. Incluye fichas archivadas.
         */
        get: operations["consultarActivo"];
        /**
         * Edita un activo vigente
         * @description Requiere AE o GS de la empresa activa. Exige revisión y preserva el código original.
         */
        put: operations["editarActivo"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos/{activoId}/archivar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Archiva un activo local
         * @description Requiere AE o GS de la empresa activa. Exige motivo y revisión vigente.
         */
        post: operations["archivarActivo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos/{activoId}/restaurar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Restaura un activo archivado
         * @description Requiere AE o GS de la empresa activa. Revalida todas las referencias y permite proporcionar reemplazos.
         */
        post: operations["restaurarActivo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos/{activoId}/historial": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        /**
         * Consulta el historial del activo
         * @description Solo AE de la empresa activa. Incluye estados, motivo, campos modificados y referencias históricas.
         */
        get: operations["consultarHistorialActivo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos/{activoId}/clasificaciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        /**
         * Consulta las versiones de clasificación del activo
         * @description Requiere AE, GS o AU. Las versiones se ordenan desde la más reciente.
         */
        get: operations["listarClasificacionesActivo"];
        put?: never;
        /**
         * Inicia una valoración pendiente
         * @description Requiere AE o GS y activo vigente. Una reevaluación exige motivo y conserva la valoración confirmada vigente.
         */
        post: operations["iniciarClasificacionActivo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos/{activoId}/clasificaciones/{valoracionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
                valoracionId: components["parameters"]["AssetValuationId"];
            };
            cookie?: never;
        };
        /**
         * Consulta una versión de clasificación
         * @description Requiere AE, GS o AU de la empresa activa.
         */
        get: operations["consultarClasificacionActivo"];
        /**
         * Reemplaza las entradas de una valoración pendiente
         * @description Requiere AE o GS y la revisión vigente. Las valoraciones confirmadas son inmutables.
         */
        put: operations["editarClasificacionActivo"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/activos/{activoId}/clasificaciones/{valoracionId}/confirmar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
                valoracionId: components["parameters"]["AssetValuationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirma y publica una valoración
         * @description Requiere AE o GS, C/I/D completas, fundamento y datos condicionales resueltos. La criticidad se calcula por máximo.
         */
        post: operations["confirmarClasificacionActivo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/catalogos": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista ediciones publicadas de catálogos
         * @description Requiere AE, GS o AU de la empresa operable. Incluye ediciones retiradas salvo filtro.
         */
        get: operations["listarCatalogos"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/catalogos/{versionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
            };
            cookie?: never;
        };
        /**
         * Consulta metadatos de una edición
         * @description Requiere AE, GS o AU de la empresa operable.
         */
        get: operations["consultarCatalogo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/catalogos/{versionId}/elementos": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
            };
            cookie?: never;
        };
        /**
         * Lista controles y cláusulas de una edición
         * @description Requiere AE, GS o AU de la empresa operable. Filtra por tipo, grupo, código o texto literal.
         */
        get: operations["listarElementosCatalogo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/catalogos/{versionId}/elementos/{elementoId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
                elementoId: components["parameters"]["ReferenceElementId"];
            };
            cookie?: never;
        };
        /**
         * Consulta descripción y origen del elemento
         * @description Requiere AE, GS o AU de la empresa operable. El identificador debe pertenecer a la edición solicitada.
         */
        get: operations["consultarElementoCatalogo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/metodologias": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista versiones publicadas de metodología
         * @description Requiere AE, GS o AU de la empresa operable.
         */
        get: operations["listarMetodologias"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/metodologias/{versionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
            };
            cookie?: never;
        };
        /**
         * Consulta una versión de metodología
         * @description Requiere AE, GS o AU de la empresa operable. Incluye reglas declarativas y referencia de aprobación.
         */
        get: operations["consultarMetodologia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista evaluaciones locales
         * @description Requiere AE, GS o AU de la empresa operable.
         */
        get: operations["listarEvaluaciones"];
        put?: never;
        /**
         * Crea una evaluación independiente en borrador
         * @description Requiere AE o GS, CSRF y revisión vigente cuando se modifica un borrador. Fija el alcance y el conjunto de elementos de la edición elegida.
         */
        post: operations["crearEvaluacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        /**
         * Consulta una evaluación local
         * @description Requiere AE, GS o AU de la empresa operable.
         */
        get: operations["consultarEvaluacion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        /**
         * Lista las respuestas de la evaluación
         * @description Requiere AE, GS o AU de la empresa operable. Admite filtros por tipo y grupo.
         */
        get: operations["listarRespuestasEvaluacion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        get?: never;
        /**
         * Diligencia una respuesta del borrador
         * @description Requiere AE o GS, CSRF y revisión vigente cuando se modifica un borrador. La nota exige fundamento. No aplica se admite para controles con justificación.
         */
        put: operations["editarRespuestaEvaluacion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/enviar-revision": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Envía una evaluación completa a revisión
         * @description AE o GS con CSRF. Selecciona un adjunto íntegro por respuesta con nota positiva según F1-1.
         */
        post: operations["enviarEvaluacionARevision"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/devolver": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Devuelve la evaluación a borrador
         * @description AE o GS con CSRF. Registra el motivo de devolución en el historial.
         */
        post: operations["devolverEvaluacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/cerrar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cierra la evaluación en revisión
         * @description AE o GS con CSRF. La selección declara cuáles adjuntos revisó como pertinentes. La API revalida la integridad y congela el diagnóstico.
         */
        post: operations["cerrarEvaluacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/cierre": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        /**
         * Consulta la instantánea de cierre
         * @description AE, GS o AU con acceso a la evaluación cerrada.
         */
        get: operations["consultarCierreEvaluacion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/correcciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crea un borrador vinculado a la evaluación cerrada
         * @description AE o GS con CSRF. Conserva el original y exige un responsable local vigente. Las respuestas heredadas quedan por confirmar.
         */
        post: operations["corregirEvaluacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/confirmar-heredada": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirma una respuesta heredada sin cambiar su contenido
         * @description AE o GS con CSRF. Requiere borrador y revisión vigente.
         */
        post: operations["confirmarRespuestaHeredada"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/resultados": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        /**
         * Consulta puntaje, avance y pendientes
         * @description Requiere AE, GS o AU de la empresa operable. El resultado global se calcula por control evaluado. Las cláusulas se muestran por separado.
         */
        get: operations["consultarResultadosEvaluacion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/hallazgos": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        /**
         * Lista hallazgos vinculados a una respuesta
         * @description Requiere AE, GS o AU de la empresa operable.
         */
        get: operations["listarHallazgosEvaluacion"];
        put?: never;
        /**
         * Registra un hallazgo de evaluación
         * @description Requiere AE o GS, CSRF y revisión vigente cuando se modifica un borrador.
         */
        post: operations["crearHallazgoEvaluacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/hallazgos/{hallazgoId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
                hallazgoId: components["parameters"]["EvaluationFindingId"];
            };
            cookie?: never;
        };
        get?: never;
        /**
         * Edita un hallazgo del borrador
         * @description Requiere AE o GS, CSRF y revisión vigente cuando se modifica un borrador.
         */
        put: operations["editarHallazgoEvaluacion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/evidencias": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        /**
         * Lista los metadatos de evidencias de una respuesta
         * @description Requiere AE, GS o AU con acceso a la evaluación. Omite la cuarentena; el listado no autoriza la descarga.
         */
        get: operations["listarEvidenciasRespuesta"];
        put?: never;
        /**
         * Adjunta un archivo privado a una respuesta en borrador
         * @description Requiere AE o GS, CSRF, revisión vigente y cuota configurada. Publica tras inspección antimalware y validación de formato; la carga exitosa incrementa la revisión de la evaluación.
         */
        post: operations["cargarEvidenciaRespuesta"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/evidencias/{evidenciaId}/archivo": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
                evidenciaId: components["parameters"]["ResponseEvidenceId"];
            };
            cookie?: never;
        };
        /**
         * Descarga el archivo privado de una evidencia
         * @description Requiere autorización vigente, huella íntegra y un veredicto limpio del motor actualizado para esa descarga.
         */
        get: operations["descargarEvidenciaRespuesta"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista implementaciones de la empresa
         * @description Requiere AE, GS o AU con autorización vigente sobre la empresa y el objeto.
         */
        get: operations["listarImplementacionesControl"];
        put?: never;
        /**
         * Registra una implementación propuesta
         * @description Requiere AE o GS de la empresa, sesión y CSRF.
         */
        post: operations["crearImplementacionControl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        /**
         * Consulta una implementación y su verificación vigente
         * @description Requiere AE, GS o AU con autorización vigente sobre la empresa y el objeto.
         */
        get: operations["consultarImplementacionControl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        /**
         * Lista versiones históricas de una implementación
         * @description Requiere AE, GS o AU con autorización vigente sobre la empresa y el objeto.
         */
        get: operations["listarVersionesImplementacionControl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/verificaciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
                versionId: components["parameters"]["ControlImplementationVersionId"];
            };
            cookie?: never;
        };
        /**
         * Lista las verificaciones históricas de una versión
         * @description Requiere AE, GS o AU con autorización vigente sobre la empresa y el objeto.
         */
        get: operations["listarVerificacionesControl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/iniciar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Inicia la aplicación de un control propuesto
         * @description Requiere AE o GS de la empresa, sesión y CSRF.
         */
        post: operations["iniciarImplementacionControl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/confirmar-aplicacion": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirma la aplicación con fecha y evidencia limpia
         * @description Requiere AE o GS de la empresa, sesión y CSRF.
         */
        post: operations["confirmarAplicacionControl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/cambiar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Abre una nueva versión de una implementación aplicada
         * @description Requiere AE o GS de la empresa, sesión y CSRF.
         */
        post: operations["cambiarImplementacionControl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/verificar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registra una prueba y la vigencia de su verificación
         * @description Requiere AE o GS de la empresa, sesión y CSRF.
         */
        post: operations["verificarImplementacionControl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/evidencias": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
                versionId: components["parameters"]["ControlImplementationVersionId"];
            };
            cookie?: never;
        };
        /**
         * Lista adjuntos de una versión fuera de cuarentena
         * @description Requiere AE, GS o AU con autorización vigente sobre la empresa y el objeto.
         */
        get: operations["listarEvidenciasControl"];
        put?: never;
        /**
         * Carga un adjunto limpio en la versión vigente
         * @description Requiere AE o GS de la empresa, sesión y CSRF.
         */
        post: operations["cargarEvidenciaControl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/evidencias/{evidenciaId}/archivo": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
                versionId: components["parameters"]["ControlImplementationVersionId"];
                evidenciaId: components["parameters"]["ResponseEvidenceId"];
            };
            cookie?: never;
        };
        /**
         * Descarga un adjunto de una versión previa o vigente
         * @description Requiere AE, GS o AU con autorización vigente sobre la empresa y el objeto.
         */
        get: operations["descargarEvidenciaControl"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/actividad": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Consulta el registro administrativo de actividad de la empresa
         * @description Requiere AE con acceso vigente a la empresa. Devuelve eventos administrativos y operativos ordenados del más reciente al más antiguo, con un desempate estable. Los filtros se combinan. Desde es inclusivo y hasta exclusivo. Para continuar la consulta, envíe el cursor de la página anterior junto con los mismos filtros. Los códigos válidos sin coincidencias devuelven una página vacía.
         */
        get: operations["consultarActividadEmpresarial"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/panel": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Consulta los agregados de evaluaciones, riesgos y acciones de la empresa
         * @description Requiere AE, GS o AU con acceso vigente a la empresa. Desde y hasta son inclusivos: filtran por fecha de evaluación, creación del riesgo en la zona de la empresa y fecha límite de la acción, respectivamente. Los demás filtros afectan únicamente a su sección. Solo la sección seleccionada en detalle devuelve elementos paginados. Una clave ausente en los conteos o una celda ausente de la matriz equivale a cero. Solo las valoraciones vigentes se incluyen en la matriz y en los filtros de nivel, probabilidad e impacto. Una acción vencida conserva su estado de flujo.
         */
        get: operations["consultarPanelEmpresa"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/reportes/basico": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Obtiene los datos del reporte operativo para impresión en el navegador
         * @description Requiere AE, GS o AU con acceso vigente a la empresa. Comparte el alcance y los filtros del panel. Desde y hasta son inclusivos y se aplican a la fecha de evaluación, el día empresarial de creación del riesgo y la fecha límite de la acción. Una evaluación indicada debe pertenecer a la empresa. Las secciones omitidas tienen valor nulo. Una sección sin coincidencias conserva su estructura con total cero y colecciones vacías.
         */
        get: operations["generarReporteBasicoEmpresa"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista riesgos con filtros opcionales de código y estado
         * @description Requiere AE, GS o AU con acceso vigente a la empresa.
         */
        get: operations["listarRiesgos"];
        put?: never;
        /**
         * Registra un riesgo identificado
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["registrarRiesgo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        /**
         * Consulta un riesgo y su valoración inherente
         * @description Requiere AE, GS o AU con acceso vigente a la empresa.
         */
        get: operations["consultarRiesgo"];
        /**
         * Actualiza datos del riesgo y señala cambios del contexto valorado
         * @description Requiere AE o GS con sesión y CSRF.
         */
        put: operations["editarRiesgo"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/transiciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Aplica una transición o registra el cierre del riesgo */
        post: operations["cambiarEstadoRiesgo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/aceptaciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        /** Consulta las decisiones de aceptación y su vigencia */
        get: operations["listarAceptacionesRiesgo"];
        put?: never;
        /** Aprueba la aceptación del riesgo con permiso AE */
        post: operations["aprobarAceptacionRiesgo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/riesgos-relacionados": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Registra un nuevo riesgo relacionado con un riesgo cerrado */
        post: operations["registrarRiesgoRelacionado"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/iniciar-analisis": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pasa el riesgo de identificado a en análisis
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["iniciarAnalisisRiesgo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-inherentes": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        /**
         * Lista el historial de valoraciones inherentes
         * @description Requiere AE, GS o AU con acceso vigente a la empresa.
         */
        get: operations["listarValoracionesInherentes"];
        put?: never;
        /**
         * Crea un borrador de valoración inherente
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["iniciarValoracionInherente"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-inherentes/{valoracionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                valoracionId: components["parameters"]["InherentAssessmentId"];
            };
            cookie?: never;
        };
        get?: never;
        /**
         * Actualiza las entradas del borrador inherente
         * @description Requiere AE o GS con sesión y CSRF.
         */
        put: operations["editarValoracionInherente"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-inherentes/{valoracionId}/confirmar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                valoracionId: components["parameters"]["InherentAssessmentId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirma entradas completas con la matriz versionada
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["confirmarValoracionInherente"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-residuales": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        /**
         * Consulta el historial con avisos de revisión
         * @description Requiere AE, GS o AU con acceso vigente a la empresa.
         */
        get: operations["listarValoracionesResiduales"];
        put?: never;
        /**
         * Crea un borrador a partir de la inherente vigente
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["iniciarValoracionResidual"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-residuales/{residualId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                residualId: components["parameters"]["ResidualId"];
            };
            cookie?: never;
        };
        get?: never;
        /**
         * Actualiza el borrador y lo vincula a la inherente vigente
         * @description Requiere AE o GS con sesión y CSRF.
         */
        put: operations["editarValoracionResidual"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-residuales/{residualId}/confirmar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                residualId: components["parameters"]["ResidualId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Calcula y conserva la valoración con sus verificaciones
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["confirmarValoracionResidual"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista las acciones visibles en la empresa activa
         * @description RA consulta únicamente acciones que mantiene asignadas.
         */
        get: operations["listarAcciones"];
        put?: never;
        /**
         * Crea y asigna una acción de mejora
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["crearAccion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        /**
         * Consulta una acción autorizada
         * @description RA accede solo mientras conserva la asignación vigente.
         */
        get: operations["consultarAccion"];
        /**
         * Ajusta la acción pendiente o en ejecución con motivo
         * @description Requiere AE o GS con sesión, CSRF y revisión esperada.
         */
        put: operations["editarAccion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/avances": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Registra avance por el responsable actual */
        post: operations["registrarAvanceAccion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/entregas": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Congela una entrega del responsable para revisión */
        post: operations["entregarAccion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/entregas/{entregaId}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
                entregaId: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Aprueba o devuelve la entrega mediante otro AE o GS */
        post: operations["decidirEntregaAccion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/historial": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        /** Consulta el historial operativo de una acción autorizada */
        get: operations["listarHistorialAccion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        /** Lista archivos privados de la acción */
        get: operations["listarEvidenciasAccion"];
        put?: never;
        /** Carga un archivo privado antes de enviar la entrega */
        post: operations["cargarEvidenciaAccion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias/{evidenciaId}/archivo": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
                evidenciaId: components["parameters"]["ActionEvidenceId"];
            };
            cookie?: never;
        };
        /** Descarga un archivo privado de la acción */
        get: operations["descargarEvidenciaAccion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancela una acción abierta con motivo
         * @description Requiere AE o GS con sesión, CSRF y revisión esperada.
         */
        post: operations["cancelarAccion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias-contexto/{evidenciaId}/archivo": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
                evidenciaId: components["parameters"]["ActionEvidenceId"];
            };
            cookie?: never;
        };
        /**
         * Descarga evidencia seleccionada para la acción
         * @description Requiere acceso actual a la acción y selección explícita de la evidencia.
         */
        get: operations["descargarEvidenciaContextoAccion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/implementaciones-control": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        /**
         * Lista las implementaciones vinculadas al riesgo
         * @description Requiere AE, GS o AU con acceso vigente a la empresa.
         */
        get: operations["listarControlesDeRiesgo"];
        put?: never;
        /**
         * Vincula una implementación local sin cambiar la valoración
         * @description Requiere AE o GS con sesión y CSRF.
         */
        post: operations["vincularControlARiesgo"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/procesos": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista los procesos de la empresa
         * @description Requiere AE, GS o AU de la empresa activa. El filtro responsableId permite revisar referencias antes de archivar.
         */
        get: operations["listarProcesos"];
        put?: never;
        /**
         * Crea un proceso activo
         * @description Requiere AE o GS de la empresa activa. El responsable opcional debe estar activo y pertenecer a la empresa.
         */
        post: operations["crearProceso"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/procesos/{procesoId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                procesoId: components["parameters"]["BusinessProcessId"];
            };
            cookie?: never;
        };
        /**
         * Consulta un proceso local
         * @description Requiere AE, GS o AU de la empresa activa.
         */
        get: operations["consultarProceso"];
        /**
         * Actualiza un proceso activo
         * @description Requiere AE o GS de la empresa activa. Exige revisión vigente y valida las nuevas referencias.
         */
        put: operations["editarProceso"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/procesos/{procesoId}/archivar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                procesoId: components["parameters"]["BusinessProcessId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Archiva un proceso local
         * @description Requiere AE o GS de la empresa activa. Exige revisión vigente y motivo.
         */
        post: operations["archivarProceso"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/responsables-negocio": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista responsables de negocio
         * @description Requiere AE, GS o AU de la empresa activa.
         */
        get: operations["listarResponsablesNegocio"];
        put?: never;
        /**
         * Crea un responsable de negocio activo
         * @description Requiere AE o GS de la empresa activa. El vínculo opcional a una membresía local no concede acceso.
         */
        post: operations["crearResponsableNegocio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/responsables-negocio/{responsableId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                responsableId: components["parameters"]["BusinessResponsibleId"];
            };
            cookie?: never;
        };
        /**
         * Consulta un responsable de negocio local
         * @description Requiere AE, GS o AU de la empresa activa.
         */
        get: operations["consultarResponsableNegocio"];
        /**
         * Actualiza un responsable de negocio activo
         * @description Requiere AE o GS de la empresa activa. Exige revisión vigente.
         */
        put: operations["editarResponsableNegocio"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/responsables-negocio/{responsableId}/archivar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                responsableId: components["parameters"]["BusinessResponsibleId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Archiva un responsable de negocio
         * @description Requiere AE o GS de la empresa activa. Conserva las referencias existentes e impide nuevas asignaciones.
         */
        post: operations["archivarResponsableNegocio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/configuracion": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Consulta datos básicos y zona horaria
         * @description Requiere AE, GS o AU de la empresa activa.
         */
        get: operations["consultarConfiguracion"];
        /**
         * Actualiza la configuración básica
         * @description Requiere AE y revisión vigente. La zona horaria rige la interpretación de fechas límite futuras. El historial conserva instantes absolutos.
         */
        put: operations["actualizarConfiguracion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/membresias": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista membresías de la empresa
         * @description Solo AE. Incluye membresías revocadas con sus últimos roles asignados.
         */
        get: operations["listarMembresias"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/responsables": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista responsables elegibles
         * @description Solo AE, GS o AU. Devuelve identificador de membresía y nombre visible de miembros activos elegibles.
         */
        get: operations["listarResponsables"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/membresias/{membresiaId}/roles": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                membresiaId: components["parameters"]["CompanyMember"];
            };
            cookie?: never;
        };
        get?: never;
        /**
         * Reemplaza el conjunto de roles empresariales
         * @description Solo AE. Requiere revisión vigente y conserva al menos un AE activo.
         */
        put: operations["actualizarRoles"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/membresias/{membresiaId}/revocar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                membresiaId: components["parameters"]["CompanyMember"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoca el acceso de una membresía
         * @description Solo AE. Requiere revisión vigente y conserva al menos un AE activo.
         */
        post: operations["revocarMembresia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/invitaciones": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /**
         * Lista invitaciones de la empresa
         * @description Solo AE. Incluye fechas y estado derivado. El comprobante queda fuera de la proyección.
         */
        get: operations["listarInvitaciones"];
        put?: never;
        /**
         * Emite y envía por correo una invitación de la empresa
         * @description Requiere AE de la empresa y la función de invitaciones habilitada.
         */
        post: operations["emitirInvitacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/empresas/{empresaId}/invitaciones/{invitacionId}/revocar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                invitacionId: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Revoca una invitación pendiente */
        post: operations["revocarInvitacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/invitaciones/aceptar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Acepta con la cuenta verificada del destinatario */
        post: operations["aceptarInvitacion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/invitaciones/alta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crea cuenta y membresía con una invitación vigente
         * @description La cookie y el token CSRF se obtienen con una sesión anónima. El enlace verifica el correo.
         */
        post: operations["aceptarInvitacionConAlta"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/plataforma/empresas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista metadatos de plataforma para AP */
        get: operations["listarEmpresasPlataforma"];
        put?: never;
        /** Reserva una empresa en preparación */
        post: operations["reservarEmpresa"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/plataforma/empresas/{empresaId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        /** Consulta metadatos y progreso técnico */
        get: operations["consultarEmpresaPlataforma"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/plataforma/empresas/{empresaId}/activar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Activa una empresa verificada y envía la primera invitación de AE */
        post: operations["activarEmpresa"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/plataforma/empresas/{empresaId}/invitacion-inicial/reemitir": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reemite el primer enlace antes de su aceptación */
        post: operations["reemitirInvitacionInicial"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/plataforma/empresas/{empresaId}/suspender": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Suspende el acceso empresarial */
        post: operations["suspenderEmpresa"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/plataforma/empresas/{empresaId}/reactivar": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reactiva una empresa suspendida con estructura compatible */
        post: operations["reactivarEmpresa"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        CreateEvaluationDraft: {
            nombre: string;
            /** Format: date */
            fechaEvaluacion: string;
            alcance: string;
            /** Format: uuid */
            responsableId: string;
            /** Format: uuid */
            versionCatalogoId: string;
            /** Format: uuid */
            versionMetodologiaId: string;
        };
        EvaluationDraft: {
            /** Format: uuid */
            evaluacionId: string;
            nombre: string;
            /** Format: date */
            fechaEvaluacion: string;
            alcance: string;
            /** Format: uuid */
            responsableId: string;
            /** Format: uuid */
            versionCatalogoId: string;
            /** Format: uuid */
            versionMetodologiaId: string;
            /** @enum {string} */
            estado: "BORRADOR" | "EN_REVISION" | "CERRADA";
            /** Format: int64 */
            revision: number;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /** Format: date-time */
            actualizadaEn: string;
            /** Format: uuid */
            evaluacionAnteriorId: string | null;
            motivoRevision: string | null;
            /** Format: uuid */
            cerradaPor: string | null;
            /** Format: date-time */
            cerradaEn: string | null;
        };
        EvaluationRevision: {
            /** Format: int64 */
            revisionEsperada: number;
        };
        ReviewEvaluation: {
            /** Format: int64 */
            revisionEsperada: number;
            /** @description Mapa de UUID de respuesta a UUID de adjunto. Una respuesta aplicable con nota positiva requiere un adjunto. En el cierre representa la selección revisada. */
            evidencias?: {
                [key: string]: string;
            };
        };
        ReturnEvaluation: {
            /** Format: int64 */
            revisionEsperada: number;
            motivo: string;
        };
        CorrectEvaluation: {
            /** Format: int64 */
            revisionEsperada: number;
            /** Format: uuid */
            responsableId: string;
            motivo: string;
        };
        EvaluationClosure: {
            /** Format: uuid */
            evaluacionId: string;
            /** Format: uuid */
            versionCatalogoId: string;
            /** Format: uuid */
            versionMetodologiaId: string;
            /** Format: uuid */
            cerradaPor: string;
            /** Format: date-time */
            cerradaEn: string;
            instantanea: {
                politica: string;
                resultados: components["schemas"]["EvaluationResults"];
                evidencias: {
                    [key: string]: {
                        /** Format: uuid */
                        evidenciaId: string;
                        /** Format: uuid */
                        evaluacionOrigenId: string;
                        /** Format: uuid */
                        respuestaOrigenId: string;
                        sha256: string;
                    };
                };
            };
        };
        EditEvaluationResponse: {
            /** Format: int64 */
            revisionEsperada: number;
            /** @enum {string} */
            aplicabilidad: "SIN_DECIDIR" | "APLICA" | "NO_APLICA";
            justificacionAplicabilidad?: string | null;
            /** @enum {integer|null} */
            calificacion?: 0 | 20 | 40 | 60 | 80 | 100 | null;
            fundamento?: string | null;
        };
        EvaluationAnswer: {
            /** @enum {string} */
            aplicabilidad: "SIN_DECIDIR" | "APLICA" | "NO_APLICA";
            justificacionAplicabilidad: string | null;
            /** @enum {integer|null} */
            calificacion: 0 | 20 | 40 | 60 | 80 | 100 | null;
            fundamento: string | null;
        };
        EvaluationResponse: {
            /** Format: uuid */
            respuestaId: string;
            /** Format: uuid */
            elementoId: string;
            /** Format: uuid */
            versionCatalogoId: string;
            /** @enum {string} */
            tipo: "CONTROL" | "CLAUSULA";
            codigo: string;
            titulo: string;
            grupo: string;
            respuesta: components["schemas"]["EvaluationAnswer"];
            /** Format: int64 */
            revisionEvaluacion: number;
            /** Format: uuid */
            actualizadaPor: string | null;
            /** Format: date-time */
            actualizadaEn: string | null;
            /** Format: uuid */
            respuestaAnteriorId: string | null;
            heredadaConfirmada: boolean;
        };
        EditEvaluationFinding: {
            /** Format: int64 */
            revisionEsperada: number;
            descripcionBrecha: string;
            recomendacion?: string | null;
        };
        EvaluationGap: {
            descripcionBrecha: string;
            recomendacion: string | null;
        };
        EvaluationFinding: {
            /** Format: uuid */
            hallazgoId: string;
            /** Format: uuid */
            respuestaId: string;
            hallazgo: components["schemas"]["EvaluationGap"];
            /** Format: int64 */
            revisionEvaluacion: number;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /** Format: uuid */
            actualizadaPor: string;
            /** Format: date-time */
            actualizadaEn: string;
        };
        EvaluationTotals: {
            /** Format: int64 */
            total: number;
            /** Format: int64 */
            aplicables: number;
            /** Format: int64 */
            evaluados: number;
            /** Format: int64 */
            pendientes: number;
            /** Format: int64 */
            sinDecidir: number;
            /** Format: int64 */
            noAplican: number;
            puntaje: number | null;
            avance: number | null;
            /** @enum {string} */
            estado: "SIN_ELEMENTOS" | "NO_APLICA" | "PENDIENTE" | "PROVISIONAL" | "CALCULADO";
        };
        EvaluationGroupResult: {
            grupo: string;
            resultado: components["schemas"]["EvaluationTotals"];
        };
        EvaluationResults: {
            /** Format: uuid */
            evaluacionId: string;
            /** Format: int64 */
            revision: number;
            controlesGlobal: components["schemas"]["EvaluationTotals"];
            dominios: components["schemas"]["EvaluationGroupResult"][];
            clausulas: components["schemas"]["EvaluationGroupResult"][];
        };
        EvaluationPage: {
            elementos: components["schemas"]["EvaluationDraft"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        EvaluationResponsePage: {
            elementos: components["schemas"]["EvaluationResponse"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        EvaluationFindingPage: {
            elementos: components["schemas"]["EvaluationFinding"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        RiskBase: {
            /** Format: uuid */
            activoPrincipalId: string;
            amenaza: string;
            vulnerabilidad: string;
            descripcion: string;
        };
        RiskDetails: {
            /** Format: uuid */
            activoPrincipalId: string;
            amenaza: string;
            vulnerabilidad: string;
            descripcion: string;
            /** Format: uuid */
            responsableId: string;
            /** @enum {string|null} */
            tratamientoPropuesto?: "REDUCIR" | "COMPARTIR" | "ACEPTAR" | "EVITAR" | null;
        };
        CreateRisk: {
            codigo: string;
            detalle: components["schemas"]["RiskDetails"];
        };
        EditRisk: {
            /** Format: int64 */
            revisionEsperada: number;
            detalle: components["schemas"]["RiskDetails"];
            motivo?: string | null;
        };
        CompanyActivityPage: {
            elementos: components["schemas"]["CompanyActivityEvent"][];
            /** @description Posición opaca para solicitar la siguiente página. Nulo al final. */
            siguienteCursor: string | null;
        };
        CompanyActivityEvent: {
            /** @description Identificador del evento en su origen. Use la pareja origen y eventoId para distinguir eventos. */
            eventoId: string;
            /** @enum {string} */
            origen: "ADMINISTRATIVA" | "OPERATIVA";
            /** Format: uuid */
            actorId: string;
            accion: string;
            tipoObjeto: string;
            /** Format: uuid */
            objetoId: string;
            resultado: string;
            motivo: string | null;
            /** Format: uuid */
            correlacionId: string;
            /** Format: date-time */
            registradoEn: string;
        };
        CompanyBasicReport: {
            /** Format: uuid */
            empresaId: string;
            empresa: string;
            zonaHoraria: string;
            /** Format: date-time */
            generadoEn: string;
            filtros: components["schemas"]["PanelFilters"];
            secciones: ("EVALUACIONES" | "RIESGOS" | "ACCIONES")[];
            evaluaciones: components["schemas"]["ReportEvaluations"] | null;
            riesgos: components["schemas"]["ReportRisks"] | null;
            acciones: components["schemas"]["PanelActions"] | null;
        };
        ReportEvaluations: {
            /** @description Agregados y, si se selecciona una evaluación que coincide con los filtros, su avance y pendientes. */
            datos: components["schemas"]["PanelEvaluations"];
            /** @description Versiones de metodología distintas de todas las evaluaciones filtradas. */
            metodologias: components["schemas"]["ReportMethodReference"][];
        };
        ReportRisks: {
            datos: components["schemas"]["PanelRisks"];
            /** @description Versiones distintas de las valoraciones asociadas a los riesgos filtrados, según la base seleccionada. */
            metodologias: components["schemas"]["ReportMethodReference"][];
        };
        ReportMethodReference: {
            /** Format: uuid */
            versionId: string;
            codigo: string;
            version: string;
            identificador: string;
            nombre: string;
        };
        CompanyPanel: {
            /** Format: uuid */
            empresaId: string;
            empresa: string;
            zonaHoraria: string;
            /** Format: date-time */
            generadoEn: string;
            filtros: components["schemas"]["PanelFilters"];
            pagina: number;
            tamano: number;
            /** @enum {string|null} */
            detalle: "EVALUACIONES" | "RIESGOS" | "ACCIONES" | null;
            evaluaciones: components["schemas"]["PanelEvaluations"];
            riesgos: components["schemas"]["PanelRisks"];
            acciones: components["schemas"]["PanelActions"];
        };
        PanelFilters: {
            /** Format: date */
            desde: string | null;
            /** Format: date */
            hasta: string | null;
            /** Format: uuid */
            evaluacionId: string | null;
            /** @enum {string|null} */
            estadoEvaluacion: "BORRADOR" | "EN_REVISION" | "CERRADA" | null;
            /** @enum {string|null} */
            estadoRiesgo: "IDENTIFICADO" | "EN_ANALISIS" | "EN_TRATAMIENTO" | "EN_SEGUIMIENTO" | "CERRADO" | null;
            /** @enum {string} */
            baseRiesgo: "INHERENTE" | "RESIDUAL";
            /** @enum {string|null} */
            situacionRiesgo: "VIGENTE" | "PENDIENTE" | "REVISION_REQUERIDA" | null;
            /** @enum {string|null} */
            nivelRiesgo: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO" | null;
            /** @enum {string|null} */
            probabilidad: "MUY_BAJA" | "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA" | null;
            /** @enum {string|null} */
            impacto: "LEVE" | "MENOR" | "MODERADO" | "MAYOR" | "CATASTROFICO" | null;
            /** @enum {string|null} */
            estadoAccion: "PENDIENTE" | "EN_EJECUCION" | "EN_REVISION" | "COMPLETADA" | "CANCELADA" | null;
            vencida: boolean | null;
        };
        PanelEvaluations: {
            /** Format: int64 */
            total: number;
            porEstado: {
                [key: string]: number;
            };
            elementos: components["schemas"]["PanelEvaluationRow"][];
        };
        PanelRisks: {
            /** Format: int64 */
            total: number;
            porEstado: {
                [key: string]: number;
            };
            porSituacion: {
                [key: string]: number;
            };
            porNivel: {
                [key: string]: number;
            };
            matriz: components["schemas"]["PanelRiskCell"][];
            elementos: components["schemas"]["PanelRiskRow"][];
        };
        PanelActions: {
            /** Format: int64 */
            total: number;
            porEstado: {
                [key: string]: number;
            };
            /** Format: int64 */
            vencidas: number;
            elementos: components["schemas"]["PanelActionRow"][];
        };
        PanelEvaluationRow: {
            /** Format: uuid */
            evaluacionId: string;
            nombre: string;
            /** Format: date */
            fecha: string;
            /** @enum {string} */
            estado: "BORRADOR" | "EN_REVISION" | "CERRADA";
            /** Format: uuid */
            versionCatalogoId: string;
            /** Format: uuid */
            versionMetodologiaId: string;
            /** Format: int64 */
            sinDecidir: number;
            /** Format: int64 */
            sinCalificacion: number;
            /** Format: int64 */
            heredadasPendientes: number;
            /** Format: int64 */
            controlesAplicables: number;
            /** Format: int64 */
            controlesEvaluados: number;
            /** Format: int64 */
            clausulasAplicables: number;
            /** Format: int64 */
            clausulasEvaluadas: number;
        };
        PanelRiskCell: {
            /** @enum {string} */
            probabilidad: "MUY_BAJA" | "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA";
            /** @enum {string} */
            impacto: "LEVE" | "MENOR" | "MODERADO" | "MAYOR" | "CATASTROFICO";
            /** @enum {string} */
            nivel: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO";
            /** Format: int64 */
            total: number;
        };
        PanelRiskRow: {
            /** Format: uuid */
            riesgoId: string;
            codigo: string;
            /** @enum {string} */
            estado: "IDENTIFICADO" | "EN_ANALISIS" | "EN_TRATAMIENTO" | "EN_SEGUIMIENTO" | "CERRADO";
            /** @enum {string} */
            situacion: "VIGENTE" | "PENDIENTE" | "REVISION_REQUERIDA";
            /** Format: uuid */
            valoracionId: string | null;
            /** Format: uuid */
            versionMetodologiaId: string | null;
            /** @enum {string|null} */
            nivel: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO" | null;
            /** @enum {string|null} */
            probabilidad: "MUY_BAJA" | "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA" | null;
            /** @enum {string|null} */
            impacto: "LEVE" | "MENOR" | "MODERADO" | "MAYOR" | "CATASTROFICO" | null;
        };
        PanelActionRow: {
            /** Format: uuid */
            accionId: string;
            codigo: string;
            /** @enum {string} */
            estado: "PENDIENTE" | "EN_EJECUCION" | "EN_REVISION" | "COMPLETADA" | "CANCELADA";
            /** Format: date */
            fechaLimite: string;
            vencida: boolean;
        };
        RiskTransition: {
            /** Format: int64 */
            revisionEsperada: number;
            /** @enum {string} */
            destino: "EN_ANALISIS" | "EN_TRATAMIENTO" | "EN_SEGUIMIENTO" | "CERRADO";
            motivo: string;
            accionesCanceladas?: {
                [key: string]: string;
            } | null;
        };
        ApproveRiskAcceptance: {
            /** Format: int64 */
            revisionEsperada: number;
            justificacion: string;
            /** Format: date */
            fechaProximaRevision: string;
        };
        RiskAcceptance: {
            /** Format: uuid */
            aceptacionId: string;
            /** Format: uuid */
            riesgoId: string;
            /** Format: uuid */
            inherenteId: string;
            /** Format: uuid */
            residualId: string;
            justificacion: string;
            /** Format: date */
            fechaProximaRevision: string;
            /** Format: uuid */
            aprobadaPor: string;
            /** Format: date-time */
            aprobadaEn: string;
            /** @enum {string} */
            estado: "VIGENTE" | "REVISION_PENDIENTE" | "HISTORICA";
            /** Format: int64 */
            revisionRiesgo: number;
        };
        RiskAcceptancePage: {
            elementos: components["schemas"]["RiskAcceptance"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        RiskClosure: {
            justificacion: string;
            /** Format: uuid */
            cerradaPor: string;
            /** Format: date-time */
            cerradaEn: string;
            /** Format: uuid */
            inherenteId: string;
            /** Format: uuid */
            residualId: string;
            /** Format: uuid */
            aceptacionId: string | null;
            accionesCanceladas: {
                [key: string]: string;
            };
        };
        Risk: {
            /** Format: uuid */
            riesgoId: string;
            codigo: string;
            detalle: components["schemas"]["RiskDetails"];
            /** @enum {string} */
            estado: "IDENTIFICADO" | "EN_ANALISIS" | "EN_TRATAMIENTO" | "EN_SEGUIMIENTO" | "CERRADO";
            /** Format: int64 */
            revision: number;
            /** Format: uuid */
            inherenteVigenteId: string | null;
            /** @enum {string|null} */
            nivelInherente: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO" | null;
            requiereRevision: boolean;
            motivoRevision: string | null;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /** Format: uuid */
            riesgoRelacionadoId: string | null;
            cierre: components["schemas"]["RiskClosure"] | null;
        };
        InherentInputs: {
            /** @enum {string|null} */
            probabilidad?: "MUY_BAJA" | "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA" | null;
            /** @enum {string|null} */
            impacto?: "LEVE" | "MENOR" | "MODERADO" | "MAYOR" | "CATASTROFICO" | null;
            periodoReferencia?: string | null;
            fundamento?: string | null;
            supuestos?: string | null;
            fuente?: string | null;
        };
        CreateInherentAssessment: {
            /** Format: int64 */
            revisionEsperada: number;
            entradas: components["schemas"]["InherentInputs"];
            motivoReevaluacion?: string | null;
        };
        EditInherentAssessment: {
            /** Format: int64 */
            revisionEsperada: number;
            entradas: components["schemas"]["InherentInputs"];
        };
        InherentAssessment: {
            /** Format: uuid */
            valoracionId: string;
            /** Format: uuid */
            riesgoId: string;
            /** Format: uuid */
            versionMetodologiaId: string;
            /** Format: uuid */
            valoracionAnteriorId: string | null;
            motivoReevaluacion: string | null;
            /** Format: int64 */
            revisionRiesgo: number;
            entradas: components["schemas"]["InherentInputs"];
            /** @enum {string} */
            estadoResultado: "BORRADOR" | "CONFIRMADA";
            /** @enum {string|null} */
            nivel: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO" | null;
            probabilidadIndice: number | null;
            impactoIndice: number | null;
            requiereRevision: boolean;
            base: components["schemas"]["RiskBase"] | null;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /** Format: uuid */
            confirmadaPor: string | null;
            /** Format: date-time */
            confirmadaEn: string | null;
        };
        ResidualDraft: {
            entradas: components["schemas"]["InherentInputs"];
            sinMitigacion?: boolean | null;
            justificacionSinMitigacion?: string | null;
            verificaciones?: string[] | null;
        };
        CreateResidualAssessment: {
            /** Format: int64 */
            revisionEsperada: number;
            datos: components["schemas"]["ResidualDraft"];
            motivoReevaluacion?: string | null;
        };
        EditResidualAssessment: {
            /** Format: int64 */
            revisionEsperada: number;
            datos: components["schemas"]["ResidualDraft"];
        };
        ResidualProof: {
            /** Format: uuid */
            implementacionId: string;
            /** Format: uuid */
            versionId: string;
            /** Format: uuid */
            verificacionId: string;
            /** Format: uuid */
            evidenciaAplicacionId: string;
            /** Format: uuid */
            evidenciaVerificacionId: string;
            /** Format: date-time */
            venceEn: string;
        };
        ResidualNotice: {
            /** @enum {string} */
            causa: "CONTEXTO_CAMBIADO" | "INHERENTE_SUSTITUIDA" | "VERSION_CONTROL_CAMBIADA" | "VERIFICACION_SUSTITUIDA" | "EVIDENCIA_BLOQUEADA" | "CONTROL_VINCULADO" | "VERIFICACION_VENCIDA";
            /** Format: uuid */
            referenciaId: string;
            /** Format: date-time */
            detectadoEn: string;
            /** Format: date-time */
            resueltoEn: string | null;
        };
        ResidualAssessment: {
            /** Format: uuid */
            residualId: string;
            /** Format: uuid */
            riesgoId: string;
            /** Format: uuid */
            inherenteId: string;
            /** Format: uuid */
            versionMetodologiaId: string;
            /** Format: uuid */
            anteriorId: string | null;
            motivoReevaluacion: string | null;
            /** Format: int64 */
            revisionRiesgo: number;
            datos: components["schemas"]["ResidualDraft"];
            /** @enum {string} */
            estadoResultado: "BORRADOR" | "CONFIRMADA";
            /** @enum {string|null} */
            nivel: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO" | null;
            probabilidadIndice: number | null;
            impactoIndice: number | null;
            vigente: boolean;
            requiereRevision: boolean;
            pruebas: components["schemas"]["ResidualProof"][];
            avisos: components["schemas"]["ResidualNotice"][];
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /** Format: uuid */
            confirmadaPor: string | null;
            /** Format: date-time */
            confirmadaEn: string | null;
        };
        ResidualPage: {
            elementos: components["schemas"]["ResidualAssessment"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ActionContextEvidence: {
            /** Format: uuid */
            evidenciaId: string;
            motivoContexto: string;
        };
        ActionData: {
            /** Format: uuid */
            riesgoId?: string | null;
            /** Format: uuid */
            hallazgoId?: string | null;
            descripcion: string;
            resultadoEsperado: string;
            /** Format: uuid */
            responsableMembresiaId: string;
            /** Format: date */
            fechaLimite: string;
            evidenciaRequerida: boolean;
            descripcionEvidencia: string;
            justificacionSinEvidencia?: string | null;
            resumenContextoRa: string;
            evidenciasContexto?: components["schemas"]["ActionContextEvidence"][] | null;
        };
        CreateAction: {
            datos: components["schemas"]["ActionData"];
        };
        EditAction: {
            /** Format: int64 */
            revisionEsperada: number;
            datos: components["schemas"]["ActionData"];
            motivo: string;
        };
        ActionCancellation: {
            /** Format: int64 */
            revisionEsperada: number;
            motivo: string;
        };
        ActionEvidenceUpload: {
            evidencia: components["schemas"]["ResponseEvidence"];
            /** Format: int64 */
            revisionAccion: number;
        };
        ActionProgress: {
            /** Format: int64 */
            revisionEsperada: number;
            comentario: string;
        };
        ActionDelivery: {
            /** Format: int64 */
            revisionEsperada: number;
            comentario: string;
            /** Format: uuid */
            evidenciaId?: string | null;
        };
        ActionDecision: {
            /** Format: int64 */
            revisionEsperada: number;
            /** @enum {string} */
            decision: "APROBAR" | "DEVOLVER";
            motivo: string;
        };
        ActionEvent: {
            /** Format: uuid */
            eventoId: string;
            /** @enum {string} */
            tipo: "INICIADA" | "AVANCE" | "SOLICITUD_REVISION" | "APROBADA" | "DEVUELTA";
            comentario?: string | null;
            /** Format: uuid */
            autorId: string;
            /** Format: uuid */
            responsableMembresiaId: string;
            /** Format: uuid */
            entregaId?: string | null;
            /** Format: uuid */
            evidenciaId?: string | null;
            /** Format: date-time */
            creadaEn: string;
        };
        ImprovementAction: {
            /** Format: uuid */
            accionId: string;
            codigo: string;
            /** Format: uuid */
            riesgoId: string | null;
            /** Format: uuid */
            hallazgoId: string | null;
            nombreActivo: string | null;
            descripcion: string;
            resultadoEsperado: string;
            /** Format: uuid */
            responsableMembresiaId: string;
            /** Format: date */
            fechaLimite: string;
            /** @enum {string} */
            estado: "PENDIENTE" | "EN_EJECUCION" | "EN_REVISION" | "COMPLETADA" | "CANCELADA";
            vencida: boolean;
            evidenciaRequerida: boolean;
            descripcionEvidencia: string;
            justificacionSinEvidencia: string | null;
            resumenContextoRa: string;
            evidenciasContexto: components["schemas"]["ActionContextEvidence"][];
            /** Format: int64 */
            revision: number;
            motivoCambio: string | null;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /** Format: uuid */
            entregaVigenteId?: string | null;
            /** Format: date-time */
            finalizadaEn?: string | null;
        };
        ActionPage: {
            elementos: components["schemas"]["ImprovementAction"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        CreateRiskControlLink: {
            /** Format: int64 */
            revisionEsperada: number;
            /** Format: uuid */
            implementacionId: string;
            /** @enum {string} */
            efectoEsperado: "PROBABILIDAD" | "IMPACTO" | "AMBOS";
            justificacion: string;
        };
        RiskControlLink: {
            /** Format: uuid */
            vinculoId: string;
            /** Format: uuid */
            implementacionId: string;
            /** @enum {string} */
            efectoEsperado: "PROBABILIDAD" | "IMPACTO" | "AMBOS";
            justificacion: string;
            /** Format: int64 */
            revisionRiesgo: number;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
        };
        RiskPage: {
            elementos: components["schemas"]["Risk"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        InherentAssessmentPage: {
            elementos: components["schemas"]["InherentAssessment"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        RiskControlLinkPage: {
            elementos: components["schemas"]["RiskControlLink"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ControlDetails: {
            nombre: string;
            descripcion: string;
            alcance: string;
            trabajo: string;
            /** Format: uuid */
            responsableId: string;
            /** @enum {string|null} */
            tipo?: "PREVENTIVO" | "DETECTIVO" | "CORRECTIVO" | null;
            /** @enum {string|null} */
            modo?: "MANUAL" | "AUTOMATICO" | null;
        };
        CreateControlImplementation: {
            /** Format: uuid */
            versionCatalogoId: string;
            /** Format: uuid */
            elementoId: string;
            detalle: components["schemas"]["ControlDetails"];
        };
        ApplyControlImplementation: {
            /** Format: int64 */
            revisionEsperada: number;
            /** Format: date */
            fechaAplicacion: string;
            /** Format: uuid */
            evidenciaId: string;
        };
        ChangeControlImplementation: {
            /** Format: int64 */
            revisionEsperada: number;
            detalle: components["schemas"]["ControlDetails"];
            motivo: string;
        };
        VerifyControlImplementation: {
            /** Format: int64 */
            revisionEsperada: number;
            prueba: string;
            fundamento: string;
            criteriosEvaluados: number;
            criteriosCumplidos: number;
            /** Format: date */
            proximaRevision: string;
            /** Format: uuid */
            evidenciaId: string;
        };
        ControlApplication: {
            /** Format: date */
            fechaAplicacion: string;
            /** Format: uuid */
            evidenciaId: string;
            /** Format: uuid */
            registradaPor: string;
            /** Format: date-time */
            registradaEn: string;
        };
        ControlVersion: {
            /** Format: uuid */
            versionId: string;
            numero: number;
            detalle: components["schemas"]["ControlDetails"];
            motivoCambio: string | null;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            aplicacion: components["schemas"]["ControlApplication"] | null;
        };
        ControlImplementation: {
            /** Format: uuid */
            implementacionId: string;
            /** Format: uuid */
            versionCatalogoId: string;
            /** Format: uuid */
            elementoId: string;
            /** @enum {string} */
            estado: "PROPUESTO" | "EN_IMPLEMENTACION" | "IMPLEMENTADO";
            /** Format: int64 */
            revision: number;
            versionActual: components["schemas"]["ControlVersion"];
            /** @enum {string} */
            resultadoVigente: "SIN_VERIFICAR" | "EFECTIVO" | "PARCIALMENTE_EFECTIVO" | "NO_EFECTIVO";
            /** Format: uuid */
            ultimaVerificacionId: string | null;
            /** @enum {string|null} */
            causaSinVigencia: "VENCIDA" | "EVIDENCIA_BLOQUEADA" | null;
        };
        ControlVerification: {
            /** Format: uuid */
            verificacionId: string;
            /** Format: uuid */
            versionId: string;
            /** Format: int64 */
            revisionImplementacion: number;
            /** @enum {string} */
            resultado: "SIN_VERIFICAR" | "EFECTIVO" | "PARCIALMENTE_EFECTIVO" | "NO_EFECTIVO";
            prueba: string;
            fundamento: string;
            criteriosEvaluados: number;
            criteriosCumplidos: number;
            /** Format: date */
            proximaRevision: string;
            /** Format: uuid */
            evidenciaId: string;
            /** Format: uuid */
            verificadaPor: string;
            /** Format: date-time */
            verificadaEn: string;
        };
        ControlEvidenceUpload: {
            evidencia: components["schemas"]["ResponseEvidence"];
            /** Format: int64 */
            revisionImplementacion: number;
        };
        ControlImplementationPage: {
            elementos: components["schemas"]["ControlImplementation"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ControlVersionPage: {
            elementos: components["schemas"]["ControlVersion"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ControlVerificationPage: {
            elementos: components["schemas"]["ControlVerification"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ResponseEvidence: {
            /** Format: uuid */
            evidenciaId: string;
            nombreOriginal: string;
            /** @enum {string} */
            tipoDetectado: "application/pdf" | "image/png" | "image/jpeg";
            tamanoBytes: number;
            descripcion: string | null;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /**
             * @description Último estado registrado; la descarga siempre realiza una inspección nueva.
             * @enum {string}
             */
            estadoInspeccion: "PENDIENTE" | "LIMPIA" | "ERROR";
        };
        ResponseEvidenceUpload: {
            evidencia: components["schemas"]["ResponseEvidence"];
            /** Format: int64 */
            revisionEvaluacion: number;
        };
        ResponseEvidencePage: {
            elementos: components["schemas"]["ResponseEvidence"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ReferenceCatalogVersion: {
            /** Format: uuid */
            versionId: string;
            codigo: string;
            version: string;
            nombre: string;
            origen: string;
            huellaOrigen: string | null;
            /** Format: date-time */
            publicadaEn: string;
            disponibleNuevos: boolean;
        };
        ReferenceElementSummary: {
            /** Format: uuid */
            elementoId: string;
            /** Format: uuid */
            versionId: string;
            /** @enum {string} */
            tipo: "CONTROL" | "CLAUSULA";
            codigo: string;
            titulo: string;
            grupo: string;
            referenciaOrigen: string;
        };
        ReferenceElement: {
            /** Format: uuid */
            elementoId: string;
            /** Format: uuid */
            versionId: string;
            /** @enum {string} */
            tipo: "CONTROL" | "CLAUSULA";
            codigo: string;
            titulo: string;
            grupo: string;
            referenciaOrigen: string;
            descripcion: string;
        };
        ReferenceMethodVersion: {
            /** Format: uuid */
            versionId: string;
            codigo: string;
            version: string;
            identificador: string;
            nombre: string;
            fundamento: string;
            origen: string;
            reglas: {
                [key: string]: unknown;
            };
            /** Format: date */
            aprobadaEn: string;
            aprobadaPor: string;
            disponibleNuevos: boolean;
        };
        ReferenceCatalogPage: {
            elementos: components["schemas"]["ReferenceCatalogVersion"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ReferenceElementPage: {
            elementos: components["schemas"]["ReferenceElementSummary"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ReferenceMethodPage: {
            elementos: components["schemas"]["ReferenceMethodVersion"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        AssetValuationEntries: {
            /** @enum {integer|null} */
            confidencialidad?: 1 | 3 | 5 | null;
            /** @enum {integer|null} */
            integridad?: 1 | 3 | 5 | null;
            /** @enum {integer|null} */
            disponibilidad?: 1 | 3 | 5 | null;
            fundamento?: string | null;
            contieneDatosPersonales?: boolean | null;
            contieneDatosMenores?: boolean | null;
            tiposDatosPersonales?: ("IDENTIFICACION" | "CONTACTO" | "FINANCIEROS" | "SALUD" | "BIOMETRICOS" | "OTROS")[] | null;
            finalidadTratamiento?: string | null;
            /** @enum {string|null} */
            autorizacionTratamiento?: "SI" | "NO" | "NO_APLICA" | null;
            justificacionNoAplica?: string | null;
        };
        StartAssetValuationInput: {
            entradas: components["schemas"]["AssetValuationEntries"];
            motivoRevision?: string | null;
        };
        EditAssetValuationInput: {
            entradas: components["schemas"]["AssetValuationEntries"];
            /** Format: int64 */
            revisionEsperada: number;
        };
        ConfirmAssetValuationInput: {
            /** Format: int64 */
            revisionEsperada: number;
        };
        AssetValuation: {
            /** Format: uuid */
            valoracionId: string;
            /** Format: uuid */
            activoId: string;
            numero: number;
            /** Format: int64 */
            revision: number;
            /** @constant */
            metodologia: "CID_MAX_V1";
            /** @constant */
            versionTiposDatos: "DATOS_PERSONALES_V1";
            /** @enum {string} */
            estado: "PENDIENTE" | "COMPLETO";
            vigente: boolean;
            /** @enum {integer|null} */
            criticidad: 1 | 3 | 5 | null;
            /** @enum {string|null} */
            nivel: "BAJA" | "MEDIA" | "ALTA" | null;
            entradas: components["schemas"]["AssetValuationEntries"];
            motivoRevision: string | null;
            /** Format: uuid */
            creadaPor: string;
            /** Format: date-time */
            creadaEn: string;
            /** Format: uuid */
            actualizadaPor: string;
            /** Format: date-time */
            actualizadaEn: string;
            /** Format: uuid */
            confirmadaPor: string | null;
            /** Format: date-time */
            confirmadaEn: string | null;
        };
        AssetValuationPage: {
            elementos: components["schemas"]["AssetValuation"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        CreateInventoryAsset: {
            codigo: string;
            nombre: string;
            descripcion: string;
            /** @enum {string} */
            tipo: "INFORMACION" | "HARDWARE" | "SOFTWARE" | "SERVICIO" | "RECURSO_HUMANO" | "INSTALACION" | "RED";
            /** Format: uuid */
            procesoId: string;
            /** Format: uuid */
            propietarioId: string;
            /** Format: uuid */
            custodioId?: string | null;
            ubicacion?: string | null;
        };
        EditInventoryAsset: {
            /** Format: int64 */
            revisionEsperada: number;
            nombre: string;
            descripcion: string;
            /** @enum {string} */
            tipo: "INFORMACION" | "HARDWARE" | "SOFTWARE" | "SERVICIO" | "RECURSO_HUMANO" | "INSTALACION" | "RED";
            /** Format: uuid */
            procesoId: string;
            /** Format: uuid */
            propietarioId: string;
            /** Format: uuid */
            custodioId?: string | null;
            ubicacion?: string | null;
        };
        InventoryAsset: {
            /** Format: uuid */
            activoId: string;
            codigo: string;
            nombre: string;
            descripcion: string;
            /** @enum {string} */
            tipo: "INFORMACION" | "HARDWARE" | "SOFTWARE" | "SERVICIO" | "RECURSO_HUMANO" | "INSTALACION" | "RED";
            /** Format: uuid */
            procesoId: string;
            /** Format: uuid */
            propietarioId: string;
            /** Format: uuid */
            custodioId: string | null;
            ubicacion: string | null;
            /** @enum {string} */
            estado: "ACTIVO" | "ARCHIVADO";
            /** Format: int64 */
            revision: number;
            /** @enum {string} */
            estadoClasificacion: "PENDIENTE" | "COMPLETO";
        };
        ArchiveInventoryAsset: {
            /** Format: int64 */
            revisionEsperada: number;
            motivo: string;
        };
        RestoreInventoryAsset: {
            /** Format: int64 */
            revisionEsperada: number;
            motivo: string;
            referencias?: components["schemas"]["InventoryReferences"];
        };
        InventoryReferences: {
            /** Format: uuid */
            procesoId: string;
            /** Format: uuid */
            propietarioId: string;
            /** Format: uuid */
            custodioId?: string | null;
        } | null;
        InventoryReferenceChange: {
            anteriores: components["schemas"]["InventoryReferences"];
            nuevas: components["schemas"]["InventoryReferences"];
        } | null;
        InventoryHistoryEntry: {
            /** Format: uuid */
            actorId: string;
            /** @enum {string} */
            accion: "CREAR" | "EDITAR" | "ARCHIVAR" | "RESTAURAR";
            /** @enum {string|null} */
            estadoAnterior: "ACTIVO" | "ARCHIVADO" | null;
            /** @enum {string} */
            estadoNuevo: "ACTIVO" | "ARCHIVADO";
            motivo: string | null;
            /** Format: uuid */
            correlationId: string;
            /** Format: date-time */
            registradoEn: string;
            camposModificados: string[];
            referencias: components["schemas"]["InventoryReferenceChange"];
        };
        AssetInventoryPage: {
            elementos: components["schemas"]["InventoryAsset"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        InventoryHistoryPage: {
            elementos: components["schemas"]["InventoryHistoryEntry"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        BusinessProcess: {
            /** Format: uuid */
            procesoId: string;
            nombre: string;
            descripcion: string | null;
            /** Format: uuid */
            responsableId: string | null;
            /** @enum {string} */
            estado: "ACTIVO" | "ARCHIVADO";
            /** Format: int64 */
            revision: number;
        };
        NewBusinessProcess: {
            nombre: string;
            descripcion?: string | null;
            /** Format: uuid */
            responsableId?: string | null;
        };
        EditBusinessProcess: {
            nombre: string;
            descripcion?: string | null;
            /** Format: uuid */
            responsableId?: string | null;
            /** Format: int64 */
            revisionEsperada: number;
        };
        BusinessResponsible: {
            /** Format: uuid */
            responsableId: string;
            nombre: string;
            /** @enum {string} */
            tipo: "PERSONA" | "CARGO" | "AREA";
            /** Format: uuid */
            membresiaId: string | null;
            /** @enum {string} */
            estado: "ACTIVO" | "ARCHIVADO";
            /** Format: int64 */
            revision: number;
        };
        NewBusinessResponsible: {
            nombre: string;
            /** @enum {string} */
            tipo: "PERSONA" | "CARGO" | "AREA";
            /** Format: uuid */
            membresiaId?: string | null;
        };
        EditBusinessResponsible: {
            nombre: string;
            /** @enum {string} */
            tipo: "PERSONA" | "CARGO" | "AREA";
            /** Format: uuid */
            membresiaId?: string | null;
            /** Format: int64 */
            revisionEsperada: number;
        };
        ArchiveCatalogRecord: {
            /** Format: int64 */
            revisionEsperada: number;
            motivo: string;
        };
        BusinessProcessPage: {
            elementos: components["schemas"]["BusinessProcess"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        BusinessResponsiblePage: {
            elementos: components["schemas"]["BusinessResponsible"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        RecoveryRequest: {
            /** Format: email */
            correo: string;
        };
        RecoveryConfirmation: {
            token: string;
            /**
             * Format: password
             * @description Debe cumplir la politica local y no estar en la lista de contrasenas expuestas.
             */
            contrasena: string;
        };
        CompanyConfiguration: {
            nombre: string;
            descripcion: string | null;
            zonaHoraria: string;
            /** Format: int64 */
            revision: number;
        };
        UpdateCompanyConfiguration: {
            nombre: string;
            descripcion?: string | null;
            /** @description Zona IANA reconocida por el servidor */
            zonaHoraria: string;
            /** Format: int64 */
            revisionEsperada: number;
        };
        CompanyMember: {
            /** Format: uuid */
            membresiaId: string;
            nombreVisible: string;
            /** Format: email */
            correo: string;
            roles: components["schemas"]["OfferedRoles"];
            /** @enum {string} */
            estado: "ACTIVA" | "REVOCADA";
            /** Format: date-time */
            revocadaEn: string | null;
            /** Format: int64 */
            revision: number;
        };
        CompanyResponsible: {
            /** Format: uuid */
            membresiaId: string;
            nombreVisible: string;
        };
        CompanyInvitation: {
            /** Format: uuid */
            invitacionId: string;
            /** Format: email */
            correo: string;
            roles: components["schemas"]["OfferedRoles"];
            /** @enum {string} */
            estado: "PENDIENTE" | "ACEPTADA" | "REVOCADA" | "VENCIDA";
            /** Format: date-time */
            creadaEn: string;
            /** Format: date-time */
            venceEn: string;
            /** Format: date-time */
            aceptadaEn: string | null;
            /** Format: date-time */
            revocadaEn: string | null;
        };
        UpdateCompanyMemberRoles: {
            /** Format: int64 */
            revisionEsperada: number;
            motivo: string;
            roles: components["schemas"]["OfferedRoles"];
        };
        RevokeCompanyMember: {
            /** Format: int64 */
            revisionEsperada: number;
            motivo: string;
        };
        CompanyMemberPage: {
            elementos: components["schemas"]["CompanyMember"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        CompanyResponsiblePage: {
            elementos: components["schemas"]["CompanyResponsible"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        CompanyInvitationPage: {
            elementos: components["schemas"]["CompanyInvitation"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        ReserveCompany: {
            nombre: string;
            descripcion?: string | null;
            /** @description Zona IANA reconocida por el servidor */
            zonaHoraria: string;
            /** Format: email */
            contactoInicial: string;
        };
        PlatformCompany: {
            /** Format: uuid */
            empresaId: string;
            nombre: string;
            descripcion: string | null;
            zonaHoraria: string;
            /** @enum {string} */
            estado: "EN_PREPARACION" | "ERROR_APROVISIONAMIENTO" | "ACTIVA" | "SUSPENDIDA";
            versionEstructura: string | null;
            /** Format: int64 */
            revision: number;
            pasoPreparacion: string | null;
            resultadoPreparacion: string | null;
            /** Format: uuid */
            referenciaFallo: string | null;
            motivoEstado: string | null;
            /** Format: uuid */
            invitacionInicialId: string | null;
        };
        PlatformCompanyPage: {
            empresas: components["schemas"]["PlatformCompany"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        OfferedRoles: ("AE" | "GS" | "RA" | "AU")[];
        IssueInvitation: {
            /** Format: email */
            correo: string;
            roles: components["schemas"]["OfferedRoles"];
        };
        IssuedInvitation: {
            /** Format: uuid */
            invitacionId: string;
            /** Format: date-time */
            venceEn: string;
        };
        InvitationToken: string;
        AcceptInvitation: {
            token: components["schemas"]["InvitationToken"];
        };
        EnrollInvitation: {
            token: components["schemas"]["InvitationToken"];
            nombreVisible: string;
            /**
             * Format: password
             * @description Mínimo de 15 caracteres Unicode; el entorno puede exigir más. Se rechazan valores presentes en la lista local de contraseñas expuestas.
             */
            contrasena: string;
        };
        AcceptedInvitation: {
            /** Format: uuid */
            empresaId: string;
            /** Format: uuid */
            membresiaId: string;
            /** Format: uuid */
            usuarioId: string;
            roles: components["schemas"]["OfferedRoles"];
        };
        CompanyMembership: {
            /** Format: uuid */
            empresaId: string;
            nombre: string;
            zonaHoraria: string;
            roles: ("AE" | "GS" | "RA" | "AU")[];
        };
        CompanyPage: {
            empresas: components["schemas"]["CompanyMembership"][];
            pagina: number;
            tamano: number;
            hayMas: boolean;
        };
        CsrfView: {
            /** @constant */
            headerName: "X-CSRF-TOKEN";
            token: string;
        };
        LoginInput: {
            /** Format: email */
            correo: string;
            /** Format: password */
            contrasena: string;
        };
        SessionView: {
            /** Format: uuid */
            usuarioId: string;
            nombreVisible: string;
            /** Format: date-time */
            expiraEn: string;
        };
        ApiVersion: {
            /** @constant */
            version: "v1";
        };
        ApiProblem: {
            /** @constant */
            type: "about:blank";
            title: string;
            status: number;
            detail: string;
            /**
             * Format: uri
             * @description URN con el UUID de correlación
             */
            instance: string;
            /** @description Código estable para consumidores */
            code: string;
            /** Format: uuid */
            correlationId: string;
            fields: components["schemas"]["ApiFieldProblem"][];
        };
        ApiFieldProblem: {
            field: string;
            code: string;
            message: string;
        };
    };
    responses: {
        /** @description Metadatos de plataforma de la empresa */
        PlatformCompany: {
            headers: {
                "X-Correlation-Id": components["headers"]["CorrelationId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PlatformCompany"];
            };
        };
        /** @description Membresía creada con los roles de la invitación */
        AcceptedInvitation: {
            headers: {
                "X-Correlation-Id": components["headers"]["CorrelationId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["AcceptedInvitation"];
            };
        };
        /** @description Identidad y vencimiento absoluto de la sesión vigente */
        CurrentSession: {
            headers: {
                "X-Correlation-Id": components["headers"]["CorrelationId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["SessionView"];
            };
        };
        /** @description Error HTTP con código estable y correlación */
        Problem: {
            headers: {
                "X-Correlation-Id": components["headers"]["CorrelationId"];
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ApiProblem"];
            };
        };
    };
    parameters: {
        EvaluationId: string;
        EvaluationResponseId: string;
        EvaluationFindingId: string;
        ControlImplementationId: string;
        ControlImplementationVersionId: string;
        RiskId: string;
        InherentAssessmentId: string;
        ActionId: string;
        ActionEvidenceId: string;
        ResidualId: string;
        ResponseEvidenceId: string;
        ReferenceVersionId: string;
        ReferenceElementId: string;
        AvailableForNewUses: boolean;
        ReferenceCode: string;
        ReferenceGroup: string;
        ReferenceType: "CONTROL" | "CLAUSULA";
        ReferenceText: string;
        AssetValuationId: string;
        InventoryAssetId: string;
        InventorySearch: string;
        InventoryTypeFilter: "INFORMACION" | "HARDWARE" | "SOFTWARE" | "SERVICIO" | "RECURSO_HUMANO" | "INSTALACION" | "RED";
        InventoryProcessFilter: string;
        BusinessProcessId: string;
        BusinessResponsibleId: string;
        CatalogState: "ACTIVO" | "ARCHIVADO";
        ResponsibleFilter: string;
        CompanyMember: string;
        CompanyPage: number;
        CompanyPageSize: number;
        InvitationCompany: string;
        /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
        CsrfHeader: string;
    };
    requestBodies: {
        PlatformRevision: {
            content: {
                "application/json": {
                    /** Format: int64 */
                    revisionEsperada: number;
                };
            };
        };
        PlatformStateChange: {
            content: {
                "application/json": {
                    /** Format: int64 */
                    revisionEsperada: number;
                    motivo: string;
                };
            };
        };
    };
    headers: {
        /** @description UUID generado por el servidor para esta solicitud */
        CorrelationId: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    consultarVersionApi: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Versión de la API */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "version": "v1"
                     *     }
                     */
                    "application/json": components["schemas"]["ApiVersion"];
                };
            };
            406: components["responses"]["Problem"];
            500: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    consultarCabecerasVersionApi: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Cabeceras de la respuesta GET */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Tipo de respuesta no aceptable */
            406: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Error interno */
            500: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarCsrf: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Token CSRF. Si aún no hay sesión, el servidor envía MSPISESSION. */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CsrfView"];
                };
            };
            406: components["responses"]["Problem"];
            500: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    consultarSesion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["CurrentSession"];
            401: components["responses"]["Problem"];
            406: components["responses"]["Problem"];
            500: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    iniciarSesion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginInput"];
            };
        };
        responses: {
            200: components["responses"]["CurrentSession"];
            400: components["responses"]["Problem"];
            401: components["responses"]["Problem"];
            403: components["responses"]["Problem"];
            406: components["responses"]["Problem"];
            415: components["responses"]["Problem"];
            429: components["responses"]["Problem"];
            500: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    cerrarSesion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sesión invalidada. El servidor expira la cookie MSPISESSION. */
            204: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Problem"];
            403: components["responses"]["Problem"];
            500: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    solicitarRecuperacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecoveryRequest"];
            };
        };
        responses: {
            /** @description Solicitud admitida sin indicar si existe la cuenta o si se envió un correo */
            202: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            default: components["responses"]["Problem"];
        };
    };
    confirmarRecuperacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecoveryConfirmation"];
            };
        };
        responses: {
            /** @description Credencial restablecida y sesiones anteriores invalidadas */
            204: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            default: components["responses"]["Problem"];
        };
    };
    listarMisEmpresas: {
        parameters: {
            query?: {
                pagina?: number;
                tamano?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página ordenada por nombre y UUID */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyPage"];
                };
            };
            400: components["responses"]["Problem"];
            401: components["responses"]["Problem"];
            403: components["responses"]["Problem"];
            406: components["responses"]["Problem"];
            500: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    consultarContextoEmpresa: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Contexto y roles locales vigentes */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyMembership"];
                };
            };
            400: components["responses"]["Problem"];
            401: components["responses"]["Problem"];
            403: components["responses"]["Problem"];
            406: components["responses"]["Problem"];
            500: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    listarActivos: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                estado?: components["parameters"]["CatalogState"];
                texto?: components["parameters"]["InventorySearch"];
                tipo?: components["parameters"]["InventoryTypeFilter"];
                procesoId?: components["parameters"]["InventoryProcessFilter"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta el inventario local */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetInventoryPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    crearActivo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateInventoryAsset"];
            };
        };
        responses: {
            /** @description Registra un activo */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryAsset"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarActivo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta un activo local */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryAsset"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarActivo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditInventoryAsset"];
            };
        };
        responses: {
            /** @description Edita un activo vigente */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryAsset"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    archivarActivo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ArchiveInventoryAsset"];
            };
        };
        responses: {
            /** @description Archiva un activo local */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryAsset"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    restaurarActivo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RestoreInventoryAsset"];
            };
        };
        responses: {
            /** @description Restaura un activo archivado */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryAsset"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarHistorialActivo: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta el historial del activo */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryHistoryPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarClasificacionesActivo: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta las versiones de clasificación del activo */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetValuationPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    iniciarClasificacionActivo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartAssetValuationInput"];
            };
        };
        responses: {
            /** @description Inicia una valoración pendiente */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetValuation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarClasificacionActivo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
                valoracionId: components["parameters"]["AssetValuationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta una versión de clasificación */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetValuation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarClasificacionActivo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
                valoracionId: components["parameters"]["AssetValuationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditAssetValuationInput"];
            };
        };
        responses: {
            /** @description Reemplaza las entradas de una valoración pendiente */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetValuation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    confirmarClasificacionActivo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                activoId: components["parameters"]["InventoryAssetId"];
                valoracionId: components["parameters"]["AssetValuationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConfirmAssetValuationInput"];
            };
        };
        responses: {
            /** @description Confirma y publica una valoración */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssetValuation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarCatalogos: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                codigo?: components["parameters"]["ReferenceCode"];
                disponibleNuevos?: components["parameters"]["AvailableForNewUses"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista ediciones publicadas de catálogos */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceCatalogPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarCatalogo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta metadatos de una edición */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceCatalogVersion"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarElementosCatalogo: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                tipo?: components["parameters"]["ReferenceType"];
                grupo?: components["parameters"]["ReferenceGroup"];
                codigo?: components["parameters"]["ReferenceCode"];
                texto?: components["parameters"]["ReferenceText"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista controles y cláusulas de una edición */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceElementPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarElementoCatalogo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
                elementoId: components["parameters"]["ReferenceElementId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta descripción y origen del elemento */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceElement"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarMetodologias: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                codigo?: components["parameters"]["ReferenceCode"];
                disponibleNuevos?: components["parameters"]["AvailableForNewUses"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista versiones publicadas de metodología */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceMethodPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarMetodologia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                versionId: components["parameters"]["ReferenceVersionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta una versión de metodología */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReferenceMethodVersion"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarEvaluaciones: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista evaluaciones locales */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    crearEvaluacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateEvaluationDraft"];
            };
        };
        responses: {
            /** @description Crea una evaluación independiente en borrador */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationDraft"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarEvaluacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta una evaluación local */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationDraft"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarRespuestasEvaluacion: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                tipo?: components["parameters"]["ReferenceType"];
                grupo?: components["parameters"]["ReferenceGroup"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista las respuestas de la evaluación */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationResponsePage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarRespuestaEvaluacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditEvaluationResponse"];
            };
        };
        responses: {
            /** @description Diligencia una respuesta del borrador */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationResponse"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    enviarEvaluacionARevision: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewEvaluation"];
            };
        };
        responses: {
            /** @description Envía una evaluación completa a revisión */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationDraft"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    devolverEvaluacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReturnEvaluation"];
            };
        };
        responses: {
            /** @description Devuelve la evaluación a borrador */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationDraft"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    cerrarEvaluacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewEvaluation"];
            };
        };
        responses: {
            /** @description Cierra la evaluación en revisión */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationDraft"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarCierreEvaluacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta la instantánea de cierre */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationClosure"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    corregirEvaluacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CorrectEvaluation"];
            };
        };
        responses: {
            /** @description Crea un borrador vinculado a la evaluación cerrada */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationDraft"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    confirmarRespuestaHeredada: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EvaluationRevision"];
            };
        };
        responses: {
            /** @description Confirma una respuesta heredada sin cambiar su contenido */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationResponse"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarResultadosEvaluacion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta puntaje, avance y pendientes */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationResults"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarHallazgosEvaluacion: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista hallazgos vinculados a una respuesta */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationFindingPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    crearHallazgoEvaluacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditEvaluationFinding"];
            };
        };
        responses: {
            /** @description Registra un hallazgo de evaluación */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationFinding"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarHallazgoEvaluacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
                hallazgoId: components["parameters"]["EvaluationFindingId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditEvaluationFinding"];
            };
        };
        responses: {
            /** @description Edita un hallazgo del borrador */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EvaluationFinding"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarEvidenciasRespuesta: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Metadatos con estado de inspección, sin rutas físicas */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResponseEvidencePage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    cargarEvidenciaRespuesta: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /**
                     * Format: binary
                     * @description PDF, PNG o JPEG de hasta 10 000 000 bytes.
                     */
                    archivo: Blob;
                    /** Format: int64 */
                    revisionEsperada: number;
                    descripcion?: string;
                };
            };
        };
        responses: {
            /** @description Evidencia disponible */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    /** @description Ruta de descarga que exige autorización vigente. */
                    Location?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResponseEvidenceUpload"];
                };
            };
            413: components["responses"]["Problem"];
            422: components["responses"]["Problem"];
            503: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    descargarEvidenciaRespuesta: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                evaluacionId: components["parameters"]["EvaluationId"];
                respuestaId: components["parameters"]["EvaluationResponseId"];
                evidenciaId: components["parameters"]["ResponseEvidenceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Descarga como adjunto del tipo detectado */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    "Content-Disposition"?: string;
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": Blob;
                    "image/png": Blob;
                    "image/jpeg": Blob;
                };
            };
            422: components["responses"]["Problem"];
            503: components["responses"]["Problem"];
            default: components["responses"]["Problem"];
        };
    };
    listarImplementacionesControl: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista implementaciones de la empresa */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlImplementationPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    crearImplementacionControl: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateControlImplementation"];
            };
        };
        responses: {
            /** @description Registra una implementación propuesta */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlImplementation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarImplementacionControl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta una implementación y su verificación vigente */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlImplementation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarVersionesImplementacionControl: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista versiones históricas de una implementación */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlVersionPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarVerificacionesControl: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
                versionId: components["parameters"]["ControlImplementationVersionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista las verificaciones históricas de una versión */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlVerificationPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    iniciarImplementacionControl: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EvaluationRevision"];
            };
        };
        responses: {
            /** @description Inicia la aplicación de un control propuesto */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlImplementation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    confirmarAplicacionControl: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplyControlImplementation"];
            };
        };
        responses: {
            /** @description Confirma la aplicación con fecha y evidencia limpia */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlImplementation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    cambiarImplementacionControl: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeControlImplementation"];
            };
        };
        responses: {
            /** @description Abre una nueva versión de una implementación aplicada */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlImplementation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    verificarImplementacionControl: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyControlImplementation"];
            };
        };
        responses: {
            /** @description Registra una prueba y la vigencia de su verificación */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlVerification"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarEvidenciasControl: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
                versionId: components["parameters"]["ControlImplementationVersionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista adjuntos de una versión fuera de cuarentena */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResponseEvidencePage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    cargarEvidenciaControl: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
                versionId: components["parameters"]["ControlImplementationVersionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                    /** Format: int64 */
                    revisionEsperada: number;
                    descripcion?: string;
                };
            };
        };
        responses: {
            /** @description Carga un adjunto limpio en la versión vigente */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    Location?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ControlEvidenceUpload"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    descargarEvidenciaControl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                implementacionId: components["parameters"]["ControlImplementationId"];
                versionId: components["parameters"]["ControlImplementationVersionId"];
                evidenciaId: components["parameters"]["ResponseEvidenceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Descarga un adjunto de una versión previa o vigente */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    "Content-Disposition"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": Blob;
                    "image/png": Blob;
                    "image/jpeg": Blob;
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarActividadEmpresarial: {
        parameters: {
            query?: {
                tamano?: components["parameters"]["CompanyPageSize"];
                desde?: string;
                hasta?: string;
                actorId?: string;
                accion?: string;
                tipoObjeto?: string;
                objetoId?: string;
                cursor?: string;
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página del registro de actividad empresarial */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyActivityPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarPanelEmpresa: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                desde?: string;
                hasta?: string;
                evaluacionId?: string;
                estadoEvaluacion?: "BORRADOR" | "EN_REVISION" | "CERRADA";
                estadoRiesgo?: "IDENTIFICADO" | "EN_ANALISIS" | "EN_TRATAMIENTO" | "EN_SEGUIMIENTO" | "CERRADO";
                baseRiesgo?: "INHERENTE" | "RESIDUAL";
                situacionRiesgo?: "VIGENTE" | "PENDIENTE" | "REVISION_REQUERIDA";
                nivelRiesgo?: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO";
                probabilidad?: "MUY_BAJA" | "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA";
                impacto?: "LEVE" | "MENOR" | "MODERADO" | "MAYOR" | "CATASTROFICO";
                estadoAccion?: "PENDIENTE" | "EN_EJECUCION" | "EN_REVISION" | "COMPLETADA" | "CANCELADA";
                vencida?: boolean;
                detalle?: "EVALUACIONES" | "RIESGOS" | "ACCIONES";
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Agregados y página opcional de detalle con los mismos filtros */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyPanel"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    generarReporteBasicoEmpresa: {
        parameters: {
            query?: {
                desde?: string;
                hasta?: string;
                evaluacionId?: string;
                estadoEvaluacion?: "BORRADOR" | "EN_REVISION" | "CERRADA";
                estadoRiesgo?: "IDENTIFICADO" | "EN_ANALISIS" | "EN_TRATAMIENTO" | "EN_SEGUIMIENTO" | "CERRADO";
                baseRiesgo?: "INHERENTE" | "RESIDUAL";
                situacionRiesgo?: "VIGENTE" | "PENDIENTE" | "REVISION_REQUERIDA";
                nivelRiesgo?: "BAJO" | "MODERADO" | "ALTO" | "EXTREMO";
                probabilidad?: "MUY_BAJA" | "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA";
                impacto?: "LEVE" | "MENOR" | "MODERADO" | "MAYOR" | "CATASTROFICO";
                estadoAccion?: "PENDIENTE" | "EN_EJECUCION" | "EN_REVISION" | "COMPLETADA" | "CANCELADA";
                vencida?: boolean;
                /** @description Secciones del reporte. Si se omite, incluye las tres. */
                secciones?: ("EVALUACIONES" | "RIESGOS" | "ACCIONES")[];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Reporte operativo con contexto, filtros, resultados y metodologías */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyBasicReport"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarRiesgos: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                codigo?: string;
                estado?: "IDENTIFICADO" | "EN_ANALISIS" | "EN_TRATAMIENTO" | "EN_SEGUIMIENTO" | "CERRADO";
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista riesgos con filtros opcionales de código y estado */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RiskPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    registrarRiesgo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRisk"];
            };
        };
        responses: {
            /** @description Registra un riesgo identificado */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Risk"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarRiesgo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta un riesgo y su valoración inherente */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Risk"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarRiesgo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditRisk"];
            };
        };
        responses: {
            /** @description Actualiza datos del riesgo y señala cambios del contexto valorado */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Risk"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    cambiarEstadoRiesgo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RiskTransition"];
            };
        };
        responses: {
            /** @description Operación correcta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Risk"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarAceptacionesRiesgo: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación correcta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RiskAcceptancePage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    aprobarAceptacionRiesgo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApproveRiskAcceptance"];
            };
        };
        responses: {
            /** @description Operación correcta */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RiskAcceptance"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    registrarRiesgoRelacionado: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRisk"];
            };
        };
        responses: {
            /** @description Operación correcta */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Risk"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    iniciarAnalisisRiesgo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EvaluationRevision"];
            };
        };
        responses: {
            /** @description Pasa el riesgo de identificado a en análisis */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Risk"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarValoracionesInherentes: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista el historial de valoraciones inherentes */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InherentAssessmentPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    iniciarValoracionInherente: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateInherentAssessment"];
            };
        };
        responses: {
            /** @description Crea un borrador de valoración inherente */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InherentAssessment"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarValoracionInherente: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                valoracionId: components["parameters"]["InherentAssessmentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditInherentAssessment"];
            };
        };
        responses: {
            /** @description Actualiza las entradas del borrador inherente */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InherentAssessment"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    confirmarValoracionInherente: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                valoracionId: components["parameters"]["InherentAssessmentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EvaluationRevision"];
            };
        };
        responses: {
            /** @description Confirma entradas completas con la matriz versionada */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InherentAssessment"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarValoracionesResiduales: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta el historial con avisos de revisión */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResidualPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    iniciarValoracionResidual: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateResidualAssessment"];
            };
        };
        responses: {
            /** @description Crea un borrador a partir de la inherente vigente */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResidualAssessment"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarValoracionResidual: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                residualId: components["parameters"]["ResidualId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditResidualAssessment"];
            };
        };
        responses: {
            /** @description Actualiza el borrador y lo vincula a la inherente vigente */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResidualAssessment"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    confirmarValoracionResidual: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
                residualId: components["parameters"]["ResidualId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EvaluationRevision"];
            };
        };
        responses: {
            /** @description Calcula y conserva la valoración con sus verificaciones */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResidualAssessment"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarAcciones: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acciones autorizadas */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    crearAccion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAction"];
            };
        };
        responses: {
            /** @description Acción creada */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImprovementAction"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarAccion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Acción consultada */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImprovementAction"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarAccion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditAction"];
            };
        };
        responses: {
            /** @description Acción actualizada */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImprovementAction"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    registrarAvanceAccion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActionProgress"];
            };
        };
        responses: {
            /** @description Operación correcta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImprovementAction"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    entregarAccion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActionDelivery"];
            };
        };
        responses: {
            /** @description Operación correcta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImprovementAction"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    decidirEntregaAccion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
                entregaId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActionDecision"];
            };
        };
        responses: {
            /** @description Operación correcta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImprovementAction"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarHistorialAccion: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación correcta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionEvent"][];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarEvidenciasAccion: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operación correcta */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResponseEvidencePage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    cargarEvidenciaAccion: {
        parameters: {
            query: {
                revisionEsperada: number;
                descripcion?: string;
            };
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                };
            };
        };
        responses: {
            /** @description Operación correcta */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionEvidenceUpload"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    descargarEvidenciaAccion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
                evidenciaId: components["parameters"]["ActionEvidenceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Archivo privado */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": Blob;
                    "image/png": Blob;
                    "image/jpeg": Blob;
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    cancelarAccion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActionCancellation"];
            };
        };
        responses: {
            /** @description Acción cancelada */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImprovementAction"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    descargarEvidenciaContextoAccion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                accionId: components["parameters"]["ActionId"];
                evidenciaId: components["parameters"]["ActionEvidenceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Archivo privado autorizado */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": Blob;
                    "image/png": Blob;
                    "image/jpeg": Blob;
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarControlesDeRiesgo: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista las implementaciones vinculadas al riesgo */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RiskControlLinkPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    vincularControlARiesgo: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                riesgoId: components["parameters"]["RiskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRiskControlLink"];
            };
        };
        responses: {
            /** @description Vincula una implementación local sin cambiar la valoración */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RiskControlLink"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarProcesos: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                estado?: components["parameters"]["CatalogState"];
                responsableId?: components["parameters"]["ResponsibleFilter"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista los procesos de la empresa */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessProcessPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    crearProceso: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewBusinessProcess"];
            };
        };
        responses: {
            /** @description Crea un proceso activo */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessProcess"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarProceso: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                procesoId: components["parameters"]["BusinessProcessId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta un proceso local */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessProcess"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarProceso: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                procesoId: components["parameters"]["BusinessProcessId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditBusinessProcess"];
            };
        };
        responses: {
            /** @description Actualiza un proceso activo */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessProcess"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    archivarProceso: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                procesoId: components["parameters"]["BusinessProcessId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ArchiveCatalogRecord"];
            };
        };
        responses: {
            /** @description Archiva un proceso local */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessProcess"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarResponsablesNegocio: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
                estado?: components["parameters"]["CatalogState"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista responsables de negocio */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessResponsiblePage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    crearResponsableNegocio: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewBusinessResponsible"];
            };
        };
        responses: {
            /** @description Crea un responsable de negocio activo */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessResponsible"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarResponsableNegocio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                responsableId: components["parameters"]["BusinessResponsibleId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta un responsable de negocio local */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessResponsible"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    editarResponsableNegocio: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                responsableId: components["parameters"]["BusinessResponsibleId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditBusinessResponsible"];
            };
        };
        responses: {
            /** @description Actualiza un responsable de negocio activo */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessResponsible"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    archivarResponsableNegocio: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                responsableId: components["parameters"]["BusinessResponsibleId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ArchiveCatalogRecord"];
            };
        };
        responses: {
            /** @description Archiva un responsable de negocio */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BusinessResponsible"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    consultarConfiguracion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta datos básicos y zona horaria */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyConfiguration"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    actualizarConfiguracion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCompanyConfiguration"];
            };
        };
        responses: {
            /** @description Operación completada */
            204: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            default: components["responses"]["Problem"];
        };
    };
    listarMembresias: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista membresías de la empresa */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyMemberPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    listarResponsables: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista responsables elegibles */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyResponsiblePage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    actualizarRoles: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                membresiaId: components["parameters"]["CompanyMember"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCompanyMemberRoles"];
            };
        };
        responses: {
            /** @description Operación completada */
            204: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            default: components["responses"]["Problem"];
        };
    };
    revocarMembresia: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                membresiaId: components["parameters"]["CompanyMember"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RevokeCompanyMember"];
            };
        };
        responses: {
            /** @description Operación completada */
            204: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            default: components["responses"]["Problem"];
        };
    };
    listarInvitaciones: {
        parameters: {
            query?: {
                pagina?: components["parameters"]["CompanyPage"];
                tamano?: components["parameters"]["CompanyPageSize"];
            };
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Lista invitaciones de la empresa */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompanyInvitationPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    emitirInvitacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IssueInvitation"];
            };
        };
        responses: {
            /** @description Invitación enviada al relay SMTP */
            201: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IssuedInvitation"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    revocarInvitacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
                invitacionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Invitación revocada */
            204: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            default: components["responses"]["Problem"];
        };
    };
    aceptarInvitacion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptInvitation"];
            };
        };
        responses: {
            201: components["responses"]["AcceptedInvitation"];
            default: components["responses"]["Problem"];
        };
    };
    aceptarInvitacionConAlta: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EnrollInvitation"];
            };
        };
        responses: {
            201: components["responses"]["AcceptedInvitation"];
            default: components["responses"]["Problem"];
        };
    };
    listarEmpresasPlataforma: {
        parameters: {
            query?: {
                pagina?: number;
                tamano?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de metadatos del servicio */
            200: {
                headers: {
                    "X-Correlation-Id": components["headers"]["CorrelationId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlatformCompanyPage"];
                };
            };
            default: components["responses"]["Problem"];
        };
    };
    reservarEmpresa: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
                /** @description Reutilizar el UUID para reintentar la misma reserva. */
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReserveCompany"];
            };
        };
        responses: {
            201: components["responses"]["PlatformCompany"];
            default: components["responses"]["Problem"];
        };
    };
    consultarEmpresaPlataforma: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["PlatformCompany"];
            default: components["responses"]["Problem"];
        };
    };
    activarEmpresa: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["PlatformRevision"];
        responses: {
            200: components["responses"]["PlatformCompany"];
            default: components["responses"]["Problem"];
        };
    };
    reemitirInvitacionInicial: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["PlatformRevision"];
        responses: {
            200: components["responses"]["PlatformCompany"];
            default: components["responses"]["Problem"];
        };
    };
    suspenderEmpresa: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["PlatformStateChange"];
        responses: {
            200: components["responses"]["PlatformCompany"];
            default: components["responses"]["Problem"];
        };
    };
    reactivarEmpresa: {
        parameters: {
            query?: never;
            header: {
                /** @description Token obtenido con GET /api/v1/identidad/csrf para esta sesión. */
                "X-CSRF-TOKEN": components["parameters"]["CsrfHeader"];
            };
            path: {
                empresaId: components["parameters"]["InvitationCompany"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["PlatformStateChange"];
        responses: {
            200: components["responses"]["PlatformCompany"];
            default: components["responses"]["Problem"];
        };
    };
}
