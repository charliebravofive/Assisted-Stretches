import { useEffect } from "react";

export function usePageMeta({ title, description }) {
  useEffect(() => {
    document.title = title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.name = "description";
      document.head.appendChild(desc);
    }
    desc.content = description;

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = description;

    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = title;

    let twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.content = description;
  }, [title, description]);
}
