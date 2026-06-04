import { useEffect } from "react";

const CANONICAL_ROOT = "https://www.assistedstretches.com/";

export function usePageMeta({ title, description, path = "" }) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.name = "description";
      document.head.appendChild(desc);
    }
    desc.content = description;

    // Canonical — always point to root for a hash SPA.
    // Hash fragment URLs (#/page) are not valid canonical URLs per spec
    // and Google ignores hash fragments in canonicals anyway.
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = CANONICAL_ROOT;

    // Open Graph
    const setMeta = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.content = val;
    };
    setMeta('meta[property="og:title"]',       title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]',         CANONICAL_ROOT);

    // Twitter
    setMeta('meta[name="twitter:title"]',       title);
    setMeta('meta[name="twitter:description"]', description);
  }, [title, description, path]);
}
