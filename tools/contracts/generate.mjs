import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import openapiTS, { astToString } from 'openapi-typescript';
import ts from 'typescript';
import { parse } from 'yaml';

const root = new URL('../../', import.meta.url);
const source = await readFile(new URL('contracts/backend-v1.yaml', root), 'utf8');
const provenance = JSON.parse(await readFile(new URL('contracts/source.json', root), 'utf8'));
if (createHash('sha256').update(source).digest('hex') !== provenance.sha256) {
  throw new Error('La huella del contrato no coincide con su procedencia registrada.');
}
const api = parse(source);
if (api.info.version !== provenance.version) throw new Error('Versión de procedencia desactualizada.');
function localReferences(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref && !value.$ref.startsWith('#/')) throw new Error('El contrato debe ser autocontenido.');
  for (const child of Object.values(value)) localReferences(child);
}
localReferences(api);
const deref = value => value?.$ref ? value.$ref.slice(2).split('/').reduce((o, k) => o[k], api) : value;
function querySchema(input) {
  const schema = deref(input);
  if (!['string', 'integer', 'boolean', 'array'].includes(schema.type)) throw new Error('Tipo de consulta no soportado.');
  return Object.fromEntries(Object.entries(schema).filter(([key]) =>
    ['type', 'enum', 'format', 'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'pattern', 'items'].includes(key))
    .map(([key, value]) => [key, key === 'items' ? querySchema(value) : value]));
}
const routes = [];
for (const [template, item] of Object.entries(api.paths)) {
  for (const method of ['get', 'head', 'post', 'put', 'delete']) {
    const operation = item[method];
    if (!operation) continue;
    const parameters = [...(item.parameters || []), ...(operation.parameters || [])].map(deref);
    const success = Object.entries(operation.responses).filter(([status]) => /^2\d\d$/.test(status)).map(([, r]) => deref(r));
    const types = success.flatMap(r => Object.keys(r.content || {}));
    routes.push({ template, method: method.toUpperCase(), operationId: operation.operationId,
      path: Object.fromEntries(parameters.filter(p => p.in === 'path').map(p => [p.name, deref(p.schema)])),
      query: Object.fromEntries(parameters.filter(p => p.in === 'query').map(p => [p.name, { ...querySchema(p.schema), required: !!p.required }])),
      body: Object.keys(deref(operation.requestBody)?.content || {}),
      csrf: parameters.some(p => p.in === 'header' && p.name.toLowerCase() === 'x-csrf-token'),
      download: types.some(type => ['application/pdf', 'image/png', 'image/jpeg'].includes(type)),
    });
  }
}
const types = astToString(await openapiTS(api, { transform(schema) {
  if (schema.format === 'binary') return ts.factory.createTypeReferenceNode('Blob');
} }));
const json = JSON.stringify({ version: api.info.version, sha256: provenance.sha256, routes }, null, 2) + '\n';
const files = {
  'src/shared/api/generated/schema.d.ts': '// Generated from contracts/backend-v1.yaml. Do not edit manually.\n' + types,
  'src/shared/api/generated/operations.json': json,
  'server/generated-routes.json': json,
};
for (const [path, content] of Object.entries(files)) {
  const url = new URL(path, root);
  if (process.argv.includes('--check')) {
    if (await readFile(url, 'utf8') !== content) throw new Error('Contrato generado desactualizado: ' + path);
  } else {
    await mkdir(new URL('./', url), { recursive: true });
    await writeFile(url, content);
  }
}
console.log(`Contrato ${api.info.version}: ${Object.keys(api.paths).length} rutas, ${routes.length} operaciones; ${process.argv.includes('--check') ? 'verificado' : 'generado'}.`);
