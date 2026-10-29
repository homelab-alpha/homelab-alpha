// Shared constants and helpers for the SVG terminal session.
//
// The cards only use system fonts and inline shapes, because GitHub renders SVG
// images in a sandbox without access to external resources.

// Transparent margin around every card, in pixels.
export const INSET = 8;

export const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

// Card widths in pixels (without margin). `compact` is the narrow layout; the
// README picks it for screens below 760 pixels.
export const CARD_WIDTH = { full: 800, compact: 392 };

export function escapeXml(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>&"']/g, (character) => {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[character];
    });
}
