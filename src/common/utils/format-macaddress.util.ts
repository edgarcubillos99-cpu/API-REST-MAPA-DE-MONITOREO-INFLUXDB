export function formatMacAddress(buffer: Buffer): string {
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0')) // CONVERTIR A HEXADECIMAL
    .join(':') // SEPARAR CON ":"
    .toUpperCase(); // CONVERTIR A MAYÚSCULAS
}
