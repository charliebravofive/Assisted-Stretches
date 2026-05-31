import { useEffect } from "react";

/**
 * Injects a JSON-LD script tag into <head>.
 * Accepts a single schema object or an array of schema objects.
 * Arrays are wrapped in an @graph block.
 */
export function useJsonLd(schema) {
  useEffect(() => {
    const id = "json-ld-schema-dynamic";
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    const payload = Array.isArray(schema)
      ? { "@context": "https://schema.org", "@graph": schema }
      : schema;
    el.textContent = JSON.stringify(payload);
    return () => {
      const s = document.getElementById(id);
      if (s) s.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
