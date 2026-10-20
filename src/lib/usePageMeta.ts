import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description?: string;
  image?: string;
}

function setMeta(selector: string, attribute: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    const match = selector.match(/meta\[(name|property)="([^"]+)"\]/);
    if (match) {
      element.setAttribute(match[1], match[2]);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, content);
}

export function usePageMeta({ title, description, image }: PageMetaOptions) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[property="og:title"]', "content", title);
    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
    }
    if (image) {
      setMeta('meta[property="og:image"]', "content", image);
    }
  }, [title, description, image]);
}
