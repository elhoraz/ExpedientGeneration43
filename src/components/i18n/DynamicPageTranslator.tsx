"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Regex for scripts and tokens that should never be translated:
 * - Arabic script (Quran, Hadith, prayers, existing Arabic text)
 * - Pure numbers, punctuation, currency, dates, times, math symbols
 * - Code, URLs, emails
 */
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const PURE_SYMBOLS_REGEX = /^[\d\s.,:;!?%&+\-*/=()#@$€£¥_<>|\\\[\]{}'"~`^•–—«»‹›]+$/;
const URL_EMAIL_REGEX = /(?:https?:\/\/|www\.|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

// Keep original node values in memory across re-renders
const originalTextMap = new WeakMap<Text, string>();
const nodeTargetLang = new WeakMap<Text, string>();

// Tags that must never have their text translated
const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "SVG",
  "CANVAS",
  "AUDIO",
  "VIDEO",
  "IFRAME",
  "I", // FontAwesome icons (<i className="fa-...">)
]);

// CSS selector for elements/ancestors that must never be translated
const SKIP_SELECTOR = [
  ".notranslate",
  "[data-no-auto-translate]",
  "[data-no-translate]",
  ".font-arabic",
  ".mushaf-15lines-wrapper",
  ".quran-text",
  ".mushaf-container",
  ".arabic-text",
  ".font-amiri",
  "[translate='no']",
].join(", ");

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true;
  if (IGNORED_TAGS.has(el.tagName)) return true;
  if (el.closest && el.closest(SKIP_SELECTOR)) return true;
  return false;
}

function shouldTranslateText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (PURE_SYMBOLS_REGEX.test(trimmed)) return false;
  if (ARABIC_REGEX.test(trimmed)) return false; // Never touch existing Arabic verses / prayers
  if (URL_EMAIL_REGEX.test(trimmed)) return false;
  return true;
}

export default function DynamicPageTranslator() {
  const { locale } = useLanguage();
  const pathname = usePathname();

  // In-memory cache for fast 0ms lookups: key = original trimmed text -> translated text
  const memoryCacheRef = useRef<Map<string, string>>(new Map());
  const currentLocaleRef = useRef<string>(locale);
  const isScanningRef = useRef<boolean>(false);
  const pendingBatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pending queue of text nodes waiting for translation from API
  const pendingNodesQueueRef = useRef<Map<string, Set<Text>>>(new Map());
  const pendingPlaceholdersQueueRef = useRef<Map<string, Set<HTMLInputElement | HTMLTextAreaElement>>>(new Map());

  // Synchronize current locale ref
  currentLocaleRef.current = locale;

  /**
   * Load cache from localStorage whenever target locale changes
   */
  const loadLocalCache = useCallback((targetLocale: string) => {
    if (typeof window === "undefined" || targetLocale === "id") return;
    try {
      const storageKey = `expedient_auto_i18n_${targetLocale}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null) {
          memoryCacheRef.current = new Map(Object.entries(parsed));
        }
      } else {
        memoryCacheRef.current = new Map();
      }
    } catch {
      memoryCacheRef.current = new Map();
    }
  }, []);

  /**
   * Save cache to localStorage (keeps maximum 2,000 phrases to stay under ~150KB)
   */
  const saveLocalCache = useCallback((targetLocale: string) => {
    if (typeof window === "undefined" || targetLocale === "id") return;
    try {
      const storageKey = `expedient_auto_i18n_${targetLocale}`;
      const entries = Array.from(memoryCacheRef.current.entries()).slice(-2000);
      const obj = Object.fromEntries(entries);
      localStorage.setItem(storageKey, JSON.stringify(obj));
    } catch {}
  }, []);

  /**
   * Restore all DOM text and placeholders to their original Indonesian values
   */
  const restoreOriginals = useCallback(() => {
    if (typeof document === "undefined") return;

    // Restore text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentNode = walker.nextNode() as Text | null;
    while (currentNode) {
      if (originalTextMap.has(currentNode)) {
        const orig = originalTextMap.get(currentNode)!;
        if (currentNode.nodeValue !== orig) {
          currentNode.nodeValue = orig;
        }
        nodeTargetLang.delete(currentNode);
      }
      currentNode = walker.nextNode() as Text | null;
    }

    // Restore input / textarea placeholders
    const inputsWithOrig = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input[data-i18n-orig-placeholder], textarea[data-i18n-orig-placeholder]"
    );
    inputsWithOrig.forEach((el) => {
      const orig = el.getAttribute("data-i18n-orig-placeholder");
      if (orig !== null && el.placeholder !== orig) {
        el.placeholder = orig;
      }
    });

    // Clear pending queues
    pendingNodesQueueRef.current.clear();
    pendingPlaceholdersQueueRef.current.clear();
  }, []);

  /**
   * Send collected batches to /api/translate
   */
  const flushPendingBatch = useCallback(async (targetLocale: string) => {
    if (targetLocale === "id") return;

    const allKeys = Array.from(
      new Set([
        ...pendingNodesQueueRef.current.keys(),
        ...pendingPlaceholdersQueueRef.current.keys(),
      ])
    );

    if (allKeys.length === 0) return;

    // Chunk into batches of up to 40 phrases
    const BATCH_SIZE = 40;
    for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
      const chunk = allKeys.slice(i, i + BATCH_SIZE);

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: chunk,
            to: targetLocale,
            from: "id",
          }),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const translations: Record<string, string> = data.translations || {};

        // If user already switched language while request was in-flight, abort updating
        if (currentLocaleRef.current !== targetLocale) return;

        // Apply translations
        for (const [origTrimmed, translated] of Object.entries(translations)) {
          if (!translated) continue;

          // Update memory cache
          memoryCacheRef.current.set(origTrimmed, translated);

          // Update waiting text nodes
          const nodeSet = pendingNodesQueueRef.current.get(origTrimmed);
          if (nodeSet) {
            nodeSet.forEach((textNode) => {
              if (textNode.isConnected && originalTextMap.has(textNode)) {
                const fullOrig = originalTextMap.get(textNode)!;
                const leading = fullOrig.match(/^\s*/)?.[0] || "";
                const trailing = fullOrig.match(/\s*$/)?.[0] || "";
                textNode.nodeValue = leading + translated + trailing;
                nodeTargetLang.set(textNode, targetLocale);
              }
            });
            pendingNodesQueueRef.current.delete(origTrimmed);
          }

          // Update waiting placeholders
          const placeholderSet = pendingPlaceholdersQueueRef.current.get(origTrimmed);
          if (placeholderSet) {
            placeholderSet.forEach((inputEl) => {
              if (inputEl.isConnected) {
                inputEl.placeholder = translated;
              }
            });
            pendingPlaceholdersQueueRef.current.delete(origTrimmed);
          }
        }

        saveLocalCache(targetLocale);
      } catch (err) {
        console.warn("[DynamicPageTranslator] Batch translation failed:", err);
      }
    }
  }, [saveLocalCache]);

  /**
   * Schedule batch flush with debounce
   */
  const scheduleBatchFlush = useCallback((targetLocale: string) => {
    if (pendingBatchTimeoutRef.current) {
      clearTimeout(pendingBatchTimeoutRef.current);
    }
    pendingBatchTimeoutRef.current = setTimeout(() => {
      flushPendingBatch(targetLocale);
    }, 150);
  }, [flushPendingBatch]);

  /**
   * Scan DOM text nodes and input placeholders, applying cached translations instantly
   * or queuing uncached phrases.
   */
  const scanAndTranslate = useCallback((targetLocale: string) => {
    if (typeof document === "undefined" || !document.body) return;
    if (targetLocale === "id") {
      restoreOriginals();
      return;
    }

    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      const cache = memoryCacheRef.current;
      let hasUncached = false;

      // 1. Scan Text Nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
            const val = node.nodeValue || "";
            if (!val.trim()) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let currentNode = walker.nextNode() as Text | null;
      while (currentNode) {
        // Record original Indonesian text if not yet recorded
        if (!originalTextMap.has(currentNode)) {
          originalTextMap.set(currentNode, currentNode.nodeValue || "");
        }

        const origFull = originalTextMap.get(currentNode)!;
        const trimmed = origFull.trim();

        // Check if node is valid for translation
        if (shouldTranslateText(trimmed)) {
          const currentLang = nodeTargetLang.get(currentNode);

          // Only translate if not already translated to current target locale
          if (currentLang !== targetLocale) {
            if (cache.has(trimmed)) {
              // 0ms INSTANT REPLACEMENT FROM CACHE!
              const translated = cache.get(trimmed)!;
              const leading = origFull.match(/^\s*/)?.[0] || "";
              const trailing = origFull.match(/\s*$/)?.[0] || "";
              currentNode.nodeValue = leading + translated + trailing;
              nodeTargetLang.set(currentNode, targetLocale);
            } else {
              // Queue for batch network translation
              if (!pendingNodesQueueRef.current.has(trimmed)) {
                pendingNodesQueueRef.current.set(trimmed, new Set());
              }
              pendingNodesQueueRef.current.get(trimmed)!.add(currentNode);
              hasUncached = true;
            }
          }
        }

        currentNode = walker.nextNode() as Text | null;
      }

      // 2. Scan Input & Textarea Placeholders
      const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input[placeholder], textarea[placeholder]"
      );

      inputs.forEach((el) => {
        if (shouldSkipElement(el)) return;

        if (!el.hasAttribute("data-i18n-orig-placeholder")) {
          el.setAttribute("data-i18n-orig-placeholder", el.placeholder);
        }

        const origPlaceholder = el.getAttribute("data-i18n-orig-placeholder") || "";
        const trimmed = origPlaceholder.trim();

        if (shouldTranslateText(trimmed)) {
          if (cache.has(trimmed)) {
            el.placeholder = cache.get(trimmed)!;
          } else {
            if (!pendingPlaceholdersQueueRef.current.has(trimmed)) {
              pendingPlaceholdersQueueRef.current.set(trimmed, new Set());
            }
            pendingPlaceholdersQueueRef.current.get(trimmed)!.add(el);
            hasUncached = true;
          }
        }
      });

      // If we found uncached phrases, flush the batch
      if (hasUncached) {
        scheduleBatchFlush(targetLocale);
      }
    } finally {
      isScanningRef.current = false;
    }
  }, [restoreOriginals, scheduleBatchFlush]);

  // Effect 1: Handle locale change or route change
  useEffect(() => {
    if (locale === "id") {
      restoreOriginals();
      return;
    }

    loadLocalCache(locale);
    // Slight tick to let Next.js hydrate/render new route elements
    const timer = setTimeout(() => {
      scanAndTranslate(locale);
    }, 40);

    return () => clearTimeout(timer);
  }, [locale, pathname, loadLocalCache, restoreOriginals, scanAndTranslate]);

  // Effect 2: MutationObserver to detect dynamically added DOM nodes (modals, infinite scroll, client nav)
  useEffect(() => {
    if (typeof window === "undefined" || !document.body) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const observer = new MutationObserver((mutations) => {
      if (currentLocaleRef.current === "id") return;

      // Only re-scan if child elements were added or removed
      let hasAddedNodes = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length > 0) {
          hasAddedNodes = true;
          break;
        }
      }

      if (hasAddedNodes) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          scanAndTranslate(currentLocaleRef.current);
        }, 120);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false, // Prevents looping when we change textNode.nodeValue!
    });

    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pendingBatchTimeoutRef.current) clearTimeout(pendingBatchTimeoutRef.current);
    };
  }, [scanAndTranslate]);

  // Invisible helper component
  return null;
}
