# HU-FRONT-008 · Sesión, empresa activa y permisos en React

Fecha: 16 de noviembre de 2026.
Rama: `feat/HU-FRONT-008-sesion-contexto`.
Base: `Develop`, `68d4e55`, fusión de HU-FRONT-007 mediante PR #8.

Como usuario con una cuenta MSPI, quiero acceder a mis empresas y reconocer el alcance de mi membresía vigente para trabajar sin mezclar datos ni permisos entre empresas.

## Criterios implementados

- `/interfaz/` utiliza el cliente tipado de HU007 para consultar la sesión, iniciar/cerrar sesión, paginar `/mis-empresas` y consultar `/empresas/{empresaId}/contexto`. Contrato OpenAPI 1.24.0 conservado. Cookie y API del mismo origen; CSRF nuevo en cada escritura, sin JWT ni almacenamiento de credenciales.
- El acceso muestra correo/contraseña con etiquetas, autocompletado, mostrar/ocultar, errores por campo, referencia de soporte y espera conforme a Retry-After. El formulario se retira durante la solicitud y la contraseña se elimina del campo y del FormData; no se incorpora al estado React, caché, URL o registros.
- Selector de empresas con diez registros por página, anterior/siguiente, nombres, zona horaria, todos los roles de la membresía y vacío explícito. No selecciona automáticamente la primera empresa ni presume que una cuenta sin membresías tiene privilegios AP.
- Empresa activa validada por una nueva consulta de sesión y contexto. Se comprueba UUID coincidente, roles conocidos no vacíos/sin duplicados y formato mínimo de identidad/contexto antes de mostrarlos. La lista del selector no se usa como autorización definitiva.
- AE, GS y AU conceden consulta. AE/GS conceden gestión; AU+GS conserva esa concesión. RA solo recibe una entrada limitada de «Mis acciones», sin enlaces de consulta operativa. AE identifica su alcance administrativo. No hay un selector de rol que anule restricciones personales.
- Las entradas administrativas y de tareas explican su disponibilidad pendiente. No implementan esas funcionalidades. Nadie puede aprobar o devolver su propia entrega; esta HU no añade controles de aprobación y no pretende acreditar esa regla mediante una operación inexistente.
- Cada transición retira datos privados del alcance anterior, aborta su petición y descarta respuestas tardías mediante una generación. Sin caché persistente ni resultados empresariales ficticios. Un único alcance en memoria se suscribe desde React con `useSyncExternalStore`.
- Un 401 retira identidad/contexto y vuelve al acceso. Un 403/404 retira contexto/datos y ofrece reintentar o regresar al selector. Al recuperar el foco, mostrar una página restaurada o volver a una pestaña visible, se consultan sesión y permisos nuevamente. El vencimiento se programa desde `expiraEn`; el backend sigue siendo autoridad y autoriza cada operación.
- El cierre siempre retira datos privados. Si falla la red o CSRF, se indica que no se confirmó la invalidación del servidor y se ofrece reintentar el cierre; no se simula una sesión cerrada. No hay reintento automático de escrituras.
- Navegación móvil plegable, temas claro/oscuro, foco en encabezado al terminar una transición y enlace para saltar al contenido sin alterar la ruta. Formularios y avisos mantienen el nonce de Emotion y no generan atributos de estilo inline. Paper/Alert usan variante outlined para conservar la CSP existente sin ampliarla.

## Decisiones de implementación para revisar

No cambian los documentos aprobados ni se registran como acuerdos de diseño nuevos:

- Rutas de fragmento `#/empresas` y `#/empresas/{uuid}` dentro de `/interfaz/`, con enlace directo, recarga y atrás/adelante. Es una navegación transitoria sin dependencias nuevas ni ampliación de las rutas públicas del gateway. Las pantallas de consulta originales siguen en sus URL actuales y comparten la cookie. Se mantiene pendiente unificar el enrutamiento de todos los módulos al migrarlos.
- Al expirar/cerrar, se vuelve al selector de acceso y no se restaura automáticamente la empresa anterior. Los permisos se consultan nuevamente al entrar.
- Entrada limitada para RA, mensaje de lectura para AU y aviso administrativo para AE. No se añaden enlaces hacia pantallas inexistentes. Los enlaces a resumen, activos y evaluaciones son consultas reales previas, fuera de React por ahora.
- El contrato `SessionView` informa identidad y vencimiento, sin indicador AP. No se inventa ese privilegio ni se consulta automáticamente información de plataforma o empresarial para descubrirlo. Su entrada requiere la historia de plataforma y su contrato/autorización específicos.

El responsable revisará estas decisiones en el PR. `09-diseno-de-pantallas.md` y los documentos 01–08 se conservan: no se registra una aprobación visual que aún no haya ocurrido.

## Verificación

```powershell
npm run contracts:check
npm run build
npm run test:ui
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm run test:gateway
docker build -t mspi-front-hu008-review .
```

- 30 pruebas UI/cliente/estado: flujo de acceso completo; CSRF rotado y cierre por el transporte tipado; perfiles RA, AU, GS y AE; combinación AU+GS; cuenta sin empresas; cancelación y respuestas fuera de orden; contexto de otra empresa; revocación; 401 y vencimiento por timestamp; cierre fallido; paginación; desmontaje; referencia/errores por campo/Retry-After; tema, menú, nonce y estilos del formulario.
- 17 pruebas HTTPS de reglas/gateway mantienen el contrato, aislamiento de rutas, origen, cookie/CSRF, TLS, límites de cuerpo, cargas y entrega del build.
- Imagen Docker `mspi-front-hu008-review` construida correctamente, sin desplegarla.
- TypeScript estricto, contrato generado y build Vite verificados. El bundle de entrada produce una advertencia de tamaño de aproximadamente 512 kB sin comprimir (152 kB gzip), no un error. Se registra para dividir módulos al ampliar la aplicación.

Las pruebas usan DOM y transporte simulados, además del upstream HTTPS local del gateway. No acreditan inspección visual en navegador real, integración contra PostgreSQL/backend desplegado ni pruebas de múltiples pestañas con cookies reales. No se despliegan servicios ni se modifica el backend.

La protección de borradores empresariales, cambios sin guardar, conflictos de edición y restricciones de objetos de negocio se probará al incorporar sus formularios. Esta HU solo escribe credenciales/sesión y no contiene borradores empresariales que puedan perderse. No implementa invitaciones, recuperación, tareas, membresías ni administración de plataforma.

Entrega: commit, push y PR hacia `Develop`; revisión y fusión exclusivamente manuales. No habilitar auto-merge. El estado de CI se verifica en el PR.
