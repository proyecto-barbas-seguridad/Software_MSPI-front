export const MAX_EVIDENCE_BYTES = 10_000_000;
export const typeFor = (name: string) => /\.pdf$/i.test(name) ? 'application/pdf' : /\.png$/i.test(name) ? 'image/png' : /\.jpe?g$/i.test(name) ? 'image/jpeg' : undefined;
export function fileProblem(file?: File) {
  if (!file) return 'Selecciona un archivo.';
  if (!file.name.trim() || file.name.length > 255 || /[\\/\p{Cc}\p{Cf}]/u.test(file.name) || !typeFor(file.name)) return 'Elige un PDF, PNG o JPEG con nombre válido de hasta 255 caracteres, sin rutas ni caracteres de control.';
  if (!file.size) return 'El archivo está vacío. Selecciona otro archivo.';
  if (file.size > MAX_EVIDENCE_BYTES) return 'El archivo supera 10 MB (10 000 000 bytes). Selecciona uno más pequeño.';
  return undefined;
}
