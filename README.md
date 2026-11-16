# Software_MSPI-front

## Entrega de historias de usuario

Por instrucción del responsable del proyecto, cada HU terminada se entrega con un commit en su rama, push a `origin` y un pull request dirigido exactamente a `Develop`. El responsable revisa y fusiona manualmente. No se fusionan PR ni se habilita la fusión automática como parte de la entrega.

## Base React · HU-FRONT-006

La nueva base con React + TypeScript + Vite + Material UI se encuentra en `src/` y se publica en `/interfaz/`. Mantiene la dirección Panorama, temas claro/oscuro y navegación adaptable. Las funcionalidades existentes continúan en las rutas actuales mientras se migran por historias; esta HU no sustituye la sesión ni las consultas ya implementadas.

Con Node **24.21.0**, desde la raíz:

```powershell
npm ci --ignore-scripts
npm ci --prefix tools/contracts --ignore-scripts
npm run contracts:check
npm run build
npm test
```

Las pruebas HTTPS necesitan OpenSSL; en Windows se puede indicar `OPENSSL_BIN`. `npm run dev` sirve solo la base visual en `http://127.0.0.1:5173/interfaz/`, sin conexión al backend. Para recorrerla junto con las funciones existentes, usar el despliegue HTTPS descrito abajo y abrir `https://localhost:6443/interfaz/`. La imagen Docker compila la base automáticamente.

Al ejecutar el gateway directamente, primero generar `dist/` con `npm run build` y reiniciar el gateway después de recompilar. Los archivos y el nonce CSP se entregan desde el mismo origen. [Alcance, decisiones y validación de HU-FRONT-006](docs/hu/HU-FRONT-006.md).

## Cliente API y contrato · HU-FRONT-007

`src/shared/api/client.ts` ofrece un transporte tipado a partir de la copia OpenAPI 1.24.0 del backend. Incluye cookie del mismo origen, CSRF actualizado por escritura, errores por campo y correlación, cancelación/tiempo de espera, multipart y adjuntos privados. No reintenta escrituras ni guarda credenciales o tokens.

El gateway permite solo rutas, métodos y consultas declarados en ese contrato. Admite JSON hasta 65.536 bytes y multipart hasta 10.016.384 bytes, con un máximo de dos cargas simultáneas por instancia. Los permisos y las validaciones de negocio siguen en el backend. No se añaden pantallas ni se migra aún el acceso a React; HU-FRONT-008 usará esta base.

Después de actualizar de forma explícita `contracts/backend-v1.yaml` y su procedencia en `contracts/source.json`, ejecutar `npm run contracts:generate` y `npm run contracts:check`. La herramienta tiene su propio lockfile y TypeScript 5 compatible con el generador, sin cambiar TypeScript 7 de la aplicación. CI comprueba que los tipos y las reglas generadas coincidan con la copia versionada. [Alcance y validación de HU-FRONT-007](docs/hu/HU-FRONT-007.md).

Prevención de secretos implementada en PR hacia Develop: [configuración y verificación](SECRETOS-Y-CONFIGURACION.md), [HU-SEG-002](docs/hu/HU-SEG-002.md).

## Iniciar el frontend local

HU-FRONT-001 permite iniciar sesión, listar y elegir una empresa autorizada, consultar su contexto y cerrar sesión. Desde la empresa, **Ver evaluaciones** abre el listado, el detalle y sus respuestas ([HU-FRONT-002](docs/hu/HU-FRONT-002.md)). Necesita el backend MSPI en ejecución en Docker, con HTTPS y una cuenta de prueba con membresía. El navegador usa el mismo origen para la interfaz y la API.

El espacio autenticado usa la navegación de Panorama. En el detalle de una evaluación, abre **Evidencias** en una respuesta para consultar y descargar sus adjuntos autorizados ([HU-FRONT-003](docs/hu/HU-FRONT-003.md)).

El **Resumen de empresa** muestra los resultados de la evaluación más reciente disponible. El detalle también presenta sus resultados por dominio y por cláusula ([HU-FRONT-004](docs/hu/HU-FRONT-004.md)).

En **Activos** se puede buscar por nombre o código, filtrar por tipo y estado y abrir la ficha de cada activo con su clasificación ([HU-FRONT-005](docs/hu/HU-FRONT-005.md)).

Desde PowerShell, indicar el nombre del proyecto Compose del backend y el directorio TLS privado que contiene `server.p12`, `server-password.txt` y `ca.crt`:

```powershell
./scripts/Start-MspiFrontend.ps1 -BackendProject mspi-evaluacion -TlsDirectory C:/RutaPrivada/MSPI/https
```

Abrir [MSPI en localhost](https://localhost:6443). El equipo debe confiar en la CA pública del laboratorio y el certificado debe incluir `localhost`. El script une el frontend y el backend en una red interna y publica solo el puerto HTTPS de la interfaz en loopback. Si Docker recrea el backend, repetir el comando para adjuntarlo de nuevo. Para usar otro puerto local añadir `-Port 6444`.

Para verificar las rutas, el reenvío seguro y los rechazos del servidor, ejecutar `npm run build` y `npm test` con Node y OpenSSL disponibles. En Windows se puede indicar la ruta de OpenSSL con `OPENSSL_BIN`. GitHub ejecuta esas pruebas y construye la imagen en los PR a `Develop`. [Alcance y validación del acceso original](docs/hu/HU-FRONT-001.md)
