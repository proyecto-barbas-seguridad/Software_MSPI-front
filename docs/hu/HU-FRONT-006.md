# HU-FRONT-006 · Base React, TypeScript, Vite y Material UI

Fecha: 16 de noviembre de 2026.
Rama: `feat/HU-FRONT-006-base-react-typescript`.
Estado: implementación y verificaciones locales completas; entrega mediante push de la rama y PR hacia `Develop`, con revisión y fusión manuales por el responsable. El resultado de CI se consulta en el PR y no se presume aprobado por las pruebas locales.

Como equipo de frontend, queremos una base compilable con el stack aprobado y la dirección Panorama para migrar las funcionalidades existentes por historias, conservando la integración HTTPS actual.

## Alcance y criterios

- React y React DOM 19.3.1, TypeScript 7.0.2, Vite 8.3.8 y Material UI 9.5.0. Dependencias con versiones exactas e integridad en `package-lock.json`. Node de referencia: 24.21.0; herramientas compatibles con Node 22.22.2+ o 24.15+ dentro de sus versiones mayores declaradas.
- `src/app` contiene aplicación, proveedores de Emotion/Material UI y tema Panorama. `src/shared/layout` contiene el marco adaptable. No se añaden pantallas de negocio ficticias ni se implementa la nueva capa API de HU-FRONT-007.
- `/interfaz/` presenta una entrada React con tema claro/oscuro, navegación adaptable, enlace para saltar al contenido y acceso al flujo empresarial existente. La elección de apariencia vive solo en memoria.
- Las rutas existentes `/`, `/empresas` y sus consultas continúan en `public/`. Su migración de sesión/contexto a React corresponde a HU-FRONT-008; la migración de cada consulta se realizará con su módulo. No se duplica la autenticación ni se cambia el contrato del backend.
- Vite genera `dist/` y un manifiesto. El gateway solo publica la entrada y los archivos JS/CSS enumerados en ese manifiesto, sin exponer fuentes, mapas o el manifiesto. Antes de compilar, la entrada React responde 503 `INTERFAZ_NO_COMPILADA`.
- Cada respuesta HTML React recibe un nonce aleatorio de 128 bits, enviado también a la caché de Emotion. Se conservan scripts del mismo origen y no se permite `unsafe-inline`; los componentes de esta base no usan atributos `style`. Los futuros componentes que necesiten posicionamiento o estilos dinámicos deberán revisarse contra la CSP antes de incorporarlos. No se expande la lista de operaciones empresariales permitidas por el gateway.
- Docker compila en una etapa Node 24, fijada por digest, y entrega únicamente `dist/`, el gateway y los archivos actuales en la etapa de runtime existente. No se copian dependencias de construcción a la imagen final. CI instala con `npm ci --ignore-scripts`, compila, ejecuta pruebas y construye la imagen.

## Construcción y prueba

Desde la raíz del frontend, con Node 24.21.0:

```powershell
npm ci --ignore-scripts
npm run build
# En Windows, si OpenSSL no está en PATH:
$env:OPENSSL_BIN = 'C:\Program Files\Git\usr\bin\openssl.exe'
npm test
docker build -t mspi-front-hu006-review .
```

`npm run dev` abre el entorno Vite en loopback, normalmente `http://127.0.0.1:5173/interfaz/`. Sirve para trabajar en el marco visual; no configura un proxy a la API ni autentica. Para recorrer la entrada nueva y las funciones empresariales existentes juntas, construir y usar el gateway HTTPS mediante el procedimiento del README; abrir `https://localhost:6443/interfaz/`. No se usa Vite como servidor de producción.

## Evidencia y límites

- Compilación TypeScript y paquete Vite: correctos.
- Tres pruebas de UI: estructura/enlaces, navegación y apariencia, nonce de estilos y ausencia de atributos de estilo inline en la base.
- Diez pruebas HTTPS de gateway: rutas previas, cookie/CSRF, restricciones de origen y cuerpo, certificados ajenos, descargas y nuevas comprobaciones de nonce, entrada React y archivos compilados.
- La generación de certificados con OpenSSL necesitó ejecutar las pruebas fuera del aislamiento local; se usaron únicamente certificados temporales y servidores locales de prueba, sin credenciales ni servicios del usuario.
- Construcción de imagen Docker correcta: `mspi-front-hu006-review`, imagen `sha256:e1d3437f1d195234556f3bfaa72ca30bffa36b542718de52e1bd320dddeb8c05`. No se despliegan contenedores existentes ni se modifica el backend.

La prueba de UI usa DOM simulado, no acredita una inspección visual en navegador real ni un ensayo integrado contra el backend. La migración funcional y sus pruebas corresponden a las próximas HU.

Fuentes oficiales consultadas: [integración de Vite](https://vite.dev/guide/backend-integration), [instalación de Material UI](https://mui.com/material-ui/getting-started/installation/) y [nonce/CSP de Material UI](https://mui.com/material-ui/guides/content-security-policy/). Las versiones concretas se consultaron en el registro oficial de npm y la imagen de construcción en el registro oficial de Node.
