/**
 * lib/sanitize.ts
 * Multi-pass HTML sanitizer for server/client content rendering.
 * Prevents recursive tag bypasses (e.g. <scr<script>ipt>), dangerous protocols,
 * and event-handler injections (on*) while preserving safe presentation markup.
 */

const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
  'select', 'button', 'meta', 'link', 'base', 'style', 'svg', 'math',
  'applet', 'frame', 'frameset', 'template',
];

const DANGEROUS_PROTOCOLS = [
  'javascript:', 'vbscript:', 'data:text', 'data:application',
];

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let previous = '';
  let clean = html;

  // Multi-pass loop until fixed-point to counter recursive evasion patterns
  let passes = 0;
  while (clean !== previous && passes < 5) {
    previous = clean;
    passes++;

    // 1. Remove null bytes and dangerous control characters
    clean = clean.replace(/\0/g, '');

    // 2. Remove script and dangerous blocks completely (including content)
    for (const tag of DANGEROUS_TAGS) {
      const blockRegex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      clean = clean.replace(blockRegex, '');
      const selfClosingRegex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
      clean = clean.replace(selfClosingRegex, '');
    }

    // 3. Remove inline event handlers (onload, onerror, onclick, etc.)
    clean = clean.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 4. Remove malicious protocol schemes in attributes
    for (const proto of DANGEROUS_PROTOCOLS) {
      const protoRegex = new RegExp(`(?:href|src|action|dynsrc|lowsrc)\\s*=\\s*(?:"\\s*${proto}[^"]*"|'\\s*${proto}[^']*'|${proto}[^\\s>]+)`, 'gi');
      clean = clean.replace(protoRegex, '');
    }

    // 5. Block expression() or CSS-based javascript execution in style tags/attributes
    clean = clean.replace(/style\s*=\s*(?:"[^"]*expression\([^"]*"|'[^']*expression\([^']*')/gi, '');
  }

  return clean;
}
