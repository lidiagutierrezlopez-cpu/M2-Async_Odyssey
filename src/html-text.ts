export function toPlainText(html: string | null): string | null {
     if (!html) return null;
     const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
     const doc = new DOMParser().parseFromString(withBreaks, "text/html");
     const text = doc.body.textContent?.trim() ?? "";
     return text || null;
}
