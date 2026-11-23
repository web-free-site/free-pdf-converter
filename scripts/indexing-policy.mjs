export const OFFICIAL_SITE_URL = 'https://www.bentopdf.com';

/** Default public URL for this fork when SITE_URL is unset during builds. */
export const DEFAULT_DEPLOYMENT_SITE_URL =
  'https://free-pdf-converter.web-free.site';

export function resolveSiteUrl() {
  return (process.env.SITE_URL || DEFAULT_DEPLOYMENT_SITE_URL).replace(
    /\/+$/,
    ''
  );
}

export function isOfficialSiteUrl(url = resolveSiteUrl()) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'www.bentopdf.com' || hostname === 'bentopdf.com';
  } catch {
    return false;
  }
}

export function canonicalBasePath() {
  if (isOfficialSiteUrl()) return '';
  return (process.env.BASE_URL || '/').replace(/\/$/, '');
}

export function isIndexingBlocked() {
  return !isOfficialSiteUrl() && process.env.ALLOW_INDEXING !== 'true';
}
