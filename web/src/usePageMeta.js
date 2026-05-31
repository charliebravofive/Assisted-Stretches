import { useEffect } from "react";

export function usePageMeta({ title, description, path = "" }) {
  useEffect(() => {
    // Title
    document.title = title;

    // Description
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.name = "description";
      document.head.appendChild(desc);
    }
    desc.content = description;

    // Canonical
    const canonicalBase = "https://www.assistedstretches.com/";
    const canonicalHref = path ? `${canonicalBase}#/${path}` : canonicalBase;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;

    // Open Graph
    const setMeta = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.content = val;
    };
    setMeta('meta[property="og:title"]',       title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]',         canonicalHref);

    // Twitter
    setMeta('meta[name="twitter:title"]',       title);
    setMeta('meta[name="twitter:description"]', description);
  }, [title, description, path]);
}
