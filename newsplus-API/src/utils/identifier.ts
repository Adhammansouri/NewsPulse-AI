export function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}