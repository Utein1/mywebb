import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const element = document.getElementById(id);
      if (element) {
        window.setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 30);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash, location.key]);

  return null;
}
