# HU-FRONT-007 · Cliente API tipado y gateway alineado con el contrato

Fecha: 16 de noviembre de 2026.
Base: `Develop` tras PR #7, commit `af52c93`.
Rama: `feat/HU-FRONT-007-cliente-api-contrato`.

Como equipo de frontend, queremos un transporte reutilizable y un gateway alineados con la API real para implementar las próximas pantallas sin inventar rutas, campos ni políticas de acceso.

## Contrato y generación

Se conserva una copia autocontenida del OpenAPI **1.24.0**: 93 rutas y 121 operaciones, tomada del backend en `d36f7f720380decff4bc614b720b6b9377081130`. `contracts/source.json` registra repositorio, revisión, ruta y SHA-256. La copia usa UTF-8 y finales LF, de forma estable en Windows y Linux.

`tools/contracts/generate.mjs` genera los DTO y operaciones TypeScript y dos copias equivalentes de las reglas de transporte: una para el cliente y otra para el gateway. No se admiten referencias remotas del contrato. `--check` verifica procedencia, versión y coincidencia con lo generado, sin escribir archivos. El build no consulta al backend ni descarga un contrato nuevo automáticamente.

El generador `openapi-typescript` 7.13.0 requiere TypeScript 5; vive en `tools/contracts/` con TypeScript 5.9.3, YAML 2.9.1 y lockfile propios. La aplicación conserva TypeScript 7.0.2. No se forzaron peer dependencies ni se degradó la aplicación.

## Cliente

- `request(metodo, plantilla, opciones)` infiere parámetros de ruta, consultas, cuerpo y respuesta del OpenAPI. Las pruebas de compilación rechazan métodos inexistentes, UUID de ruta omitidos, nombres de credenciales incorrectos y enums no admitidos.
- El destino está limitado a operaciones conocidas de `/api/v1`, con UUID de empresa/objeto explícitos. Las solicitudes usan `same-origin`, `no-store` y rechazo de redirecciones. No aceptan orígenes o cabeceras de autenticación arbitrarios.
- Cada escritura obtiene CSRF de la sesión actual antes de enviar el comando; la siguiente operación obtiene otro token después de la rotación de login. No se usa almacenamiento web, URL ni logs para credenciales o tokens.
- Errores conservan estado HTTP, código, mensaje, campos, correlación y `Retry-After`. Se distinguen cancelación, tiempo de espera, fallo de conexión y respuesta inválida. No se reintenta ninguna solicitud automáticamente, especialmente escrituras o conflictos 409.
- Soporta respuestas 204/HEAD, cuerpos JSON, multipart con archivo y revisión tipados y descargas como Blob con tipo/adjunto permitido. El navegador genera el boundary. El timeout es configurable por cliente; el valor inicial es 15 segundos.
- El tipado es estático. Las comprobaciones de formato de transporte no sustituyen la validación de DTO, revisiones, permisos o reglas del servidor. Tampoco se implementan aún cachés de empresa o navegación de sesión; corresponden a HU-FRONT-008.

## Gateway

- Las 121 operaciones declaradas tienen ruta verificable. Se habilitan GET, HEAD, POST, PUT o DELETE únicamente donde existe la operación, con UUID y parámetros permitidos. No se convierte el gateway en un proxy abierto.
- Consultas comprobadas por nombre, tipo, rango, longitud, formato y enum. Duplicados escalares se rechazan; arrays repetidos se admiten solo donde lo declara el contrato, como `secciones` del reporte. Paginación según OpenAPI: base cero y tamaños de 1 a 100.
- Escrituras requieren el origen exacto configurado y reenvían cookie/CSRF al backend. JSON limitado a 65.536 bytes. Multipart limitado a 10.016.384 bytes y dos cargas por instancia; exceso concurrente responde 503 con `Retry-After`. Se comprueba el límite con Content-Length y al leer el cuerpo, incluyendo transferencias fragmentadas. El archivo individual sigue sujeto al máximo de 10.000.000 bytes y a las comprobaciones del backend.
- Tiempo HTTP de recepción y plazo de respuesta de cargas: 30 segundos; JSON conserva el plazo de respuesta de 8 segundos. Los límites se aplican por instancia, no por empresa o usuario.
- Se conservan TLS verificado, aislamiento de red del despliegue, cabeceras de seguridad, CSP con nonce en React, entrega de archivos por manifiesto, adjuntos privados y exclusión de cabeceras internas.
- La lista de rutas no concede autorización empresarial ni AP. El backend sigue validando sesión, membresía, empresa, estado, revisión y separación entre responsable y revisor.

## Verificación local

```powershell
npm ci --ignore-scripts
npm ci --prefix tools/contracts --ignore-scripts
npm run contracts:check
npm run build
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm test
docker build -t mspi-front-hu007-review .
```

- Generación y comprobación reproducibles del contrato correctas.
- TypeScript estricto y build Vite correctos, incluidas las aserciones de tipos.
- 15 pruebas de UI/cliente y 17 pruebas de reglas/gateway HTTPS aprobadas: token tras rotación, datos de error, cero/204, arrays, revisiones, multipart, adjuntos, cancelación, timeout, límites, origen, TLS y publicación estática. Las dos cargas simultáneas mantienen su cupo hasta completarse y lo liberan después.
- Imagen Docker `mspi-front-hu007-review` construida correctamente. No se despliegan servicios ni se cambia el backend.

Las pruebas usan fetch simulado y un upstream HTTPS de pruebas, no el backend con PostgreSQL real. La integración de pantallas y sesión real, sus permisos y su inspección visual se verificará en las HU funcionales siguientes. Esta historia no modifica los datos de demostración ni los bocetos aprobados.

Entrega con commit, push y PR hacia `Develop`. La revisión y fusión son manuales por el responsable; no se habilita auto-merge. El estado remoto de CI se consulta en el PR y no se deduce de las pruebas locales.

Fuentes: OpenAPI local del backend y [API de generación de openapi-typescript](https://openapi-ts.dev/node).
