import contract from './generated-routes.json' with { type: 'json' };

const uuid = '[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}';
const escape = text => text.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
const rules = contract.routes.map(rule => {
  if (Object.values(rule.path).some(schema => schema.format !== 'uuid')) throw new Error('Parámetro de ruta no soportado.');
  return { ...rule, pattern: new RegExp('^' + rule.template.split(/(\{[^}]+\})/)
    .map(part => part.startsWith('{') ? uuid : escape(part)).join('') + '$') };
});
function validDate(value) {
  const timestamp = Date.parse(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(timestamp)
    && new Date(timestamp).toISOString().slice(0, 10) === value;
}
function validValue(value, schema) {
  if (/[\u0000-\u001f\u007f]/u.test(value)) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.type === 'boolean') return value === 'true' || value === 'false';
  if (schema.type === 'integer') {
    const number = Number(value);
    return /^\d+$/.test(value) && Number.isSafeInteger(number) && number >= (schema.minimum ?? 0)
      && number <= (schema.maximum ?? (schema.format === 'int64' ? Number.MAX_SAFE_INTEGER : 2147483647));
  }
  if (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? 2048)) return false;
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) return false;
  if (schema.format === 'uuid') return new RegExp('^' + uuid + '$').test(value);
  if (schema.format === 'date') return validDate(value);
  if (schema.format === 'date-time') return validDate(value.slice(0, 10))
    && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
  return true;
}

export function contractRoute(method, target) {
  if (typeof target !== 'string' || target.length > 8192 || /[^a-zA-Z0-9_./?=&*+%-]/.test(target)) return;
  const [path, query, extra] = target.split('?');
  if (extra !== undefined || !/^\/[a-zA-Z0-9_./-]*$/.test(path) || path.split('/').some(s => s === '.' || s === '..')) return;
  const rule = rules.find(rule => rule.method === method && rule.pattern.test(path));
  if (!rule) return;
  try { decodeURIComponent((query || '').replace(/\+/g, ' ')); } catch { return; }
  const params = new URLSearchParams(query);
  for (const key of params.keys()) if (!Object.hasOwn(rule.query, key)) return;
  for (const [key, schema] of Object.entries(rule.query)) {
    const values = params.getAll(key);
    if (!values.length) { if (schema.required) return; else continue; }
    if (schema.type === 'array') {
      if (values.length < (schema.minItems ?? 0) || values.length > (schema.maxItems ?? 100)
        || !values.every(value => validValue(value, schema.items))) return;
    } else if (values.length !== 1 || !validValue(values[0], schema)) return;
  }
  const result = { upstream: target };
  if (rule.download) result.download = true;
  if (rule.body.includes('multipart/form-data')) result.body = 'multipart';
  else if (rule.body.includes('application/json')) result.body = 'json';
  return result;
}
