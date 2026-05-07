import { useEffect } from "react";

export function useJsonLd(schema) {
  useEffect(() => {
    const id = "json-ld-schema";
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => { const s = document.getElementById(id); if (s) s.remove(); };
  }, []);
}
