/**
 * lib/sanitize.ts
 * Strict allowlist-based HTML sanitizer for server/client content rendering.
 * Prevents XSS via unknown tags, event handlers (on*), entity-encoded javascript:/data: URIs,
 * and CSS expression/url() injections while preserving safe presentation markup.
 */

const ALLOWED_TAGS = new Set([
  "b", "strong", "i", "em", "u", "s", "br", "p", "span", "div",
  "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "code", "pre", "hr", "small", "sub", "sup",
]);

const BLOCK_WITH_CONTENT_TAGS = [
  "script", "iframe", "object", "embed", "style", "svg", "math",
  "applet", "frame", "frameset", "template", "head", "title", "textarea",
];

function decodeHtmlEntitiesForCheck(val: string): string {
  return val
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/[\x00-\x20]+/g, "")
    .toLowerCase();
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  let clean = html.replace(/\0/g, "");

  // 1. Remove dangerous container blocks and their inner contents
  let prev = "";
  let passes = 0;
  while (clean !== prev && passes < 4) {
    prev = clean;
    passes++;
    for (const tag of BLOCK_WITH_CONTENT_TAGS) {
      const blockRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
      clean = clean.replace(blockRegex, "");
      const openRegex = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
      clean = clean.replace(openRegex, "");
    }
  }

  // 2. Enforce strict tag & attribute allowlist
  clean = clean.replace(/<\/?([a-zA-Z0-9:-]+)([^>]*)>/g, (fullMatch, rawTagName, rawAttrs) => {
    const tagName = String(rawTagName).toLowerCase();
    const isClosing = fullMatch.startsWith("</");

    if (!ALLOWED_TAGS.has(tagName)) {
      return "";
    }

    if (isClosing) {
      return `</${tagName}>`;
    }

    const safeAttrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9_-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = match[1].toLowerCase();
      const attrVal = (match[2] ?? match[3] ?? match[4] ?? "").trim();

      if (attrName.startsWith("on") || attrName === "srcdoc") continue;

      if (attrName === "class") {
        const cleanClass = attrVal.replace(/[^a-zA-Z0-9_\-\s]/g, "");
        if (cleanClass) safeAttrs.push(`class="${cleanClass}"`);
      } else if (attrName === "style") {
        const decodedStyle = decodeHtmlEntitiesForCheck(attrVal);
        if (
          !decodedStyle.includes("expression") &&
          !decodedStyle.includes("javascript:") &&
          !decodedStyle.includes("vbscript:") &&
          !decodedStyle.includes("url(") &&
          !decodedStyle.includes("-moz-binding") &&
          !decodedStyle.includes("behavior:")
        ) {
          const escapedStyle = attrVal.replace(/"/g, "&quot;");
          safeAttrs.push(`style="${escapedStyle}"`);
        }
      } else if (tagName === "a" && attrName === "href") {
        const decodedHref = decodeHtmlEntitiesForCheck(attrVal);
        if (
          decodedHref.startsWith("https://") ||
          decodedHref.startsWith("http://") ||
          decodedHref.startsWith("mailto:") ||
          (decodedHref.startsWith("/") && !decodedHref.startsWith("//")) ||
          decodedHref.startsWith("#")
        ) {
          const escapedHref = attrVal.replace(/"/g, "&quot;");
          safeAttrs.push(`href="${escapedHref}"`);
          safeAttrs.push(`rel="noopener noreferrer"`);
        }
      } else if (tagName === "a" && attrName === "target") {
        if (attrVal === "_blank" || attrVal === "_self") {
          safeAttrs.push(`target="${attrVal}"`);
        }
      }
    }

    const selfClose = tagName === "br" || tagName === "hr" ? " /" : "";
    return `<${tagName}${safeAttrs.length ? " " + safeAttrs.join(" ") : ""}${selfClose}>`;
  });

  return clean;
}
