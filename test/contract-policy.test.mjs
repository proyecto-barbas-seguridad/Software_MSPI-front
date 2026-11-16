import assert from 'node:assert/strict';
import { test } from 'node:test';
import contract from '../server/generated-routes.json' with { type: 'json' };
import { contractRoute } from '../server/contract-policy.mjs';

const id = 'e01b03ee-a2d7-4b42-a76e-e307737a3300';
const company = '/api/v1/empresas/' + id;
test('every generated operation has a corresponding bounded gateway route', () => {
  assert.equal(contract.routes.length, 121);
  for (const operation of contract.routes) {
    const url = operation.template.replace(/\{[^}]+\}/g, id);
    const query = new URLSearchParams();
    for (const [key, schema] of Object.entries(operation.query)) {
      if (schema.required) query.append(key, String(schema.type === 'integer' ? schema.minimum || 0 : schema.enum?.[0] || id));
    }
    const path = url + (query.size ? '?' + query : '');
    const selected = contractRoute(operation.method, path);
    assert.ok(selected, operation.method + ' ' + operation.template);
    assert.equal(selected.upstream, path);
    if (operation.body.includes('multipart/form-data')) assert.equal(selected.body, 'multipart');
  }
});

test('supports contract filters and array parameters without accepting duplicates or unknown parameters', () => {
  for (const query of ['tamano=100&pagina=0', 'pagina=1&tamano=5', 'texto=n%C3%B3mina%2Fcompras&tipo=SOFTWARE']) {
    assert.ok(contractRoute('GET', company + '/activos?' + query));
  }
  assert.ok(contractRoute('GET', company + '/reportes/basico?secciones=RIESGOS&secciones=ACCIONES&vencida=false'));
  assert.ok(contractRoute('GET', company + '/actividad?desde=2026-11-16T10%3A00%3A00Z&accion=CREAR_ACTIVO&cursor=abc%2Fdef%3D'));
  for (const path of [
    company + '/activos?pagina=0&pagina=1', company + '/activos?tamano=101', company + '/activos?texto=%GG',
    company + '/activos?texto=%00', company + '/activos?tipo=OTRO', company + '/activos?propietario=ajeno',
    company + '/activos?pagina=2147483648', company + '/panel?desde=2026-02-31',
    company + '/panel?evaluacionId=no-uuid', company + '/panel?vencida=1',
    company + '/reportes/basico?secciones=RIESGOS&secciones=OTRA',
    company + '/reportes/basico?' + 'secciones=RIESGOS&'.repeat(4).slice(0, -1),
    '/api/v1/empresas/%2e%2e/contexto', '/api/v1/empresas/' + id + '/activos/../riesgos',
  ]) assert.equal(contractRoute('GET', path), undefined, path);
});

test('rejects undocumented methods and limits query strings even on public operations', () => {
  assert.ok(contractRoute('HEAD', '/api/v1'));
  for (const method of ['PATCH', 'TRACE', 'CONNECT', 'OPTIONS']) assert.equal(contractRoute(method, company + '/activos'), undefined);
  for (const path of ['/api/v1?token=fixture', '/api/v1/identidad/sesion?contrasena=fixture',
    'https://outside.example/api/v1', '//outside.example/api/v1', '/api/v2', '/actuator/health']) {
    assert.equal(contractRoute('GET', path), undefined);
  }
});
