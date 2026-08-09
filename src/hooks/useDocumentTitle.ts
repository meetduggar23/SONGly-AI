import { useEffect } from "react";
import { APP_NAME } from "@/constants";

/**
 * Sets the document title on mount and cleanup.
* Format: "Page — SONGly"
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME;
  }, [title]);
}
