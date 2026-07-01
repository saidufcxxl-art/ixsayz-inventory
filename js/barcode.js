export function ean13Checksum(first12) {
  const digits = String(first12).replace(/\D/g, "").padStart(12, "0").slice(0, 12).split("").map(Number);
  const sum = digits.reduce((acc, digit, idx) => acc + digit * (idx % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
}
export function isValidEAN13(code) {
  const value = String(code || "").replace(/\D/g, "");
  return /^\d{13}$/.test(value) && ean13Checksum(value.slice(0, 12)) === value[12];
}
export function makeEAN13FromSeed(seed = Date.now()) {
  const base = String(Math.abs(Number(seed)) || Date.now()).replace(/\D/g, "").padEnd(12, "0").slice(0, 12);
  return base + ean13Checksum(base);
}
export async function generateUniqueEAN13(existingCodes = []) {
  const existing = new Set(existingCodes.map(String));
  let code = "";
  do {
    const prefix = "29";
    const random = Math.floor(Math.random() * 10_000_000_000).toString().padStart(10, "0");
    code = prefix + random;
    code += ean13Checksum(code);
  } while (existing.has(code));
  return code;
}
