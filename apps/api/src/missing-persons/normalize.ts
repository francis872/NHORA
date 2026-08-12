// Strips accents/diacritics and lowercases, so "José" and "jose" match — mirrors the
// "busca sin tildes ni mayúsculas" requirement without needing a Postgres unaccent
// extension available on every deploy target.
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
