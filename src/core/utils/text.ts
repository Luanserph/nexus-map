const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  reg: '®',
  trade: '™',
};

/**
 * Decodes named and numeric HTML entities (e.g. `&#39;`, `&#x27;`, `&quot;`, `&amp;`, `&nbsp;`, `&mdash;`),
 * strips residual HTML tags, and normalizes whitespace.
 */
export function decodeHtmlEntities(input: string): string {
  if (!input) return '';

  // Strip residual HTML tags (converting <br> to spaces first)
  let cleaned = input
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, '');

  // Decode numeric (decimal & hex) and named HTML entities (up to 2 passes for double-encoded strings)
  for (let pass = 0; pass < 2; pass += 1) {
    const next = cleaned.replace(
      /&(?:#x([0-9a-f]+)|#([0-9]+)|([a-z]+));/gi,
      (match, hex: string | undefined, dec: string | undefined, named: string | undefined) => {
        if (hex) {
          const codePoint = Number.parseInt(hex, 16);
          return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }
        if (dec) {
          const codePoint = Number.parseInt(dec, 10);
          return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }
        if (named) {
          const replacement = NAMED_HTML_ENTITIES[named.toLowerCase()];
          return replacement ?? match;
        }
        return match;
      }
    );
    if (next === cleaned) break;
    cleaned = next;
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}
