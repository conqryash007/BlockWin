/**
 * Subdomain detection utility for multi-tenant support.
 * Extracts the subdomain from a hostname at runtime.
 */

const MAIN_DOMAINS = ['blockwin.space', 'www.blockwin.space'];

/**
 * Extract subdomain from hostname.
 * Returns null for the main/root domain, the subdomain string otherwise.
 *
 * Examples:
 *   "site1.blockwin.space" → "site1"
 *   "blockwin.space"       → null
 *   "www.blockwin.space"   → null
 *   "localhost:3000"       → process.env.SUBDOMAIN or null
 */
export function getSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];

  if (host === 'localhost' || host.endsWith('.netlify.app')) {
    return process.env.SUBDOMAIN || null;
  }

  if (MAIN_DOMAINS.includes(host)) return null;

  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}
