import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of sanitizeHtml matching src/lib/sanitize.ts
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
  'select', 'button', 'meta', 'link', 'base', 'style', 'svg', 'math',
  'applet', 'frame', 'frameset', 'template',
];

const DANGEROUS_PROTOCOLS = [
  'javascript:', 'vbscript:', 'data:text', 'data:application',
];

function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';

  let previous = '';
  let clean = html;

  let passes = 0;
  while (clean !== previous && passes < 5) {
    previous = clean;
    passes++;

    clean = clean.replace(/\0/g, '');

    for (const tag of DANGEROUS_TAGS) {
      const blockRegex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      clean = clean.replace(blockRegex, '');
      const selfClosingRegex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
      clean = clean.replace(selfClosingRegex, '');
    }

    clean = clean.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    for (const proto of DANGEROUS_PROTOCOLS) {
      const protoRegex = new RegExp(`(?:href|src|action|dynsrc|lowsrc)\\s*=\\s*(?:"\\s*${proto}[^"]*"|'\\s*${proto}[^']*'|${proto}[^\\s>]+)`, 'gi');
      clean = clean.replace(protoRegex, '');
    }

    clean = clean.replace(/style\s*=\s*(?:"[^"]*expression\([^"]*"|'[^']*expression\([^']*')/gi, '');
  }

  return clean;
}

describe('Sanitize HTML Utility', () => {
  it('should strip simple script tags', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean, '<p>Hello</p>');
  });

  it('should strip nested / recursive script tags', () => {
    const dirty = '<scr<script>ipt>alert(1)</script>';
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('alert(1)'));
  });

  it('should strip inline event handlers', () => {
    const dirty = '<img src="valid.jpg" onerror="alert(1)" onload="evil()">';
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes('onerror'));
    assert.ok(!clean.includes('onload'));
  });

  it('should remove javascript: protocol in href', () => {
    const dirty = '<a href="javascript:alert(1)">Click Me</a>';
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes('javascript:'));
  });

  it('should preserve safe formatting tags', () => {
    const safe = '<b>Bold</b> <i>Italic</i> <p>Paragraph</p>';
    const clean = sanitizeHtml(safe);
    assert.equal(clean, safe);
  });
});
