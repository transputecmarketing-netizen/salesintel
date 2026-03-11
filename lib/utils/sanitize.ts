/**
 * Sanitize a string for safe display (prevent XSS).
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize a URL to prevent javascript: and data: protocol injection.
 */
export function sanitizeUrl(input: string): string {
  const trimmed = input.trim();

  // Only allow http, https, and mailto protocols
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    // If it's a relative URL, it's generally safe
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
    return '';
  }
}

/**
 * Sanitize an email address. Returns empty string if invalid.
 */
export function sanitizeEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) return '';

  // Additional checks
  if (trimmed.length > 254) return '';
  const [local, domain] = trimmed.split('@');
  if (local.length > 64) return '';
  if (domain.length > 253) return '';

  return trimmed;
}

/**
 * Sanitize a domain name. Returns empty string if invalid.
 */
export function sanitizeDomain(input: string): string {
  let trimmed = input.trim().toLowerCase();

  // Remove protocol if present
  trimmed = trimmed.replace(/^https?:\/\//, '');
  // Remove trailing slash and path
  trimmed = trimmed.split('/')[0];
  // Remove www. prefix
  trimmed = trimmed.replace(/^www\./, '');
  // Remove port
  trimmed = trimmed.split(':')[0];

  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(trimmed)) return '';

  if (trimmed.length > 253) return '';

  return trimmed;
}

/**
 * Sanitize a company name for safe use in searches and display.
 */
export function sanitizeCompanyName(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

/**
 * Sanitize a LinkedIn URL. Returns empty string if invalid.
 */
export function sanitizeLinkedInUrl(input: string): string {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    if (url.hostname !== 'linkedin.com' && url.hostname !== 'www.linkedin.com') {
      return '';
    }

    // Only allow /in/ and /company/ paths
    if (!url.pathname.startsWith('/in/') && !url.pathname.startsWith('/company/')) {
      return '';
    }

    // Reconstruct clean URL
    return `https://linkedin.com${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
}

/**
 * Sanitize a search query string.
 */
export function sanitizeSearchQuery(input: string): string {
  return input
    .trim()
    .replace(/[<>'";\\\0]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 500);
}

/**
 * Sanitize user-provided JSON input.
 */
export function sanitizeJsonInput(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return deepSanitizeObject(parsed);
  } catch {
    return null;
  }
}

function deepSanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = key.replace(/[<>'"]/g, '').slice(0, 100);

    if (typeof value === 'string') {
      result[sanitizedKey] = sanitizeHtml(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[sanitizedKey] = value;
    } else if (value === null) {
      result[sanitizedKey] = null;
    } else if (Array.isArray(value)) {
      result[sanitizedKey] = value.map((item) => {
        if (typeof item === 'string') return sanitizeHtml(item);
        if (typeof item === 'object' && item !== null) return deepSanitizeObject(item as Record<string, unknown>);
        return item;
      });
    } else if (typeof value === 'object') {
      result[sanitizedKey] = deepSanitizeObject(value as Record<string, unknown>);
    }
    // Skip functions, symbols, etc.
  }

  return result;
}

/**
 * Strip all HTML tags from a string.
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a phone number. Returns digits-only or empty string.
 */
export function sanitizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return digits;
}
