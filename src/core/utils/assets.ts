/**
 * Dynamic asset/tile URL resolver.
 *
 * - When `VITE_TILES_BASE_URL` is empty (local dev or Vercel static hosting),
 *   returns the relative `/tiles/...` path as-is.
 * - When `VITE_TILES_BASE_URL` is configured (e.g. Cloudflare R2 / CDN),
 *   joins the base URL and relative path without duplicating slashes.
 */

export function getTilesBaseUrl(): string {
  const raw = import.meta.env.VITE_TILES_BASE_URL;
  return typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : '';
}

export function resolveTileUrlTemplate(
  tileUrlTemplate?: string
): string | undefined {
  if (!tileUrlTemplate) return undefined;

  const trimmed = tileUrlTemplate.trim();
  if (!trimmed) return undefined;

  // Already an absolute URL (http:// or https://)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = getTilesBaseUrl();
  const normalizedPath = trimmed.replace(/^\/+/, '');

  if (!baseUrl) {
    return `/${normalizedPath}`;
  }

  // Avoid duplicating `/tiles/` if the CDN base URL already includes `/tiles`
  if (
    baseUrl.toLowerCase().endsWith('/tiles') &&
    normalizedPath.toLowerCase().startsWith('tiles/')
  ) {
    return `${baseUrl}/${normalizedPath.slice('tiles/'.length)}`;
  }

  return `${baseUrl}/${normalizedPath}`;
}
